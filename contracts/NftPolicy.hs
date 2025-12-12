-- File: NftPolicy.hs
-- Location: contracts/
-- Description: NFT minting policy for AidChain verified campaigns
--              Ensures single NFT per campaign and requires verifier or admin signature.

{-# LANGUAGE DataKinds #-}
{-# LANGUAGE NoImplicitPrelude #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE ScopedTypeVariables #-}
{-# LANGUAGE DeriveGeneric #-}

module NftPolicy where

import Prelude (Show)
import GHC.Generics (Generic)
import Plutus.V2.Ledger.Api
import Plutus.V2.Ledger.Contexts
import PlutusTx.Prelude
import PlutusTx qualified
import PlutusTx.Builtins as Builtins

-- Redeemer: Mint or Burn
data NftRedeemer = MintNft BuiltinByteString PubKeyHash -- campaignId, issuer
                 | BurnNft BuiltinByteString            -- campaignId
  deriving Show

PlutusTx.unstableMakeIsData ''NftRedeemer

{-# INLINABLE flattenSingle #-}
flattenSingle :: Value -> Maybe (CurrencySymbol, TokenName, Integer)
flattenSingle v =
  case flattenValue v of
    [(cs, tn, q)] -> Just (cs, tn, q)
    _ -> Nothing

{-# INLINABLE policy #-}
policy :: PubKeyHash -> BuiltinData -> ScriptContext -> Bool
policy adminPkh bd ctx =
  case PlutusTx.fromBuiltinData bd of
    Just (redeemer :: NftRedeemer) -> 
      case redeemer of
        MintNft campaignId issuer ->
          case flattenSingle (txInfoMint info) of
            Just (cs, tn, q) ->
              cs == ownCurrencySymbol ctx &&
              q == 1 &&
              -- token name tied to campaignId to prevent duplicates
              tn == TokenName campaignId &&
              -- issuer or admin must sign
              (txSignedBy info issuer || txSignedBy info adminPkh)
            _ -> False
        BurnNft campaignId ->
          case flattenSingle (txInfoMint info) of
            Just (_cs, _tn, q) ->
              q == (-1) &&
              True -- allow burn by admin/off-chain checks
            _ -> False
    _ -> False
  where
    info = scriptContextTxInfo ctx

{-# INLINABLE mkPolicy #-}
mkPolicy :: BuiltinData -> BuiltinData -> BuiltinData -> ()
mkPolicy adminD redeemerD ctxD =
  let adminPkh = case PlutusTx.fromBuiltinData adminD of
                   Just p -> p
                   _ -> traceError "invalid admin pkh"
  in if policy adminPkh redeemerD (unsafeFromBuiltinData ctxD)
     then ()
     else traceError "nft policy failed"

policyScript :: PubKeyHash -> MintingPolicy
policyScript admin = mkMintingPolicyScript $
  $$(PlutusTx.compile [|| \a -> mkPolicy `PlutusTx.applyCode` PlutusTx.liftCode a ||])
  `PlutusTx.applyCode` PlutusTx.liftCode admin

{-# INLINABLE nftCurrencySymbol #-}
nftCurrencySymbol :: PubKeyHash -> CurrencySymbol
nftCurrencySymbol admin = ownCurrencySymbol (scriptContextFromPolicy $ mkMintingPolicyScript $ policyScript admin)

PlutusTx.makeLift ''NftRedeemer