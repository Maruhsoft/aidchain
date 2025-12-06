-- File: AidChain.hs
-- Location: contracts/
-- Description: Main campaign validator implementing state machine logic (Fundraising -> Locked -> Verified -> Disbursed)
-- This contract handles campaign lifecycle, fund collection, verification, and disbursement

{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveAnyClass #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeFamilies #-}

module AidChain where

import Plutus.V2.Ledger.Api
import Plutus.V2.Ledger.Contexts
import PlutusTx qualified
import PlutusTx.Prelude
import Prelude (Show, String)
import Data.Aeson (ToJSON, FromJSON)
import GHC.Generics (Generic)

-- Campaign State Machine
data CampaignState = Fundraising | Locked | Verified | Disbursed
  deriving (Show, Generic, Eq, Ord)
  deriving anyclass (ToJSON, FromJSON)

PlutusTx.unstableMakeIsData ''CampaignState
PlutusTx.makeLift ''CampaignState

-- Campaign Datum - Stores campaign metadata and state
data CampaignDatum = CampaignDatum
  { campaignId :: BuiltinByteString
  , campaignOwner :: PubKeyHash
  , targetAmount :: Integer
  , collectedAmount :: Integer
  , state :: CampaignState
  , deadline :: POSIXTime
  , verificationRequired :: Bool
  , beneficiaryAddress :: PubKeyHash
  }
  deriving (Show, Generic)

PlutusTx.unstableMakeIsData ''CampaignDatum

-- Campaign Redeemer Actions - Backend API actions mapped to on-chain operations
data CampaignRedeemer
  = Contribute Integer         -- POST /campaigns/{id}/contribute
  | LockFunds                  -- POST /campaigns/{id}/lock
  | VerifyFunds String         -- POST /campaigns/{id}/verify (verification proof)
  | Disburse                   -- POST /campaigns/{id}/disburse
  | Refund                     -- POST /campaigns/{id}/refund
  deriving (Show, Generic)

PlutusTx.unstableMakeIsData ''CampaignRedeemer

-- Main Validator Logic - Implements backend validation rules
{-# INLINABLE validateCampaign #-}
validateCampaign :: CampaignDatum -> CampaignRedeemer -> ScriptContext -> Bool
validateCampaign datum redeemer ctx = case redeemer of
  
  -- Contribute: Accepts contributions during fundraising period
  Contribute amount ->
    traceIfFalse "Invalid contribution amount" (amount > 0) &&
    traceIfFalse "Campaign must be in Fundraising state" (state datum == Fundraising) &&
    traceIfFalse "Deadline not exceeded" (txInfoValidRange (scriptContextTxInfo ctx) `contains` deadline datum) &&
    traceIfFalse "Updated collection amount correct" (validateContributionUpdate datum amount ctx)
  
  -- LockFunds: Freezes fundraising when target reached
  LockFunds ->
    traceIfFalse "Campaign must be in Fundraising state" (state datum == Fundraising) &&
    traceIfFalse "Target amount reached" (collectedAmount datum >= targetAmount datum) &&
    traceIfFalse "Must be signed by campaign owner" (txSignedBy (scriptContextTxInfo ctx) (campaignOwner datum)) &&
    traceIfFalse "Output state must be Locked" (validateStateTransition datum Locked ctx)
  
  -- VerifyFunds: Campaign owner submits verification proof
  VerifyFunds verificationHash ->
    traceIfFalse "Campaign must be in Locked state" (state datum == Locked) &&
    traceIfFalse "Verification required for this campaign" (verificationRequired datum) &&
    traceIfFalse "Must be signed by campaign owner" (txSignedBy (scriptContextTxInfo ctx) (campaignOwner datum)) &&
    traceIfFalse "Invalid verification hash" (validateVerificationHash verificationHash) &&
    traceIfFalse "Output state must be Verified" (validateStateTransition datum Verified ctx)
  
  -- Disburse: Transfers funds to beneficiary after verification
  Disburse ->
    traceIfFalse "Campaign must be in Verified state" (state datum == Verified) &&
    traceIfFalse "Must be signed by campaign owner" (txSignedBy (scriptContextTxInfo ctx) (campaignOwner datum)) &&
    traceIfFalse "Funds transferred to beneficiary" (validateFundTransfer datum ctx) &&
    traceIfFalse "Output state must be Disbursed" (validateStateTransition datum Disbursed ctx)
  
  -- Refund: Returns funds to contributors if campaign fails
  Refund ->
    traceIfFalse "Campaign must be in Fundraising state" (state datum == Fundraising) &&
    traceIfFalse "Deadline must be exceeded" (not $ txInfoValidRange (scriptContextTxInfo ctx) `contains` deadline datum) &&
    traceIfFalse "Target not reached for refund" (collectedAmount datum < targetAmount datum)

-- Validates contribution amount updates
{-# INLINABLE validateContributionUpdate #-}
validateContributionUpdate :: CampaignDatum -> Integer -> ScriptContext -> Bool
validateContributionUpdate datum amount ctx =
  let txInfo = scriptContextTxInfo ctx
      -- Check output datum has updated collection amount
      outputs = getContinuingOutputs ctx
  in case outputs of
    [output] -> 
      let outputDatum = case outputDatum (txOutData output) of
            OutputDatum d -> d
            _ -> error ()
      in case PlutusTx.fromBuiltinData (getDatum outputDatum) of
        Just (newDatum :: CampaignDatum) ->
          collectedAmount newDatum == collectedAmount datum + amount
        _ -> False
    _ -> False

-- Validates state transitions
{-# INLINABLE validateStateTransition #-}
validateStateTransition :: CampaignDatum -> CampaignState -> ScriptContext -> Bool
validateStateTransition datum newState ctx =
  let outputs = getContinuingOutputs ctx
  in case outputs of
    [output] ->
      case PlutusTx.fromBuiltinData (getDatum (txOutData output)) of
        Just (newDatum :: CampaignDatum) ->
          state newDatum == newState &&
          campaignId newDatum == campaignId datum &&
          campaignOwner newDatum == campaignOwner datum
        _ -> False
    _ -> False

-- Validates verification hash format
{-# INLINABLE validateVerificationHash #-}
validateVerificationHash :: String -> Bool
validateVerificationHash hash = lengthOfByteString (stringToBuiltin hash) > 0

-- Validates fund transfer to beneficiary
{-# INLINABLE validateFundTransfer #-}
validateFundTransfer :: CampaignDatum -> ScriptContext -> Bool
validateFundTransfer datum ctx =
  let txInfo = scriptContextTxInfo ctx
      outputs = txInfoOutputs txInfo
      beneficiaryValue = collectedAmount datum
  in any (\out -> valueContains (txOutValue out) (Ada.lovelaceValueOf beneficiaryValue)) outputs

-- Main validator entry point
validator :: CampaignDatum -> CampaignRedeemer -> ScriptContext -> Bool
validator = validateCampaign

{-# INLINABLE stringToBuiltin #-}
stringToBuiltin :: String -> BuiltinByteString
stringToBuiltin s = PlutusTx.encodeUtf8 (PlutusTx.pack s)