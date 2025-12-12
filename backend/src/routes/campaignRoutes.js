const express = require('express');
const CampaignController = require('../controllers/campaignController');

const router = express.Router();

// Define campaign-related routes

// Initialize with all campaigns and transactions
router.get('/init', CampaignController.init);

// Campaign CRUD
router.post('/campaigns', CampaignController.createCampaign);
router.get('/campaigns/:id', CampaignController.getCampaign);

// Campaign Actions
router.post('/campaigns/:id/contribute', CampaignController.contribute);
router.post('/campaigns/:id/lock', CampaignController.lockCampaign);
router.post('/campaigns/:id/verify', CampaignController.submitEvidence);
router.post('/campaigns/:id/approve-verification', CampaignController.approveVerification);
router.post('/campaigns/:id/reject-verification', CampaignController.rejectVerification);
router.post('/campaigns/:id/mint-nft', CampaignController.mintNft);
router.post('/campaigns/:id/disburse', CampaignController.disburseCampaign);
router.post('/campaigns/:id/confirm-receipt', CampaignController.confirmReceipt);
router.post('/campaigns/:id/refund', CampaignController.refundCampaign);

// Legacy routes for backward compatibility
router.post('/donate', CampaignController.donate);
router.post('/proof', CampaignController.submitProof);
router.post('/verify', CampaignController.verify);
router.post('/confirm', CampaignController.confirm);
router.post('/audit', CampaignController.addAudit);

module.exports = router;
