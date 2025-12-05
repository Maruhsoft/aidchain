-- File: NftPolicy.hs
-- Location: contracts/
-- Description: NFT minting policy for verified campaigns
-- Issues NFTs as proof of campaign verification, backend syncs verification status

{-# LANGUAGE DataKinds #-}
{-# LANGUAGE DeriveAnyClass #-}
{-# LANGUAGE DeriveGeneric #-}
{-# LANGUAGE OverloadedStrings #-}
{-# LANGUAGE TemplateHaskell #-}
{-# LANGUAGE TypeFamilies #-}

module NftPolicy where

import Plutus.V2.Ledger.Api
import Plutus.V2.Ledger.Contexts
import PlutusTx qualified
import PlutusTx.Prelude
import Data.Aeson (ToJSON, FromJSON)
import GHC.Generics (Generic)

-- NFT Metadata for verified campaigns
data NftMetadata = NftMetadata
  { nftCampaignId :: BuiltinByteString
  , nftCampaignName :: BuiltinByteString
  , nftVerificationDate :: POSIXTime
  , nftIssuer :: PubKeyHash
  }
  deriving (Show, Generic)

PlutusTx.unstableMakeIsData ''NftMetadata

-- Minting/Burning Redeemer - Backend triggers NFT lifecycle
data MintingRedeemer 
  = MintNft NftMetadata      -- POST /campaigns/{id}/mint-nft
  | BurnNft BuiltinByteString -- POST /campaigns/{id}/burn-nft
  deriving (Show, Generic)

PlutusTx.unstableMakeIsData ''MintingRedeemer

-- NFT Minting Policy - Controls NFT creation and destruction
{-# INLINABLE validateNftMinting #-}
validateNftMinting :: MintingRedeemer -> ScriptContext -> Bool
validateNftMinting redeemer ctx = case redeemer of
  
  -- MintNft: Creates single NFT per verified campaign
  MintNft metadata ->
    traceIfFalse "NFT must be minted exactly once" (validateMintQuantity ctx 1) &&
    traceIfFalse "Campaign ID must be valid" (lengthOfByteString (nftCampaignId metadata) > 0) &&
    traceIfFalse "Campaign name required" (lengthOfByteString (nftCampaignName metadata) > 0) &&
    traceIfFalse "Issuer must sign minting" (txSignedBy (scriptContextTxInfo ctx) (nftIssuer metadata)) &&
    traceIfFalse "Metadata properly encoded in output" (validateMetadataEncoding metadata ctx)
  
  -- BurnNft: Destroys NFT (campaign cancellation/revocation)
  BurnNft campaignId ->
    traceIfFalse "NFT must be burned exactly once" (validateMintQuantity ctx (-1)) &&
    traceIfFalse "Campaign ID valid for burn" (lengthOfByteString campaignId > 0) &&
    traceIfFalse "Admin authorization required" (validateBurnAuthorization ctx)

-- Validates minting quantity matches expected amount
{-# INLINABLE validateMintQuantity #-}
validateMintQuantity :: ScriptContext -> Integer -> Bool
validateMintQuantity ctx expectedQuantity =
  let minted = txInfoMint (scriptContextTxInfo ctx)
      flatMinted = flattenValue minted
      ownSymbol = ownCurrencySymbol ctx
  in case flatMinted of
    [(symbol, tokenName, quantity)] ->
      symbol == ownSymbol &&
      tokenName == "" &&
      quantity == expectedQuantity
    _ -> False

-- Validates metadata is properly encoded in transaction outputs
{-# INLINABLE validateMetadataEncoding #-}
validateMetadataEncoding :: NftMetadata -> ScriptContext -> Bool
validateMetadataEncoding metadata ctx =
  let outputs = txInfoOutputs (scriptContextTxInfo ctx)
  in any (\out -> validateOutputDatum metadata out) outputs

-- Validates output contains correct NFT metadata
{-# INLINABLE validateOutputDatum #-}
validateOutputDatum :: NftMetadata -> TxOut -> Bool
validateOutputDatum metadata out =
  case txOutData out of
    OutputDatum d ->
      case PlutusTx.fromBuiltinData d of
        Just (encodedMetadata :: NftMetadata) ->
          nftCampaignId encodedMetadata == nftCampaignId metadata &&
          nftCampaignName encodedMetadata == nftCampaignName metadata
        _ -> False
    _ -> False

-- Validates burn authorization (platform admin only)
{-# INLINABLE validateBurnAuthorization #-}
validateBurnAuthorization :: ScriptContext -> Bool
validateBurnAuthorization ctx =
  let txInfo = scriptContextTxInfo ctx
      signatories = txInfoSignatories txInfo
  in any (\signer -> signer `elem` signatories) [PubKeyHash "admin_key_placeholder"]

-- Policy entry point
policy :: MintingRedeemer -> ScriptContext -> Bool
policy = validateNftMinting

-- Helper to get bytestring length
{-# INLINABLE lengthOfByteString #-}
lengthOfByteString :: BuiltinByteString -> Bool
lengthOfByteString bs = PlutusTx.lengthOfByteString bs > 0