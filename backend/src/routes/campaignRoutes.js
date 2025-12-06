const express = require('express');
const CampaignController = require('../controllers/campaignController');

const router = express.Router();

// Define campaign-related routes
router.get('/init', CampaignController.init);
router.post('/campaigns', CampaignController.createCampaign);
router.post('/donate', CampaignController.donate);
router.post('/proof', CampaignController.submitProof);
router.post('/verify', CampaignController.verify);
router.post('/confirm', CampaignController.confirm);
router.post('/audit', CampaignController.addAudit);

module.exports = router;
