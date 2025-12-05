#!/bin/bash
# File: seed_wallets.sh
# Location: scripts/
# Description: Generates test wallets for AidChain platform (Admin, Creator, Contributor roles)
# Syncs with backend: Creates wallet keypairs for all user roles defined in backend API

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
NETWORK="preprod"
TESTNET_MAGIC="1"
WORK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
KEYS_DIR="$WORK_DIR/keys"
WALLETS_FILE="$WORK_DIR/wallets.json"
WALLETS_ENV="$WORK_DIR/.wallets.env"

echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   AidChain Wallet Generation Tool     ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

# Validate environment
if ! command -v cardano-cli &> /dev/null; then
  echo -e "${RED}✗ cardano-cli not found${NC}"
  exit 1
fi

# Create keys directory
mkdir -p "$KEYS_DIR"
cd "$KEYS_DIR"

# Function to generate a wallet with both payment and stake keys
generate_wallet() {
  local wallet_name=$1
  local wallet_desc=$2
  
  echo -e "${YELLOW}Generating: $wallet_name ($wallet_desc)${NC}"
  
  # Generate payment keys
  cardano-cli address key-gen \
    --verification-key-file "${wallet_name}-payment.vkey" \
    --signing-key-file "${wallet_name}-payment.skey" 2>/dev/null
  
  # Generate stake keys
  cardano-cli address key-gen \
    --verification-key-file "${wallet_name}-stake.vkey" \
    --signing-key-file "${wallet_name}-stake.skey" 2>/dev/null
  
  # Build address with stake component
  cardano-cli address build \
    --payment-verification-key-file "${wallet_name}-payment.vkey" \
    --stake-verification-key-file "${wallet_name}-stake.vkey" \
    --out-file "${wallet_name}-payment.addr" \
    --testnet-magic "$TESTNET_MAGIC" 2>/dev/null
  
  # Read address
  local address=$(cat "${wallet_name}-payment.addr")
  
  # Get payment key hash
  local payment_hash=$(cardano-cli address key-hash \
    --payment-verification-key-file "${wallet_name}-payment.vkey" 2>/dev/null)
  
  echo -e "${GREEN}✓ $wallet_name generated${NC}"
  echo "  Address: $address"
  echo "  Key Hash: $payment_hash"
  echo ""
  
  echo "$address|$payment_hash|${wallet_name}-payment.skey"
}

# Step 1: Generate Admin Wallet (Platform Authority)
echo -e "${YELLOW}[1/3] Generating Admin Wallet...${NC}"
ADMIN_DATA=$(generate_wallet "admin" "Platform Administrator")

# Step 2: Generate Campaign Creator Wallet
echo -e "${YELLOW}[2/3] Generating Campaign Creator Wallet...${NC}"
CREATOR_DATA=$(generate_wallet "creator" "Campaign Creator/Owner")

# Step 3: Generate Contributor Wallet (Test Contributor)
echo -e "${YELLOW}[3/3] Generating Contributor Wallet...${NC}"
CONTRIBUTOR_DATA=$(generate_wallet "contributor" "Campaign Contributor")

# Parse wallet data
IFS='|' read -r ADMIN_ADDR ADMIN_HASH ADMIN_SKEY <<< "$ADMIN_DATA"
IFS='|' read -r CREATOR_ADDR CREATOR_HASH CREATOR_SKEY <<< "$CREATOR_DATA"
IFS='|' read -r CONTRIBUTOR_ADDR CONTRIBUTOR_HASH CONTRIBUTOR_SKEY <<< "$CONTRIBUTOR_DATA"

# Create wallets.json manifest
cd "$WORK_DIR"
cat > "$WALLETS_FILE" <<EOF
{
  "network": "$NETWORK",
  "testnet_magic": $TESTNET_MAGIC,
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "wallets": {
    "admin": {
      "role": "Platform Administrator",
      "description": "Controls deployment, verification, and contract management",
      "address": "$ADMIN_ADDR",
      "key_hash": "$ADMIN_HASH",
      "payment_skey": "$KEYS_DIR/$ADMIN_SKEY",
      "payment_vkey": "$KEYS_DIR/admin-payment.vkey",
      "stake_skey": "$KEYS_DIR/admin-stake.skey",
      "stake_vkey": "$KEYS_DIR/admin-stake.vkey",
      "backend_role": "admin"
    },
    "creator": {
      "role": "Campaign Creator/Owner",
      "description": "Creates campaigns, locks funds, initiates verification",
      "address": "$CREATOR_ADDR",
      "key_hash": "$CREATOR_HASH",
      "payment_skey": "$KEYS_DIR/$CREATOR_SKEY",
      "payment_vkey": "$KEYS_DIR/creator-payment.vkey",
      "stake_skey": "$KEYS_DIR/creator-stake.skey",
      "stake_vkey": "$KEYS_DIR/creator-stake.vkey",
      "backend_role": "creator"
    },
    "contributor": {
      "role": "Campaign Contributor",
      "description": "Contributes funds to campaigns",
      "address": "$CONTRIBUTOR_ADDR",
      "key_hash": "$CONTRIBUTOR_HASH",
      "payment_skey": "$KEYS_DIR/$CONTRIBUTOR_SKEY",
      "payment_vkey": "$KEYS_DIR/contributor-payment.vkey",
      "stake_skey": "$KEYS_DIR/contributor-stake.skey",
      "stake_vkey": "$KEYS_DIR/contributor-stake.vkey",
      "backend_role": "contributor"
    }
  },
  "usage": {
    "admin": "Platform operations and contract management",
    "creator": "Launch and manage fundraising campaigns",
    "contributor": "Participate in campaigns"
  }
}
EOF

echo -e "${GREEN}✓ Wallets manifest created${NC}"

# Create environment file for easy sourcing
cat > "$WALLETS_ENV" <<EOF
# AidChain Wallet Environment Variables
export AIDCHAIN_NETWORK="$NETWORK"
export AIDCHAIN_TESTNET_MAGIC="$TESTNET_MAGIC"

# Admin Wallet
export ADMIN_ADDR="$ADMIN_ADDR"
export ADMIN_SKEY="$KEYS_DIR/admin-payment.skey"
export ADMIN_VKEY="$KEYS_DIR/admin-payment.vkey"

# Creator Wallet
export CREATOR_ADDR="$CREATOR_ADDR"
export CREATOR_SKEY="$KEYS_DIR/creator-payment.skey"
export CREATOR_VKEY="$KEYS_DIR/creator-payment.vkey"

# Contributor Wallet
export CONTRIBUTOR_ADDR="$CONTRIBUTOR_ADDR"
export CONTRIBUTOR_SKEY="$KEYS_DIR/contributor-payment.skey"
export CONTRIBUTOR_VKEY="$KEYS_DIR/contributor-payment.vkey"

# Keys Directory
export KEYS_DIR="$KEYS_DIR"
EOF

echo -e "${GREEN}✓ Environment file created${NC}"

# Display summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Wallet Generation Complete       ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}Wallet Summary:${NC}"
echo ""
echo "ADMIN WALLET (Platform Admin):"
echo "  Address: $ADMIN_ADDR"
echo "  Key Hash: $ADMIN_HASH"
echo ""

echo "CREATOR WALLET (Campaign Owner):"
echo "  Address: $CREATOR_ADDR"
echo "  Key Hash: $CREATOR_HASH"
echo ""

echo "CONTRIBUTOR WALLET (Supporter):"
echo "  Address: $CONTRIBUTOR_ADDR"
echo "  Key Hash: $CONTRIBUTOR_HASH"
echo ""

echo -e "${YELLOW}Configuration Files:${NC}"
echo "  Manifest: $WALLETS_FILE"
echo "  Environment: $WALLETS_ENV"
echo ""

echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Fund your wallets (testnet ADA):"
echo "   https://docs.cardano.org/cardano-testnet/tools/faucet"
echo ""
echo "2. Load environment variables:"
echo "   source $WALLETS_ENV"
echo ""
echo "3. Check wallet balance:"
echo "   cardano-cli query utxo --address \$ADMIN_ADDR --testnet-magic $TESTNET_MAGIC"
echo ""
echo "4. Run deployment:"
echo "   ./scripts/deploy.sh"
echo ""

chmod 600 "$KEYS_DIR"/*.skey
echo -e "${GREEN}✓ Signing keys permissions secured (600)${NC}"