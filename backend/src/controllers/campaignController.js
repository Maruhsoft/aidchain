const CampaignService = require('../services/campaignService');
const CampaignModel = require('../models/campaign');
const txSigner = require('../services/txSigner');
const logger = require('../utils/logger');

/**
 * Controller handles HTTP Request/Response cycle.
 * Delegates business logic to CampaignService.
 */
const CampaignController = {
  
  init: (req, res) => {
    try {
      const data = CampaignService.getAll();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }, 

  // Create campaign - now supports verifierPubKey in request body
  createCampaign: async (req, res) => {
    try {
      console.log('[CAMPAIGN] createCampaign called');
      console.log('[CAMPAIGN] req.body:', req.body);
      console.log('[CAMPAIGN] req.user:', req.user);

      const {
        title, description, targetAmount, deadline,
        verificationRequired = false, verifierPubKey, beneficiaryAddress
      } = req.body;

      // basic validation (more robust validation exists elsewhere)
      if (!title || !targetAmount || !beneficiaryAddress) {
        console.log('[CAMPAIGN] Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // If verifierPubKey not provided, fallback to system default
      const assignedVerifier = verifierPubKey || process.env.DEFAULT_VERIFIER_PUBKEY || null;

      const campaign = new CampaignModel({
        title,
        description,
        targetAmount,
        collectedAmount: 0,
        state: 'Fundraising',
        deadline,
        verificationRequired,
        verifierPubKey: assignedVerifier,
        beneficiaryAddress,
        nftMinted: false,
        owner: req.user.address, // assumes auth middleware sets req.user.address
      });

      console.log('[CAMPAIGN] Campaign created:', campaign);
      await campaign.save();
      console.log('[CAMPAIGN] Campaign saved');

      logger.info(`Campaign created ${campaign.id} owner=${campaign.owner} verifier=${assignedVerifier}`);

      return res.status(201).json({ campaign });
    } catch (err) {
      console.error('[CAMPAIGN] createCampaign error:', err);
      logger.error('createCampaign error', err);
      return res.status(500).json({ error: 'Internal server error', details: err.message });
    }
  },

  donate: (req, res) => {
    try {
      const { campaignId, amount } = req.body;
      const result = CampaignService.donate(campaignId, amount);
      res.json({ success: true, ...result });
    } catch (e) {
      const status = e.message.includes('not found') ? 404 : 400;
      res.status(status).json({ error: e.message });
    }
  },
  
  submitProof: (req, res) => {
    try {
      const { campaignId, proof } = req.body;
      const result = CampaignService.submitProof(campaignId, proof);
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  verify: (req, res) => {
    try {
      const { campaignId } = req.body;
      const result = CampaignService.verify(campaignId);
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  confirm: (req, res) => {
    try {
      const { campaignId } = req.body;
      const result = CampaignService.confirm(campaignId);
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  addAudit: (req, res) => {
    try {
      const { campaignId, score, report } = req.body;
      const result = CampaignService.addAudit(campaignId, score, report);
      res.json({ success: true, ...result });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  },

  // Approve verification - ensures verifier PubKey matches stored verifier and triggers on-chain approval + optional NFT mint
  approveVerification: async (req, res) => {
    try {
      const { id } = req.params;
      const auditNotes = req.body.auditNotes || '';

      const campaign = await CampaignModel.findById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      // Check verifier identity matches stored verifierPubKey
      const signer = req.user.address; // the request is authenticated by verifier's wallet
      if (!campaign.verifierPubKey || campaign.verifierPubKey !== signer) {
        return res.status(403).json({ error: 'Unauthorized: verifier mismatch' });
      }

      // Update backend state to Verified (optimistic), record audit notes
      campaign.state = 'Verified';
      campaign.audit = campaign.audit || [];
      campaign.audit.push({ type: 'verification_approved', by: signer, notes: auditNotes, timestamp: new Date() });
      await campaign.save();

      // Trigger on-chain approval transaction via txSigner (this will build/sign/submit ApproveVerification redeemer)
      try {
        const txHash = await txSigner.submitApproveVerificationTx({
          campaignId: campaign.id,
          verifierPubKey: signer,
          signerKeyPath: process.env.VERIFIER_SKEY_PATH, // server env should hold verifier key path for tests
        });
        logger.info(`On-chain approval tx submitted ${txHash} for campaign ${campaign.id}`);
        campaign.onchain = campaign.onchain || {};
        campaign.onchain.approvalTx = txHash;
      } catch (onchainErr) {
        // record on-chain failure but keep backend verified (will need reconciliation)
        logger.error('on-chain approval failed', onchainErr);
        campaign.onchain = campaign.onchain || {};
        campaign.onchain.approvalError = onchainErr.message || String(onchainErr);
      }

      // Optionally trigger NFT mint by admin (if backend workflow requires separate admin action)
      if (process.env.AUTO_MINT_NFT === 'true') {
        try {
          const mintTx = await txSigner.submitMintNftTx({
            campaignId: campaign.id,
            issuerPubKey: campaign.owner,
            adminSkeyPath: process.env.ADMIN_SKEY_PATH,
          });
          campaign.nftMinted = true;
          campaign.onchain.nftMintTx = mintTx;
          logger.info(`NFT minted on-chain ${mintTx} for campaign ${campaign.id}`);
        } catch (mintErr) {
          logger.error('NFT mint failed', mintErr);
          campaign.onchain.nftMintError = mintErr.message || String(mintErr);
        }
      }

      await campaign.save();

      return res.json({ campaign });
    } catch (err) {
      logger.error('approveVerification error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Lock campaign - owner must call; triggers on-chain lock
  lockCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await CampaignModel.findById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      if (req.user.address !== campaign.owner) return res.status(403).json({ error: 'Only owner can lock campaign' });
      if (campaign.state !== 'Fundraising') return res.status(400).json({ error: 'Invalid state for locking' });
      if (campaign.collectedAmount < campaign.targetAmount) return res.status(400).json({ error: 'Target not reached' });

      // optimistic update
      campaign.state = 'Locked';
      await campaign.save();

      // submit on-chain lock tx
      try {
        const ownerSkey = process.env.OWNER_SKEY_PATH || req.user.skeyPath;
        const txHash = await txSigner.submitLockTx({ campaignId: campaign.id, ownerSkeyPath: ownerSkey });
        campaign.onchain = campaign.onchain || {};
        campaign.onchain.lockTx = txHash;
        await campaign.save();
        logger.info(`Lock tx submitted ${txHash} for campaign ${campaign.id}`);
      } catch (err) {
        logger.error('on-chain lock failed', err);
        campaign.onchain = campaign.onchain || {};
        campaign.onchain.lockError = err.message || String(err);
        await campaign.save();
      }

      return res.json({ campaign });
    } catch (err) {
      logger.error('lockCampaign error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Disburse campaign - owner triggers on-chain disbursement
  disburseCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await CampaignModel.findById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      if (req.user.address !== campaign.owner) return res.status(403).json({ error: 'Only owner can disburse' });
      if (campaign.state !== 'Verified') return res.status(400).json({ error: 'Campaign must be Verified before disbursing' });

      campaign.state = 'Disbursed';
      await campaign.save();

      try {
        const ownerSkey = process.env.OWNER_SKEY_PATH || req.user.skeyPath;
        const txHash = await txSigner.submitDisburseTx({ campaignId: campaign.id, ownerSkeyPath: ownerSkey, beneficiaryAddress: campaign.beneficiaryAddress });
        campaign.onchain = campaign.onchain || {};
        campaign.onchain.disburseTx = txHash;
        await campaign.save();
        logger.info(`Disburse tx submitted ${txHash} for campaign ${campaign.id}`);
      } catch (err) {
        logger.error('on-chain disburse failed', err);
        campaign.onchain = campaign.onchain || {};
        campaign.onchain.disburseError = err.message || String(err);
        await campaign.save();
      }

      return res.json({ campaign });
    } catch (err) {
      logger.error('disburseCampaign error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Refund campaign - admin or owner triggers refund after deadline or failed campaign
  refundCampaign: async (req, res) => {
    try {
      const { id } = req.params;
      const campaign = await CampaignModel.findById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      // allow admin or owner
      if (!(req.user.roles.includes('admin') || req.user.address === campaign.owner)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      if (!(campaign.state === 'Fundraising' && campaign.collectedAmount < campaign.targetAmount)) {
        return res.status(400).json({ error: 'Refund not allowed in current state' });
      }

      campaign.state = 'Refunded';
      await campaign.save();

      try {
        const adminSkey = process.env.ADMIN_SKEY_PATH || req.user.skeyPath;
        const txHash = await txSigner.submitRefundTx({ campaignId: campaign.id, adminSkeyPath: adminSkey });
        campaign.onchain = campaign.onchain || {};
        campaign.onchain.refundTx = txHash;
        await campaign.save();
        logger.info(`Refund tx submitted ${txHash} for campaign ${campaign.id}`);
      } catch (err) {
        logger.error('on-chain refund failed', err);
        campaign.onchain = campaign.onchain || {};
        campaign.onchain.refundError = err.message || String(err);
        await campaign.save();
      }

      return res.json({ campaign });
    } catch (err) {
      logger.error('refundCampaign error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Contribute endpoint - records contribution and optionally triggers minimal on-chain helper (for tests)
  contribute: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, contributorAddress } = req.body;
      if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

      const campaign = await CampaignModel.findById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      if (campaign.state !== 'Fundraising') return res.status(400).json({ error: 'Campaign not accepting contributions' });

      campaign.collectedAmount = (campaign.collectedAmount || 0) + amount;
      campaign.contributions = campaign.contributions || [];
      campaign.contributions.push({ by: contributorAddress || req.user.address, amount, timestamp: new Date() });
      // record last contribution timestamp for assertions
      campaign.lastContributeAt = new Date().toISOString();
      await campaign.save();

      // Optionally call on-chain contributor helper for CI test harness
      if (process.env.ONCHAIN_HELPER) {
        try {
          const helperResult = await txSigner.runHelper && typeof txSigner.runHelper === 'function'
            ? await txSigner.runHelper({action:'contribute', campaignId: campaign.id, amount})
            : null;
          campaign.onchain = campaign.onchain || {};
          if (helperResult) campaign.onchain.lastContribute = helperResult;
          await campaign.save();
        } catch (e) {
          logger.debug('contribute helper failed', e);
        }
      }

      return res.json({ campaign });
    } catch (err) {
      logger.error('contribute error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Submit evidence (IPFS CID)
  submitEvidence: async (req, res) => {
    try {
      const { id } = req.params;
      const { proofHash, description } = req.body;
      const campaign = await CampaignModel.findById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
      if (req.user.address !== campaign.owner) return res.status(403).json({ error: 'Only owner can submit evidence' });
      if (campaign.state !== 'Locked') return res.status(400).json({ error: 'Campaign not locked' });

      campaign.proofHash = proofHash;
      campaign.evidence = campaign.evidence || [];
      campaign.evidence.push({ proofHash, description, timestamp: new Date() });
      await campaign.save();

      return res.json({ campaign });
    } catch (err) {
      logger.error('submitEvidence error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Reject verification
  rejectVerification: async (req, res) => {
    try {
      const { id } = req.params;
      const { rejectionReason } = req.body;
      const campaign = await CampaignModel.findById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      const signer = req.user.address;
      if (!campaign.verifierPubKey || campaign.verifierPubKey !== signer) {
        return res.status(403).json({ error: 'Unauthorized: verifier mismatch' });
      }

      campaign.state = 'Locked';
      campaign.audit = campaign.audit || [];
      campaign.audit.push({ type: 'verification_rejected', by: signer, reason: rejectionReason, timestamp: new Date() });
      await campaign.save();

      return res.json({ campaign });
    } catch (err) {
      logger.error('rejectVerification error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Mint NFT (admin)
  mintNft: async (req, res) => {
    try {
      const { id } = req.params;
      const { metadata } = req.body;
      const campaign = await CampaignModel.findById(id);
      if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

      // Only admin can call this route (route-level middleware enforces)
      try {
        const txHash = await txSigner.submitMintNftTx({ campaignId: campaign.id, issuerPubKey: campaign.owner, adminSkeyPath: process.env.ADMIN_SKEY_PATH });
        campaign.nftMinted = true;
        campaign.onchain = campaign.onchain || {};
        campaign.onchain.nftMintTx = txHash;
        await campaign.save();
        return res.json({ campaign });
      } catch (err) {
        logger.error('mintNft failed', err);
        return res.status(500).json({ error: 'NFT mint failed', details: err.message });
      }
    } catch (err) {
      logger.error('mintNft error', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = CampaignController;
