File: README.md
Location: scripts/

# scripts/README.md

This directory contains helper scripts used for local development, CI, and testing.

Key files:
- `onchain-helper.sh` — local/CI on-chain helper (simulation + optional cardano-cli template)
- `seed_wallets.sh` — generates test wallets
- `deploy.sh` — deployment helper
- `testScenarios.js` — E2E test harness for backend

PowerShell examples (Windows)

1) Make `onchain-helper.sh` executable (using Git Bash/WSL):
```powershell
bash -c "chmod +x scripts/onchain-helper.sh"
```

2) Run the onchain helper in simulation mode (default):
```powershell
bash -c "./scripts/onchain-helper.sh approve-verification --campaign my-campaign-id --signing-key /c/keys/verifier.skey"
```

3) To run the onchain helper in `cardano-cli` template mode (prints commands):
```powershell
# Set USE_CARDANO_CLI=true and RUN_CARDANO_CLI=false to print the cardano-cli commands
$env:USE_CARDANO_CLI = 'true'
$env:RUN_CARDANO_CLI = 'false'
bash -c "./scripts/onchain-helper.sh approve-verification --campaign my-campaign-id --signing-key /c/keys/verifier.skey"
```

4) To actually run cardano-cli commands (ONLY if your environment is configured):
```powershell
# WARNING: Running cardano-cli requires correctly configured node, UTxOs, fee calculation, etc.
$env:USE_CARDANO_CLI = 'true'
$env:RUN_CARDANO_CLI = 'true'
$env:CARDANO_CLI = 'cardano-cli'
# Provide necessary env vars used by the helper, e.g. VALIDATOR_SCRIPT, VERIFIER_SKEY, PAYMENT_ADDR_FILE
bash -c "./scripts/onchain-helper.sh approve-verification --campaign my-campaign-id --signing-key /c/keys/verifier.skey"
```

5) Run E2E tests (ensure backend running on port 3001):
```powershell
# Optional: disable strict on-chain asserts if your environment does not return onchain tx fields
$env:ASSERT_ONCHAIN = 'true'
node scripts/testScenarios.js
```

Environment variables used by scripts
- `ONCHAIN_HELPER` - path to onchain helper (defaults to `./scripts/onchain-helper.sh`)
- `USE_CARDANO_CLI` - when `true`, helper will attempt to use `cardano-cli` (template); default `false`
- `RUN_CARDANO_CLI` - when `true`, helper will actually run printed `cardano-cli` commands (dangerous without setup); default `false`
- `ASSERT_ONCHAIN` - when `false`, the test harness will skip asserting `onchain.*` fields; default `true`

Notes
- The `onchain-helper.sh` provides deterministic fake tx hashes for CI/local tests. For production-grade on-chain interactions implement full transaction building, fee calculation, utxo selection, signing, and submission.

*** End of file ***
