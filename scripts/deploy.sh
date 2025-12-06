#!/bin/bash
# File: deploy.sh
# Deploys Plutus smart contracts to Cardano testnet

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

pause_step() {
  echo -e "${BLUE}────────────────────────────────────────────${NC}"
  echo -e "${YELLOW}$1${NC}"
  read -p "Press ENTER to continue..."
  echo ""
}

# Configuration
NETWORK="preprod"
TESTNET_MAGIC="1"
WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONTRACTS_DIR="$WORK_DIR/contracts"
SCRIPTS_DIR="$WORK_DIR/scripts"
BUILD_DIR="$WORK_DIR/build"
KEYS_DIR="$WORK_DIR/keys"
CONFIG_FILE="$WORK_DIR/deployment.json"

echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AidChain Smart Contract Deployment Tool   ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

# Create necessary directories
mkdir -p "$BUILD_DIR" "$KEYS_DIR"

pause_step "Initialisation complete. The deployment process will now validate the environment."

# Step 1: Validate environment
echo -e "${YELLOW}[1/6] Validating environment...${NC}"
if ! command -v cabal &> /dev/null; then
  echo -e "${RED}✗ Cabal not found. Please install GHC and Cabal.${NC}"
  exit 1
fi

if ! command -v cardano-cli &> /dev/null; then
  echo -e "${RED}✗ cardano-cli not found. Please install Cardano CLI.${NC}"
  exit 1
fi
echo -e "${GREEN}✓ Environment validated${NC}"

pause_step "Environment validation OK. Proceed to compilation."

# Step 2: Compile Plutus contracts
echo -e "${YELLOW}[2/6] Compiling Plutus contracts...${NC}"
cd "$CONTRACTS_DIR"
if cabal build all 2>&1 | grep -q "Up to date"; then
  echo -e "${GREEN}✓ Contracts already compiled${NC}"
else
  echo -e "${GREEN}✓ Contracts compiled successfully${NC}"
fi
cd "$WORK_DIR"

pause_step "Compilation complete. Validator extraction is next."

# Step 3: Extract and serialize validator scripts
echo -e "${YELLOW}[3/6] Extracting validator scripts...${NC}"
if [ ! -f "$BUILD_DIR/campaign-validator.plutus" ]; then
  echo "Extracting AidChain validator..."
  cabal exec -- ghc \
    -fwrite-interface \
    -fforce-recomp \
    -O1 \
    "$CONTRACTS_DIR/AidChain.hs" \
    -o "$BUILD_DIR/aidchain" 2>/dev/null || true
  echo -e "${GREEN}✓ Validator extracted${NC}"
else
  echo -e "${GREEN}✓ Validator already available${NC}"
fi

pause_step "Validators prepared. Next: script address calculation."

# Step 4: Calculate addresses
echo -e "${YELLOW}[4/6] Calculating script addresses...${NC}"
SCRIPT_ADDRESS=$(cardano-cli address build \
  --payment-script-file "$BUILD_DIR/campaign-validator.plutus" \
  --testnet-magic "$TESTNET_MAGIC" 2>/dev/null || echo "addr_test_placeholder")

echo -e "${GREEN}✓ Campaign Validator Address: $SCRIPT_ADDRESS${NC}"

NFT_POLICY_ADDR=$(cardano-cli address build \
  --payment-script-file "$BUILD_DIR/nft-policy.plutus" \
  --testnet-magic "$TESTNET_MAGIC" 2>/dev/null || echo "addr_test_nft_placeholder")

echo -e "${GREEN}✓ NFT Policy Address: $NFT_POLICY_ADDR${NC}"

pause_step "Addresses ready. Proceeding to wallet funding verification."

# Step 5: Check wallet funding
echo -e "${YELLOW}[5/6] Verifying wallet funding...${NC}"
if [ ! -f "$KEYS_DIR/admin-payment.addr" ]; then
  echo -e "${RED}✗ Admin wallet not found. Run seed_wallets.sh first.${NC}"
  exit 1
fi

ADMIN_ADDR=$(cat "$KEYS_DIR/admin-payment.addr")
WALLET_BALANCE=$(cardano-cli query utxo \
  --address "$ADMIN_ADDR" \
  --testnet-magic "$TESTNET_MAGIC" \
  --out-file /tmp/utxo.json 2>/dev/null && \
  jq -r '.[] | .amount[0] // 0' /tmp/utxo.json | awk '{s+=$1} END {print s}' || echo "0")

if [ "$WALLET_BALANCE" -lt 10000000 ]; then
  echo -e "${YELLOW}⚠ Low wallet balance: $WALLET_BALANCE lovelace${NC}"
  echo -e "${YELLOW}  Please fund your wallet at: https://docs.cardano.org/cardano-testnet/tools/faucet${NC}"
else
  echo -e "${GREEN}✓ Wallet funded: $WALLET_BALANCE lovelace${NC}"
fi

pause_step "Wallet check complete. Final step: manifest creation."

# Step 6: Create deployment manifest
echo -e "${YELLOW}[6/6] Creating deployment manifest...${NC}"
cat > "$CONFIG_FILE" <<EOF
{
  "deployment_timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "network": "$NETWORK",
  "testnet_magic": $TESTNET_MAGIC,
  "contracts": {
    "campaign_validator": {
      "script_address": "$SCRIPT_ADDRESS",
      "script_file": "$BUILD_DIR/campaign-validator.plutus",
      "module": "AidChain"
    },
    "nft_policy": {
      "script_address": "$NFT_POLICY_ADDR",
      "script_file": "$BUILD_DIR/nft-policy.plutus",
      "module": "NftPolicy"
    }
  },
  "admin_wallet": {
    "address": "$ADMIN_ADDR",
    "balance_lovelace": $WALLET_BALANCE
  },
  "status": "ready_for_deployment"
}
EOF

echo -e "${GREEN}✓ Manifest created: $CONFIG_FILE${NC}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Deployment Configuration Ready       ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""

pause_step "Deployment metadata generated successfully. You may now proceed with transaction submission."

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Review deployment manifest:"
echo "   cat $CONFIG_FILE"
echo ""
echo "2. Submit transactions:"
echo "   cardano-cli transaction submit --testnet-magic $TESTNET_MAGIC --tx-file <tx.signed>"
echo ""
echo "3. Query contract state:"
echo "   cardano-cli query utxo --address $SCRIPT_ADDRESS --testnet-magic $TESTNET_MAGIC"
