// Service: helper to interact with cardano-cli (build/sign/submit simplified wrappers).
// NOTE: This is a pragmatic helper for test/hackathon flows. Replace with robust builder for production.

const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');

const CARDANO_CLI = process.env.CARDANO_CLI_PATH || 'cardano-cli';
const NETWORK_ARGS = process.env.TESTNET_MAGIC ? ['--testnet-magic', process.env.TESTNET_MAGIC] : ['--mainnet'];

async function runCmd(cmd, args = []) {
  try {
    const { stdout, stderr } = await execFileAsync(cmd, args, { windowsHide: true });
    if (stderr) logger.debug('cmd stderr', stderr);
    return stdout.trim();
  } catch (err) {
    // If on Windows and the helper is a shell script, try invoking via bash/sh if available
    logger.error('Command failed', { cmd, err });
    if (process.platform === 'win32' && typeof cmd === 'string' && cmd.endsWith('.sh')) {
      try {
        logger.info('Attempting bash fallback for helper on Windows', { cmd });
        const { stdout, stderr } = await execFileAsync('bash', [cmd, ...args], { windowsHide: true });
        if (stderr) logger.debug('bash fallback stderr', stderr);
        return stdout.trim();
      } catch (bashErr) {
        logger.error('Bash fallback failed', { bashErr });
        // fall through and rethrow original error for clearer root cause
      }
    }
    throw err;
  }
}

function resolveHelper() {
  const env = process.env.ONCHAIN_HELPER;
  if (env) return env;
  const defaultHelper = './scripts/onchain-helper.sh';
  if (process.platform === 'win32') {
    const alt = defaultHelper.replace(/\.sh$/i, '.cmd');
    const altPath = path.resolve(process.cwd(), alt);
    if (fs.existsSync(altPath)) {
      logger.info('Windows: resolved helper to .cmd', { alt });
      return alt;
    }
  }
  return defaultHelper;
}

/**
 * submitApproveVerificationTx
 * Simplified flow: expects backend has accessible signing keys (VERIFIER_SKEY_PATH) and prepared script files.
 * In production, use a robust tx builder with UTxO selection and fee calc.
 */
async function submitApproveVerificationTx({ campaignId, verifierPubKey, signerKeyPath }) {
  const helper = resolveHelper();
  const args = ['approve-verification', '--campaign', campaignId, '--signing-key', signerKeyPath];
  try {
    const out = await runCmd(helper, args);
    logger.info('approve verification helper output', out);
    return out; // expected to return tx hash
  } catch (err) {
    throw new Error(`on-chain approval failed: ${err.message}`);
  }
}

async function submitMintNftTx({ campaignId, issuerPubKey, adminSkeyPath }) {
  const helper = resolveHelper();
  const args = ['mint-nft', '--campaign', campaignId, '--issuer', issuerPubKey, '--admin-skey', adminSkeyPath];
  try {
    const out = await runCmd(helper, args);
    logger.info('mint nft helper output', out);
    return out;
  } catch (err) {
    throw new Error(`mint nft failed: ${err.message}`);
  }
}

async function submitLockTx({ campaignId, ownerSkeyPath }) {
  const helper = resolveHelper();
  const args = ['lock', '--campaign', campaignId, '--signing-key', ownerSkeyPath];
  try {
    const out = await runCmd(helper, args);
    logger.info('lock helper output', out);
    return out;
  } catch (err) {
    throw new Error(`on-chain lock failed: ${err.message}`);
  }
}

async function submitDisburseTx({ campaignId, ownerSkeyPath, beneficiaryAddress }) {
  const helper = resolveHelper();
  const args = ['disburse', '--campaign', campaignId, '--signing-key', ownerSkeyPath, '--beneficiary', beneficiaryAddress];
  try {
    const out = await runCmd(helper, args);
    logger.info('disburse helper output', out);
    return out;
  } catch (err) {
    throw new Error(`on-chain disburse failed: ${err.message}`);
  }
}

async function submitRefundTx({ campaignId, adminSkeyPath }) {
  const helper = resolveHelper();
  const args = ['refund', '--campaign', campaignId, '--signing-key', adminSkeyPath];
  try {
    const out = await runCmd(helper, args);
    logger.info('refund helper output', out);
    return out;
  } catch (err) {
    throw new Error(`on-chain refund failed: ${err.message}`);
  }
}

// Helper to run arbitrary helper actions (used by contribute endpoint)
async function runHelper({ action, campaignId, amount }) {
  const helper = resolveHelper();
  const args = [action, '--campaign', campaignId];
  if (amount) args.push('--amount', String(amount));
  try {
    const out = await runCmd(helper, args);
    logger.info('helper output', out);
    return out;
  } catch (err) {
    logger.debug('helper run failed', err);
    return null;
  }
}

module.exports = {
  submitApproveVerificationTx,
  submitMintNftTx,
  submitLockTx,
  submitDisburseTx,
  submitRefundTx,
  runHelper,
};