
const db = require('../db');

/**
 * Service to handle all Campaign-related business logic.
 * Enforces state transitions and validates inputs.
 * 
 * ACTS AS AN OFF-CHAIN SCHEDULER:
 * In a real production environment, this service uses @blockfrost/blockfrost-js
 * to query the blockchain state and constructs unsigned transactions (CBOR) 
 * containing the correct Plutus Datum/Redeemer for the frontend to sign.
 */
const CampaignService = {
  
  getAll: () => {
    return { 
      campaigns: db.campaigns, 
      transactions: db.transactions 
    };
  },

  create: (data) => {
    const { title, description, targetAmount, category, imageUrl, beneficiariesCount, location } = data;
    
    if (!title || !targetAmount || !location) {
      throw new Error("Missing required fields: title, targetAmount, or location.");
    }

    const newCampaign = {
      id: (db.campaigns.length + 1).toString(),
      title,
      ngoName: 'Verified NGO (You)',
      description,
      targetAmount: Number(targetAmount),
      raisedAmount: 0,
      status: 'FUNDRAISING',
      category,
      imageUrl: imageUrl || 'https://via.placeholder.com/800x400',
      beneficiariesCount: Number(beneficiariesCount),
      location,
      createdAt: new Date().toISOString().split('T')[0],
      proofOfWork: null,
      trustScore: null,
      auditReport: null,
      nftBadgeMinted: false,
      beneficiaryIds: [] 
    };

    db.campaigns.unshift(newCampaign);
    
    // Construct Initial Datum for the Script Address
    const plutusDatum = {
      constructor: 0,
      fields: [
        { bytes: "ngo_pubkey_hash" }, // creator
        { int: newCampaign.targetAmount * 1000000 }, // goal (lovelace)
        { int: 0 }, // raised
        { int: 0 }, // state (0: Fundraising)
        { bytes: "auditor_pubkey_hash" } // auditor
      ]
    };

    _logTransaction('CAMPAIGN_CREATED', newCampaign.id, 'addr_ngo', 'sc_registry', 0, plutusDatum);
    
    return { campaign: newCampaign, plutusDatum };
  },

  donate: (campaignId, amount) => {
    const campaign = _findCampaign(campaignId);
    if (amount <= 0) throw new Error("Donation amount must be positive.");

    campaign.raisedAmount += Number(amount);

    if (campaign.raisedAmount >= campaign.targetAmount && campaign.status === 'FUNDRAISING') {
      campaign.status = 'LOCKED_FUNDED';
    }

    // Redeemer: Donate (Index 0)
    const plutusRedeemer = { constructor: 0, fields: [] };
    
    const tx = _logTransaction('DONATION', campaignId, 'addr_donor', 'sc_contract', amount, null, plutusRedeemer);
    
    return { campaign, tx, plutusRedeemer };
  },

  submitProof: (campaignId, proof) => {
    const campaign = _findCampaign(campaignId);
    
    if (!proof) throw new Error("Proof document (IPFS hash or URL) is required.");
    if (campaign.status !== 'FUNDRAISING' && campaign.status !== 'LOCKED_FUNDED') {
         throw new Error("Proof can only be submitted during fundraising or locked phases.");
    }
    
    campaign.status = 'VERIFICATION_PENDING';
    campaign.proofOfWork = proof;
    
    // Redeemer: SubmitProof (Index 1)
    const plutusRedeemer = { constructor: 1, fields: [] };

    const tx = _logTransaction('PROOF_SUBMISSION', campaignId, 'addr_ngo', 'sc_contract', 0, null, plutusRedeemer);
    return { campaign, tx, plutusRedeemer };
  },

  verify: (campaignId) => {
    const campaign = _findCampaign(campaignId);
    
    if (campaign.status !== 'VERIFICATION_PENDING') {
      throw new Error(`Cannot verify campaign in state: ${campaign.status}`);
    }

    campaign.status = 'DISBURSED';
    campaign.nftBadgeMinted = true;
    
    if (!campaign.beneficiaryIds || campaign.beneficiaryIds.length === 0) {
        campaign.beneficiaryIds = ['addr_ben...9x'];
    }
    
    // Redeemer: Verify (Index 2)
    const plutusRedeemer = { constructor: 2, fields: [] };

    const txDisburse = _logTransaction('DISBURSEMENT', campaignId, 'sc_contract', 'addr_ngo', campaign.raisedAmount, null, plutusRedeemer);
    const txNft = _logTransaction('NFT_MINT', campaignId, 'sc_policy', 'addr_ngo', 0);
    
    return { campaign, tx: txDisburse, nftTx: txNft, plutusRedeemer };
  },

  confirm: (campaignId) => {
    const campaign = _findCampaign(campaignId);
    
    if (campaign.status !== 'DISBURSED') {
      throw new Error("Funds must be disbursed before confirmation.");
    }
    
    campaign.status = 'COMPLETED';
    
    // Redeemer: Complete (Index 3 - custom)
    const plutusRedeemer = { constructor: 3, fields: [] };

    const tx = _logTransaction('COMPLETED', campaignId, 'addr_beneficiary', 'sc_contract', 0, null, plutusRedeemer);
    return { campaign, tx, plutusRedeemer };
  },

  addAudit: (campaignId, score, report) => {
    const campaign = _findCampaign(campaignId);
    campaign.trustScore = score;
    campaign.auditReport = report;
    return { campaign };
  }
};

// --- Private Helpers ---

const _findCampaign = (id) => {
  const c = db.campaigns.find(x => x.id === id);
  if (!c) throw new Error(`Campaign with ID ${id} not found.`);
  return c;
};

const _logTransaction = (type, campaignId, from, to, amount, datum, redeemer) => {
  const tx = {
    hash: 'tx_' + Math.random().toString(16).substr(2, 9),
    campaignId,
    from,
    to,
    amount,
    timestamp: new Date().toLocaleString(),
    type,
    blockHeight: 9234000 + Math.floor(Math.random() * 1000),
    meta: { datum, redeemer }
  };
  db.transactions.unshift(tx);
  return tx;
};

module.exports = CampaignService;
