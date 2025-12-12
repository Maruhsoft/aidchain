const express = require('express');
const router = express.Router();

const campaignController = require('../controllers/campaignController');
const { requireAuth, requireRole } = require('../middleware/auth'); // assumes these exist

// Public
router.get('/', campaignController.listCampaigns);
router.get('/:id', campaignController.getCampaign);

// Authenticated actions
router.post('/', requireAuth, requireRole(['ngo']), campaignController.createCampaign);
router.post('/:id/contribute', requireAuth, campaignController.contribute); // donor or any authenticated
router.post('/:id/lock', requireAuth, requireRole(['ngo']), campaignController.lockCampaign);
router.post('/:id/verify', requireAuth, requireRole(['ngo']), campaignController.submitEvidence);
router.post('/:id/approve-verification', requireAuth, requireRole(['verifier']), campaignController.approveVerification);
router.post('/:id/reject-verification', requireAuth, requireRole(['verifier']), campaignController.rejectVerification);
router.post('/:id/mint-nft', requireAuth, requireRole(['admin']), campaignController.mintNft);
router.post('/:id/disburse', requireAuth, requireRole(['ngo']), campaignController.disburseCampaign);
router.post('/:id/refund', requireAuth, requireRole(['admin','ngo']), campaignController.refundCampaign);

module.exports = router;