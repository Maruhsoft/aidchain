
const CampaignService = require('../services/campaignService');

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

  createCampaign: (req, res) => {
    try {
      const campaign = CampaignService.create(req.body);
      res.status(201).json({ success: true, campaign });
    } catch (e) {
      res.status(400).json({ error: e.message });
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
  }
};

module.exports = CampaignController;
