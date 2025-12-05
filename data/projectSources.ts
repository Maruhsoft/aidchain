
export const FOLDER_STRUCTURE = `aidchain/
├── contracts/               # Plutus Smart Contracts
│   ├── AidChain.hs          # Validator Logic
│   ├── NftPolicy.hs         # Minting Policy
│   └── aidchain.cabal       # Config
├── backend/                 # Express.js API
│   ├── src/
│   │   ├── app.js           
│   │   ├── server.js        
│   │   ├── services/        # Logic + Plutus Data Gen
│   │   ├── controllers/     
│   │   ├── routes/          
│   │   └── db.js            
│   └── package.json
├── frontend/                # React DApp
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
├── scripts/                 
│   ├── deploy.sh            
│   ├── seed_wallets.sh
│   └── testScenarios.js     
└── README.md`;

export const PACKAGE_JSON = `{
  "name": "aidchain-backend",
  "version": "1.0.0",
  "main": "src/server.js",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "@blockfrost/blockfrost-js": "^5.2.0",
    "lucid-cardano": "^0.10.7",
    "helmet": "^7.0.0"
  }
}`;

export const PLUTUS_CONTRACT = `module AidChain.Validator where
-- ... (Imports)

data CampaignDatum = CampaignDatum
    { creator :: PubKeyHash
    , goal    :: Integer
    , raised  :: Integer
    , state   :: Integer -- 0:Fundraising, 1:Locked, 2:Verified
    , auditor :: PubKeyHash 
    }

data CampaignAction = Donate | SubmitProof | Verify | Release

mkValidator :: CampaignDatum -> CampaignAction -> ScriptContext -> Bool
mkValidator dat action ctx = case action of
    Donate -> state dat == 0
    SubmitProof -> state dat == 1 && raised dat >= goal dat
    Verify -> state dat == 1 && txSignedBy info (auditor dat)
    Release -> state dat == 2
-- ... (Boilerplate)
`;

export const EXPRESS_BACKEND = `
const CampaignService = {
  create: (data) => {
    // ... validation ...
    const plutusDatum = {
      constructor: 0,
      fields: [
        { bytes: "ngo_pubkey_hash" }, 
        { int: targetAmount * 1000000 }, 
        { int: 0 }, 
        { int: 0 } // State 0
      ]
    };
    // ... save to DB ...
    return { campaign, plutusDatum };
  },

  verify: (campaignId) => {
    // ... validate state ...
    
    // Construct Verify Redeemer
    const plutusRedeemer = { constructor: 2, fields: [] };
    
    return { campaign, plutusRedeemer };
  }
};
`;

export const DEPLOY_SCRIPT = `#!/bin/bash
NETWORK=$1
echo ">> Compiling Smart Contracts..."
cabal build
echo ">> Building Address for $NETWORK..."
cardano-cli address build \\
  --payment-script-file ./contracts/aidchain.plutus \\
  --testnet-magic 1 \\
  --out-file ./contracts/aidchain.addr
`;
