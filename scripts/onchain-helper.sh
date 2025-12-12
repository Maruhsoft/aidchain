#!/usr/bin/env bash
# File: onchain-helper.sh (new)
# Location: scripts/
# Enhanced on-chain helper for CI and local tests.

set -euo pipefail

CMD="${1:-}"; shift || true

# Parse args
while [[ $# -gt 0 ]]; do
  key="$1"
  case $key in
    --campaign) CAMPAIGN="$2"; shift 2;;
    --signing-key) SKEY="$2"; shift 2;;
    --admin-skey) ADMIN_SKEY="$2"; shift 2;;
    --issuer) ISSUER="$2"; shift 2;;
    --beneficiary) BENEFICIARY="$2"; shift 2;;
    *) shift;;
  esac
done

fake_txhash() {
  local key="${CAMPAIGN}_${CMD}_$(date +%s)"
  if command -v md5sum >/dev/null 2>&1; then
    echo "tx_$(echo -n "$key" | md5sum | awk '{print $1}')"
  else
    echo "tx_$(echo -n "$key" | sha256sum | awk '{print $1}' | cut -c1-32)"
  fi
}

pick_utxo() {
  local addr="$1"
  if [[ -z "$addr" ]]; then
    echo ""; return 1
  fi
  mapfile -t lines < <(${CARDANO_CLI:-cardano-cli} query utxo --address "$addr" ${NETWORK_ARGS:---testnet-magic 1} 2>/dev/null || true)
  for line in "${lines[@]:2}"; do
    read -r txhash txix lovelace _ <<<"$(echo $line)"
    if [[ -n "$txhash" && -n "$txix" ]]; then
      echo "${txhash}#${txix} ${lovelace:-0}"
      return 0
    fi
  done
  echo ""
  return 1
}

select_utxos_for_amount() {
  # Selects one or more UTxOs from an address to cover required lovelace amount.
  # Returns space-separated list of TXHASH#IX entries and the total lovelace selected.
  local addr="$1"
  local need="$2"
  if [[ -z "$addr" || -z "$need" ]]; then
    echo ""; return 1
  fi
  mapfile -t lines < <(${CARDANO_CLI:-cardano-cli} query utxo --address "$addr" ${NETWORK_ARGS:---testnet-magic 1} 2>/dev/null || true)
  # Parse UTxOs lines
  local selected=()
  local total=0
  for line in "${lines[@]:2}"; do
    read -r txhash txix lovelace _ <<<"$(echo $line)"
    if [[ -n "$txhash" && -n "$txix" ]]; then
      selected+=("${txhash}#${txix}")
      total=$((total + ${lovelace:-0}))
      if [[ $total -ge $need ]]; then
        echo "${selected[*]}|${total}"
        return 0
      fi
    fi
  done
  # not enough funds
  echo ""
  return 1
}

# Best-fit UTxO selection: prefer single UTxO >= need, else greedy ascending accumulate to minimize leftover change
select_utxos_bestfit() {
  local addr="$1"
  local need="$2"
  if [[ -z "$addr" || -z "$need" ]]; then
    echo ""; return 1
  fi
  mapfile -t lines < <(${CARDANO_CLI:-cardano-cli} query utxo --address "$addr" ${NETWORK_ARGS:---testnet-magic 1} 2>/dev/null || true)
  declare -a utxos
  declare -a vals
  for line in "${lines[@]:2}"; do
    read -r txhash txix lovelace _ <<<"$(echo $line)"
    if [[ -n "$txhash" && -n "$txix" ]]; then
      utxos+=("${txhash}#${txix}")
      vals+=("${lovelace:-0}")
    fi
  done
  local n=${#utxos[@]}
  if [[ $n -eq 0 ]]; then echo ""; return 1; fi

  # try single utxo that covers need with minimal excess
  local best_idx=-1
  local best_excess=0
  for i in "${!utxos[@]}"; do
    local v=${vals[$i]}
    if [[ $v -ge $need ]]; then
      local excess=$((v - need))
      if [[ $best_idx -eq -1 || $excess -lt $best_excess ]]; then
        best_idx=$i
        best_excess=$excess
      fi
    fi
  done
  if [[ $best_idx -ne -1 ]]; then
    echo "${utxos[$best_idx]}|${vals[$best_idx]}"; return 0
  fi

  # otherwise greedy ascending accumulation
  # build array of indices sorted by value ascending
  IFS=$'\n' sorted=($(for i in "${!utxos[@]}"; do echo "${vals[$i]}:$i"; done | sort -n))
  local selected=()
  local total=0
  for entry in "${sorted[@]}"; do
    idx=${entry#*:}
    selected+=("${utxos[$idx]}")
    total=$((total + vals[$idx]))
    if [[ $total -ge $need ]]; then
      echo "${selected[*]}|${total}"
      return 0
    fi
  done
  echo ""
  return 1
}

build_sign_submit() {
  local txin="$1"
  local txout="$2"
  local skey="$3"
  local outprefix="/tmp/aidchain_tx_$$"

  if [[ -z "$txin" || -z "$txout" || -z "$skey" ]]; then
    echo "ERROR: build_sign_submit requires txin, txout and signing key" >&2
    return 2
  fi

  # Support multiple --tx-in values separated by space
  # txin may be a single value or space-separated list
  txin_args=()
  for i in $txin; do
    txin_args+=(--tx-in "$i")
  done

  payer_addr="${PAYER_ADDR:-$(cat ${PAYMENT_ADDR_FILE:-/dev/null} 2>/dev/null || echo "") }"
  if [[ -z "$payer_addr" ]]; then
    echo "ERROR: PAYER_ADDR or PAYMENT_ADDR_FILE must be set" >&2
    return 2
  fi

  # Try high-level `transaction build` (requires running node/protocol) which handles fee estimation
  set -- "${txin_args[@]}" --tx-out "$txout" --change-address "$payer_addr" --out-file "${outprefix}.raw"
  ${CARDANO_CLI:-cardano-cli} transaction build --alonzo-era "${txin_args[@]}" --tx-out "$txout" --change-address "$payer_addr" --out-file "${outprefix}.raw" ${NETWORK_ARGS:---testnet-magic 1} || {
    # Fallback: attempt raw build + calculate-min-fee
    echo "transaction build failed — attempting raw build + fee calc"
    # estimate fee using protocol parameters
    proto_file="${outprefix}.protocol.json"
    ${CARDANO_CLI:-cardano-cli} query protocol-parameters ${NETWORK_ARGS:---testnet-magic 1} --out-file "$proto_file"
    # build-raw with fee=0 placeholder
    ${CARDANO_CLI:-cardano-cli} transaction build-raw --alonzo-era "${txin_args[@]}" --tx-out "$txout" --fee 0 --out-file "${outprefix}.raw"
    fee=$(${CARDANO_CLI:-cardano-cli} transaction calculate-min-fee --tx-body-file "${outprefix}.raw" --tx-in-count $(echo $txin | wc -w) --tx-out-count 1 --witness-count 1 ${NETWORK_ARGS:---testnet-magic 1} --protocol-params-file "$proto_file" | awk '{print $1}')
    if [[ -z "$fee" ]]; then
      echo "ERROR: Fee estimation failed" >&2
      return 2
    fi
    # Rebuild raw with calculated fee and adjusted change handled by payer
    ${CARDANO_CLI:-cardano-cli} transaction build-raw --alonzo-era "${txin_args[@]}" --tx-out "$txout" --fee $fee --out-file "${outprefix}.raw"
  }

  ${CARDANO_CLI:-cardano-cli} transaction sign --tx-body-file "${outprefix}.raw" --signing-key-file "$skey" --out-file "${outprefix}.signed" ${NETWORK_ARGS:---testnet-magic 1}

  ${CARDANO_CLI:-cardano-cli} transaction submit --tx-file "${outprefix}.signed" ${NETWORK_ARGS:---testnet-magic 1}
  echo "$(fake_txhash)"
}

if [[ "${USE_CARDANO_CLI:-false}" == "true" ]]; then
  if ! command -v ${CARDANO_CLI:-cardano-cli} >/dev/null 2>&1; then
    echo "ERROR: cardano-cli not found in PATH. Install cardano-cli or set USE_CARDANO_CLI=false." >&2
    exit 2
  fi

  run_cmd() {
    echo "+ ${CARDANO_CLI:-cardano-cli} $*"
    if [[ "${RUN_CARDANO_CLI:-false}" == "true" ]]; then
      ${CARDANO_CLI:-cardano-cli} "$@"
    fi
  }

  case "$CMD" in
    approve-verification)
      echo "[cardano-cli mode] Approve verification for campaign: $CAMPAIGN"
      if [[ -z "${VERIFIER_SKEY:-}" ]]; then
        echo "ERROR: VERIFIER_SKEY environment variable must be set for cardano-cli approve" >&2
        exit 2
      fi
      if [[ "${RUN_CARDANO_CLI:-false}" != "true" ]]; then
        echo "(DRY-RUN) Example: selecting UTxO, building tx to validator script address, signing with VERIFIER_SKEY and submitting"
        echo "Returning simulated tx hash (dry-run)."
        echo "$(fake_txhash)"
        exit 0
      fi
      PAYER_ADDR="${PAYER_ADDR:-$(cat ${PAYMENT_ADDR_FILE:-/dev/null} 2>/dev/null || echo "") }"
      if [[ -z "$PAYER_ADDR" ]]; then
        echo "ERROR: PAYER_ADDR or PAYMENT_ADDR_FILE must be set for RUN_CARDANO_CLI" >&2
        exit 2
      fi
      # Use best-fit UTxO selection for minimal inputs
      need_amount=${NEED_AMOUNT:-2000000}
      selection=$(select_utxos_bestfit "$PAYER_ADDR" $need_amount) || true
      if [[ -z "$selection" ]]; then
        echo "ERROR: Insufficient funds at payer address: $PAYER_ADDR" >&2
        exit 2
      fi
      txins_part=${selection%%|*}
      total_selected=${selection##*|}
      # prepare tmp datum from template (user must provide schema-correct template)
      DATUM_TEMPLATE=${DATUM_TEMPLATE:-scripts/datums/campaign-datum.template.json}
      DATUM_FILE="/tmp/campaign-datum-${CAMPAIGN}.json"
      if [[ -f "$DATUM_TEMPLATE" ]]; then
        sed "s/<CAMPAIGN_ID>/${CAMPAIGN}/g" "$DATUM_TEMPLATE" > "$DATUM_FILE"
      else
        echo "{}" > "$DATUM_FILE"
      fi
      REDEEMER_FILE=${REDEEMER_FILE:-scripts/redeemers/approve-redeemer.json}
      VALIDATOR_SCRIPT=${VALIDATOR_SCRIPT:-}
      script_addr=$(cat ${VALIDATOR_ADDR_FILE:-/dev/null} 2>/dev/null || echo "<script_addr>")
      # build tx inputs args
      txin_args=()
      for i in $txins_part; do txin_args+=(--tx-in "$i"); done
      # Build transaction that spends/updates the script UTxO. The exact flags depend on your validator.
      echo "Building transaction using validator script: ${VALIDATOR_SCRIPT:-<not-set>}"
      ${CARDANO_CLI:-cardano-cli} transaction build --alonzo-era "${txin_args[@]}" \
        --tx-in-script-file "${VALIDATOR_SCRIPT}" \
        --tx-in-datum-file "$DATUM_FILE" \
        --tx-in-redeemer-file "$REDEEMER_FILE" \
        --tx-out "$script_addr+2000000" \
        --change-address "$PAYER_ADDR" \
        --out-file /tmp/tx.raw ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction sign --signing-key-file "${VERIFIER_SKEY}" --tx-body-file /tmp/tx.raw --out-file /tmp/tx.signed ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction submit --tx-file /tmp/tx.signed ${NETWORK_ARGS:---testnet-magic 1}
      echo "$(fake_txhash)"
      exit 0
      ;;
    mint-nft)
      echo "[cardano-cli mode] Mint NFT for campaign: $CAMPAIGN"
      if [[ "${RUN_CARDANO_CLI:-false}" != "true" ]]; then
        echo "(DRY-RUN) Example mint command printed. Set RUN_CARDANO_CLI=true with proper env vars to run."
        echo "$(fake_txhash)"
        exit 0
      fi
      if [[ -z "${ADMIN_SKEY:-}" || -z "${POLICY_ID:-}" ]]; then
        echo "ERROR: ADMIN_SKEY and POLICY_ID env vars required for RUN_CARDANO_CLI mint" >&2
        exit 2
      fi
      PAYER_ADDR="${PAYER_ADDR:-$(cat ${PAYMENT_ADDR_FILE:-/dev/null} 2>/dev/null || echo "") }"
      need_amount=${MINT_NEED_AMOUNT:-2000000}
      selection=$(select_utxos_bestfit "$PAYER_ADDR" $need_amount) || true
      if [[ -z "$selection" ]]; then
        echo "ERROR: Insufficient funds at payer address: $PAYER_ADDR" >&2
        exit 2
      fi
      txins_part=${selection%%|*}
      txin_args=()
      for i in $txins_part; do txin_args+=(--tx-in "$i"); done
      POLICY_SCRIPT=${POLICY_SCRIPT:-}
      # Example: mint 1 token named by campaign
      ASSET_NAME=${ASSET_NAME:-"CampaignNFT"}
      echo "Building mint transaction using policy: ${POLICY_SCRIPT:-<not-set>}"
      ${CARDANO_CLI:-cardano-cli} transaction build --alonzo-era "${txin_args[@]}" --tx-out "${PAYER_ADDR}+2000000" --mint "1 ${POLICY_ID}.${ASSET_NAME}" --minting-script-file "${POLICY_SCRIPT}" --change-address "$PAYER_ADDR" --out-file /tmp/mint.raw ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction sign --signing-key-file "${ADMIN_SKEY}" --tx-body-file /tmp/mint.raw --out-file /tmp/mint.signed ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction submit --tx-file /tmp/mint.signed ${NETWORK_ARGS:---testnet-magic 1}
      echo "$(fake_txhash)"
      exit 0
      ;;
    lock)
      echo "[cardano-cli mode] Lock campaign: $CAMPAIGN"
      if [[ "${RUN_CARDANO_CLI:-false}" != "true" ]]; then
        echo "(DRY-RUN) Example lock tx printed. Set RUN_CARDANO_CLI=true to actually run."
        echo "$(fake_txhash)"
        exit 0
      fi
      PAYER_ADDR="${PAYER_ADDR:-$(cat ${PAYMENT_ADDR_FILE:-/dev/null} 2>/dev/null || echo "") }"
      need_amount=${LOCK_NEED_AMOUNT:-2000000}
      selection=$(select_utxos_bestfit "$PAYER_ADDR" $need_amount) || true
      if [[ -z "$selection" ]]; then
        echo "ERROR: Insufficient funds at payer address: $PAYER_ADDR" >&2
        exit 2
      fi
      txins_part=${selection%%|*}
      txin_args=()
      for i in $txins_part; do txin_args+=(--tx-in "$i"); done
      script_addr=$(cat ${VALIDATOR_ADDR_FILE:-/dev/null} 2>/dev/null || echo "<script_addr>")
      DATUM_TEMPLATE=${DATUM_TEMPLATE:-scripts/datums/campaign-datum.template.json}
      DATUM_FILE="/tmp/campaign-datum-${CAMPAIGN}.json"
      if [[ -f "$DATUM_TEMPLATE" ]]; then
        sed "s/<CAMPAIGN_ID>/${CAMPAIGN}/g" "$DATUM_TEMPLATE" > "$DATUM_FILE"
      else
        echo "{}" > "$DATUM_FILE"
      fi
      # Create script output by setting tx-out to script address with datum
      echo "Building lock tx to create script UTxO at $script_addr"
      ${CARDANO_CLI:-cardano-cli} transaction build --alonzo-era "${txin_args[@]}" --tx-out "$script_addr+2000000" --tx-out-datum-file "$DATUM_FILE" --change-address "$PAYER_ADDR" --out-file /tmp/lock.raw ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction sign --signing-key-file "${OWNER_SKEY:-${PAYER_SKEY:-}}" --tx-body-file /tmp/lock.raw --out-file /tmp/lock.signed ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction submit --tx-file /tmp/lock.signed ${NETWORK_ARGS:---testnet-magic 1}
      echo "$(fake_txhash)"
      exit 0
      ;;
    disburse)
      echo "[cardano-cli mode] Disburse campaign: $CAMPAIGN -> $BENEFICIARY"
      if [[ "${RUN_CARDANO_CLI:-false}" != "true" ]]; then
        echo "(DRY-RUN) Example disburse tx printed. Set RUN_CARDANO_CLI=true to actually run."
        echo "$(fake_txhash)"
        exit 0
      fi
      if [[ -z "${BENEFICIARY:-}" ]]; then
        echo "ERROR: BENEFICIARY env var required for disburse" >&2
        exit 2
      fi
      PAYER_ADDR="${PAYER_ADDR:-$(cat ${PAYMENT_ADDR_FILE:-/dev/null} 2>/dev/null || echo "") }"
      need_amount=${DISBURSE_NEED_AMOUNT:-2000000}
      selection=$(select_utxos_bestfit "$PAYER_ADDR" $need_amount) || true
      if [[ -z "$selection" ]]; then
        echo "ERROR: Insufficient funds at payer address: $PAYER_ADDR" >&2
        exit 2
      fi
      txins_part=${selection%%|*}
      txin_args=()
      for i in $txins_part; do txin_args+=(--tx-in "$i"); done
      ${CARDANO_CLI:-cardano-cli} transaction build --alonzo-era "${txin_args[@]}" --tx-out "${BENEFICIARY}+2000000" --change-address "$PAYER_ADDR" --out-file /tmp/disburse.raw ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction sign --signing-key-file "${OWNER_SKEY:-${PAYER_SKEY:-}}" --tx-body-file /tmp/disburse.raw --out-file /tmp/disburse.signed ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction submit --tx-file /tmp/disburse.signed ${NETWORK_ARGS:---testnet-magic 1}
      echo "$(fake_txhash)"
      exit 0
      ;;
    refund)
      echo "[cardano-cli mode] Refund campaign: $CAMPAIGN"
      if [[ "${RUN_CARDANO_CLI:-false}" != "true" ]]; then
        echo "(DRY-RUN) Example refund tx printed. Set RUN_CARDANO_CLI=true to actually run."
        echo "$(fake_txhash)"
        exit 0
      fi
      PAYER_ADDR="${PAYER_ADDR:-$(cat ${PAYMENT_ADDR_FILE:-/dev/null} 2>/dev/null || echo "") }"
      need_amount=${REFUND_NEED_AMOUNT:-2000000}
      selection=$(select_utxos_bestfit "$PAYER_ADDR" $need_amount) || true
      if [[ -z "$selection" ]]; then
        echo "ERROR: Insufficient funds at payer address: $PAYER_ADDR" >&2
        exit 2
      fi
      txins_part=${selection%%|*}
      txin_args=()
      for i in $txins_part; do txin_args+=(--tx-in "$i"); done
      refund_addr=$(cat ${REFUND_ADDR_FILE:-/dev/null} 2>/dev/null || echo "<refund_addr>")
      ${CARDANO_CLI:-cardano-cli} transaction build --alonzo-era "${txin_args[@]}" --tx-out "${refund_addr}+2000000" --change-address "$PAYER_ADDR" --out-file /tmp/refund.raw ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction sign --signing-key-file "${ADMIN_SKEY:-${PAYER_SKEY:-}}" --tx-body-file /tmp/refund.raw --out-file /tmp/refund.signed ${NETWORK_ARGS:---testnet-magic 1}
      ${CARDANO_CLI:-cardano-cli} transaction submit --tx-file /tmp/refund.signed ${NETWORK_ARGS:---testnet-magic 1}
      echo "$(fake_txhash)"
      exit 0
      ;;
    contribute)
      echo "[cardano-cli mode] Contribute - please use frontend/wallet to build contributions"
      echo "$(fake_txhash)"
      exit 0
      ;;
    *)
      echo "Unknown cardano-cli subcommand: $CMD" >&2
      exit 3
      ;;
  esac
fi

case "$CMD" in
  approve-verification)
    TX=$(fake_txhash)
    echo "$TX"
    exit 0
    ;;
  mint-nft)
    TX=$(fake_txhash)
    echo "$TX"
    exit 0
    ;;
  lock)
    TX=$(fake_txhash)
    echo "$TX"
    exit 0
    ;;
  disburse)
    TX=$(fake_txhash)
    echo "$TX"
    exit 0
    ;;
  refund)
    TX=$(fake_txhash)
    echo "$TX"
    exit 0
    ;;
  contribute)
    TX=$(fake_txhash)
    echo "$TX"
    exit 0
    ;;
  *)
    echo "Unknown command: $CMD" >&2
    echo "Supported: approve-verification, mint-nft, lock, disburse, refund, contribute" >&2
    exit 3
    ;;
esac
