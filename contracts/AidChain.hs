-- File: AidChain.hs
-- Location: contracts/
-- Description: AidChain campaign validator - full state-machine validator
--              Enforces: Fundraising -> Locked -> Verified -> Disbursed
--              Includes verifier authorization, CID validation, and robust state checks.

{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveAnyClass #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE LambdaCase #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeApplications #-}
{-# LANGUAGE TypeFamilies #-}
{-# LANGUAGE NoImplicitPrelude #-}

module AidChain where

import Prelude (Show, String)
import GHC.Generics (Generic)
import Data.Aeson (ToJSON, FromJSON)

import Plutus.V2.Ledger.Api
import Plutus.V2.Ledger.Contexts
import PlutusTx (BuiltinData, compile, applyCode, liftCode)
import PlutusTx qualified
import PlutusTx.Prelude

-- Campaign State
data CampaignState = Fundraising | Locked | Verified | Disbursed
  deriving (Show, Generic)

PlutusTx.unstableMakeIsData ''CampaignState
PlutusTx.makeLift ''CampaignState

-- Datum stored at script UTxO
data CampaignDatum = CampaignDatum
  { cdCampaignId        :: BuiltinByteString
  , cdOwner             :: PubKeyHash           -- NGO owner
  , cdBeneficiary       :: PubKeyHash           -- Beneficiary address
  , cdTargetAmount      :: Integer
  , cdCollectedAmount   :: Integer
  , cdState             :: CampaignState
  , cdDeadline          :: POSIXTime
  , cdVerificationCID   :: BuiltinByteString    -- ipfs://CID or empty until submitted
  , cdVerifier          :: PubKeyHash           -- Authorized verifier (required to approve)
  , cdNftMinted         :: Bool
  }
  deriving (Show, Generic)

PlutusTx.unstableMakeIsData ''CampaignDatum
PlutusTx.makeLift ''CampaignDatum

-- Redeemer actions from backend
data CampaignRedeemer
  = Contribute Integer                 -- Add contribution (off-chain tx must provide funds)
  | LockFunds                          -- Lock campaign when target reached
  | SubmitEvidence BuiltinByteString   -- Submit IPFS CID (e.g. "ipfs://Qm...")
  | ApproveVerification                -- Verifier approves evidence (must be signed by cdVerifier)
  | RejectVerification BuiltinByteString -- Verifier rejects with reason
  | Disburse                           -- Owner disburses funds to beneficiary
  | Refund                             -- Refund contributors after deadline when target not reached
  deriving (Show, Generic)

PlutusTx.unstableMakeIsData ''CampaignRedeemer
PlutusTx.makeLift ''CampaignRedeemer

-- Helper: convert Haskell String to BuiltinByteString (off-chain only)
{-# INLINABLE stringToBuiltin #-}
stringToBuiltin :: String -> BuiltinByteString
stringToBuiltin s = encodeUtf8 (toBuiltin s)

-- Helper: check prefix "ipfs://"
{-# INLINABLE hasIpfsPrefix #-}
hasIpfsPrefix :: BuiltinByteString -> Bool
hasIpfsPrefix bs =
  let pref = encodeUtf8 (toBuiltin ("ipfs://" :: String))
  in sliceByteString 0 (lengthOfByteString pref) bs == pref

-- Get the continuing output datum (script output that continues the contract)
{-# INLINABLE getContinuingDatum #-}
getContinuingDatum :: ScriptContext -> Maybe CampaignDatum
getContinuingDatum ctx =
    case getContinuingOutputs ctx of
      [o] -> case txOutDatum o of
               OutputDatum _ -> case txOutDatum o of
                 OutputDatum d -> PlutusTx.fromBuiltinData d
                 _ -> Nothing
               _ -> Nothing
      _ -> Nothing

-- Validate that continuing datum exists and produced state equals expected
{-# INLINABLE checkStateTransition #-}
checkStateTransition :: CampaignDatum -> CampaignState -> ScriptContext -> Bool
checkStateTransition old expected ctx =
  case getContinuingDatum ctx of
    Just new -> cdState new == expected &&
                cdCampaignId new == cdCampaignId old &&
                cdOwner new == cdOwner old &&
                cdTargetAmount new == cdTargetAmount old
    _ -> False

-- Validate contribution: ensure continuing datum collectedAmount increased by amount
{-# INLINABLE validateContribution #-}
validateContribution :: CampaignDatum -> Integer -> ScriptContext -> Bool
validateContribution old amt ctx =
  amt > 0 &&
  cdState old == Fundraising &&
  contains (txInfoValidRange $ scriptContextTxInfo ctx) (to $ cdDeadline old) == False `traceIfFalse` "deadline passed" -- ensure not past deadline (off-chain range handling)
  &&
  case getContinuingDatum ctx of
    Just new -> cdCollectedAmount new == cdCollectedAmount old + amt &&
                cdState new == Fundraising
    _ -> False

-- Validate submit evidence (CID format)
{-# INLINABLE validateSubmitEvidence #-}
validateSubmitEvidence :: CampaignDatum -> BuiltinByteString -> ScriptContext -> Bool
validateSubmitEvidence old cid _ctx =
  cdState old == Locked &&
  hasIpfsPrefix cid &&
  lengthOfByteString cid > 8 -- basic length check

-- Validate approval: must be signed by verifier and move to Verified
{-# INLINABLE validateApproval #-}
validateApproval :: CampaignDatum -> ScriptContext -> Bool
validateApproval old ctx =
  cdState old == Locked &&
  txSignedBy (scriptContextTxInfo ctx) (cdVerifier old) &&
  checkStateTransition old Verified ctx

-- Validate disburse: must be signed by owner, state Verified, and funds transferred to beneficiary
{-# INLINABLE validateDisburse #-}
validateDisburse :: CampaignDatum -> ScriptContext -> Bool
validateDisburse old ctx =
  cdState old == Verified &&
  txSignedBy (scriptContextTxInfo ctx) (cdOwner old) &&
  checkStateTransition old Disbursed ctx &&
  -- ensure beneficiary receives at least collectedAmount in outputs
  let info = scriptContextTxInfo ctx
      outputs = txInfoOutputs info
      target = cdCollectedAmount old
      receives = any (\o -> txOutAddress o == pubKeyHashAddress (cdBeneficiary old) && valueOf (txOutValue o) adaSymbol adaToken >= target) outputs
  in receives

-- Validate refund: only when deadline passed and target not reached
{-# INLINABLE validateRefund #-}
validateRefund :: CampaignDatum -> ScriptContext -> Bool
validateRefund old ctx =
  cdState old == Fundraising &&
  cdCollectedAmount old < cdTargetAmount old &&
  -- deadline passed
  contains (txInfoValidRange $ scriptContextTxInfo ctx) (from $ cdDeadline old) &&
  True

-- Main validator
{-# INLINABLE validateCampaign #-}
validateCampaign :: CampaignDatum -> CampaignRedeemer -> ScriptContext -> Bool
validateCampaign datum redeemer ctx =
  case redeemer of
    Contribute amt -> validateContribution datum amt ctx
    LockFunds ->
      cdState datum == Fundraising &&
      cdCollectedAmount datum >= cdTargetAmount datum &&
      txSignedBy (scriptContextTxInfo ctx) (cdOwner datum) &&
      checkStateTransition datum Locked ctx
    SubmitEvidence cid ->
      validateSubmitEvidence datum cid ctx &&
      -- ensure continuing datum contains CID
      case getContinuingDatum ctx of
        Just new -> cdVerificationCID new == cid && cdState new == Locked
        _ -> False
    ApproveVerification ->
      validateApproval datum ctx
    RejectVerification _reason ->
      -- verifier signs rejection, state remains Locked or returns to Fundraising if needed
      cdState datum == Locked &&
      txSignedBy (scriptContextTxInfo ctx) (cdVerifier datum) &&
      -- continuing datum should remain Locked (owner will resubmit)
      case getContinuingDatum ctx of
        Just new -> cdState new == Locked
        _ -> False
    Disburse -> validateDisburse datum ctx
    Refund -> validateRefund datum ctx

-- Boilerplate to compile validator
{-# INLINABLE mkValidator #-}
mkValidator :: BuiltinData -> BuiltinData -> BuiltinData -> ()
mkValidator d r ctx = case PlutusTx.fromBuiltinData d of
  Just datum -> case PlutusTx.fromBuiltinData r of
    Just redeemer -> if validateCampaign datum redeemer (unsafeFromBuiltinData ctx)
                      then ()
                      else traceError "validation failed"
    _ -> traceError "invalid redeemer"
  _ -> traceError "invalid datum"

validatorInstance :: Validator
validatorInstance = Validator $ mkValidatorScript $$(PlutusTx.compile [|| mkValidator ||])

validatorHash :: ValidatorHash
validatorHash = validatorHash validatorInstance

validatorAddress :: Address
validatorAddress = scriptHashAddress validatorHash

PlutusTx.makeIsDataIndexed ''CampaignRedeemer [('Contribute,0),('LockFunds,1),('SubmitEvidence,2),('ApproveVerification,3),('RejectVerification,4),('Disburse,5),('Refund,6)]
PlutusTx.makeIsDataIndexed ''CampaignDatum [('CampaignDatum,0)]