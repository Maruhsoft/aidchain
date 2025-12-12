# AidChain Quick Reference

## Development Commands

### Start Backend
```powershell
cd backend
npm install
npm run dev
# Runs on http://localhost:3001/api
```

### Run Tests (Local)
```powershell
# Simulation mode (default, no network needed)
node scripts/testScenarios.js

# With on-chain assertion checks
$env:ASSERT_ONCHAIN='true'
node scripts/testScenarios.js

# Using cardano-cli (dry-run: print commands)
$env:USE_CARDANO_CLI='true'
$env:RUN_CARDANO_CLI='false'
node scripts/testScenarios.js

# Using cardano-cli (real: requires node + keys)
$env:USE_CARDANO_CLI='true'
$env:RUN_CARDANO_CLI='true'
$env:PAYER_ADDR='addr_test1vz...'
$env:VERIFIER_SKEY='keys/verifier-payment.skey'
$env:ADMIN_SKEY='keys/admin-payment.skey'
$env:OWNER_SKEY='keys/creator-payment.skey'
node scripts/testScenarios.js
```

### Compile Smart Contracts
```bash
cd contracts
cabal update
cabal build all
cabal test all  # Run tests
```

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `ONCHAIN_HELPER` | Helper script path | `./scripts/onchain-helper.sh` |
| `USE_CARDANO_CLI` | Enable cardano-cli | `true` / `false` |
| `RUN_CARDANO_CLI` | Execute cardano-cli | `true` / `false` |
| `ASSERT_ONCHAIN` | Enforce on-chain assertions | `true` / `false` |
| `VERIFIER_KEY` | Verifier's PubKey | `test-verifier-key` |
| `API_URL` | Backend API endpoint | `http://localhost:3001/api` |

## API Endpoints

### Campaign Management
```
POST   /api/campaigns                  Create campaign
GET    /api/campaigns/:id              Get campaign details
GET    /api/campaigns                  List campaigns

POST   /api/campaigns/:id/contribute   Add contribution
POST   /api/campaigns/:id/lock         Lock fundraising
POST   /api/campaigns/:id/verify       Submit evidence (CID)
POST   /api/campaigns/:id/approve-verification  Verify & approve
POST   /api/campaigns/:id/mint-nft     Mint verification NFT
POST   /api/campaigns/:id/disburse     Disburse funds
POST   /api/campaigns/:id/refund       Refund contributors
POST   /api/campaigns/:id/confirm-receipt  Confirm receipt
```

### Request Examples
```json
// Create Campaign
POST /api/campaigns
{
  "title": "Emergency Relief",
  "description": "Help needed",
  "targetAmount": 5000,
  "verifierPubKey": "test-verifier-key",
  "deadline": "2025-12-31T23:59:59Z"
}

// Contribute
POST /api/campaigns/{id}/contribute
{
  "amount": 1000,
  "contributorAddress": "addr_test1vz..."
}

// Approve Verification
POST /api/campaigns/{id}/approve-verification
{
  "auditNotes": "Documentation verified"
}
```

## Files & Directories

```
backend/
  src/
    controllers/   campaignController.js     (create, lock, approve, disburse, refund)
    services/      txSigner.js               (on-chain transaction submission)
    routes/        campaigns.js              (API route bindings)

contracts/
  AidChain.hs      Validator (state machine)
  NftPolicy.hs     NFT minting policy

scripts/
  onchain-helper.sh      On-chain operations (sim/cardano-cli)
  testScenarios.js       E2E test harness
  README.md              PowerShell/bash examples

.github/workflows/
  main.yml               CI/CD pipeline (tests + smart contracts)

keys/
  {role}-payment.{skey,vkey}   Cardano key pairs
```

## Campaign State Diagram

```
Create
  ↓
Fundraising (contributions accepted)
  ↓ [Deadline + target reached]
Lock (fundraising complete)
  ↓ [Creator submits evidence]
Verification Pending (awaiting verifier review)
  ↓ [Verifier approves]
Verified (NFT minted, ready to disburse)
  ↓
Disbursed (funds sent to beneficiary)
  ↓
Completed

[Alternative path]
Verification Pending
  ↓ [Verifier rejects]
Rejected (can resubmit evidence)
  ↓ [Resubmit + approve]
Verified → Disbursed

[Refund path]
Fundraising → Deadline expired without target
  ↓
Refunded (contributors refunded)
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot find module 'helmet'` | Missing npm deps | `cd backend && npm install` |
| `Port 3001 in use` | Port conflict | `PORT=3002 npm run dev` or kill process |
| `cardano-cli not found` | CLI not installed | Set `USE_CARDANO_CLI=false` |
| `Missing on-chain approvalTx` | Backend not calling txSigner | Check campaignController approveVerification() |
| `No UTxO found` | Address has no funds | Use simulation mode or fund address |

## Testing Modes

### Mode 1: Simulation (Fastest)
- No network required
- Deterministic fake tx hashes
- All platforms (Windows, Mac, Linux)
- **Default mode**

### Mode 2: cardano-cli Dry-Run
- Prints example cardano-cli commands
- Doesn't execute transactions
- Good for validating command syntax
- Requires: cardano-cli binary (not executed)

### Mode 3: Real Transactions
- Builds, signs, and submits real transactions
- Requires: Cardano node, UTxO, signing keys
- Use for: testnet/mainnet integration
- **Most complex**

## Verifier Role

Verifiers have special permissions:

1. **Review Evidence**: Verifier can view campaign evidence (IPFS CID)
2. **Approve**: Verifier approves release of funds → triggers on-chain state transition → NFT minted
3. **Reject**: Verifier can reject and request resubmission
4. **On-Chain**: Validator checks `cdVerifier` PubKeyHash matches in transaction

## Frontend Integration

```typescript
// Connect to backend
const API_URL = 'http://localhost:3001/api';

// Create campaign with verifier
const res = await fetch(`${API_URL}/campaigns`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Campaign Title',
    verifierPubKey: 'verifier-pubkey',
    // ... other fields
  })
});

// Contribute
await fetch(`${API_URL}/campaigns/${id}/contribute`, {
  method: 'POST',
  body: JSON.stringify({
    amount: 1000,
    contributorAddress: 'addr_test1vz...'
  })
});
```

## Smart Contract Fields

### Campaign Datum (on-chain)
- `cdCampaignId`: Campaign ID
- `cdCreator`: Creator PubKeyHash
- `cdVerifier`: Assigned verifier PubKeyHash
- `cdBeneficiary`: Beneficiary address
- `cdTargetAmount`: Fundraising goal
- `cdDeadline`: Contribution deadline
- `cdVerificationCID`: IPFS hash of evidence
- `cdState`: Current state (Fundraising | Locked | Verified | Disbursed | Refunded)

### Redeemers (on-chain)
- `Contribute`: Contributor locks funds
- `LockFunds`: Creator locks fundraising
- `SubmitEvidence`: Creator provides IPFS CID
- `ApproveVerification`: Verifier approves (checks signature!)
- `RejectVerification`: Verifier rejects
- `Disburse`: Send funds to beneficiary
- `Refund`: Return funds on deadline miss

## Git Workflow

```bash
git clone <repo>
cd AIdChain

# Create feature branch
git checkout -b feature/my-feature

# Make changes
# ...

# Test
node scripts/testScenarios.js

# Commit and push
git add .
git commit -m "Feature: add my feature"
git push origin feature/my-feature

# GitHub Actions runs tests automatically
```

## Useful Links

- **Cardano Docs**: https://developers.cardano.org/
- **Plutus Docs**: https://github.com/input-output-hk/plutus
- **cardano-cli**: https://github.com/input-output-hk/cardano-cli
- **Haskell**: https://www.haskell.org/
