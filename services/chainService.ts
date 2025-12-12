
import { Campaign, Transaction, CampaignStatus } from '../types';
import { MOCK_CAMPAIGNS, MOCK_TRANSACTIONS } from '../data/mockData';

const API_URL = 'http://localhost:3001';

const STORAGE_KEYS = {
  CAMPAIGNS: 'aidchain_campaigns_v1',
  TXS: 'aidchain_transactions_v1'
};

export class ChainService {
  private useMock: boolean = true;
  private _mockCampaigns: Campaign[] = [];
  private _mockTransactions: Transaction[] = [];

  constructor(initialMockState = true) {
    this.useMock = initialMockState;
    this.initMockData();
  }

  private initMockData() {
    if (typeof window === 'undefined') return;

    const storedCampaigns = localStorage.getItem(STORAGE_KEYS.CAMPAIGNS);
    const storedTxs = localStorage.getItem(STORAGE_KEYS.TXS);

    if (storedCampaigns) {
      this._mockCampaigns = JSON.parse(storedCampaigns);
    } else {
      this._mockCampaigns = JSON.parse(JSON.stringify(MOCK_CAMPAIGNS));
      this.persistMockData();
    }

    if (storedTxs) {
      this._mockTransactions = JSON.parse(storedTxs);
    } else {
      this._mockTransactions = JSON.parse(JSON.stringify(MOCK_TRANSACTIONS));
      this.persistMockData();
    }
  }

  private persistMockData() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CAMPAIGNS, JSON.stringify(this._mockCampaigns));
    localStorage.setItem(STORAGE_KEYS.TXS, JSON.stringify(this._mockTransactions));
  }

  setSource(useMock: boolean) {
    this.useMock = useMock;
  }

  isMock() {
    return this.useMock;
  }

  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // --- Auth Actions ---
  async login(address: string, role: string): Promise<any> {
    if (this.useMock) {
        await this.delay(500);
        return { success: true, token: 'mock_token', user: { address, role } };
    }
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, role })
        });
        if (!res.ok) throw new Error('Auth failed');
        return res.json();
    } catch (e) {
        // Fallback to mock login if backend fails during login attempt in "Hybrid" situations
        console.warn("Backend login failed, using mock fallback for demo.");
        return { success: true, token: 'mock_fallback', user: { address, role } };
    }
  }

  // --- Data Fetching ---
  async fetchData(): Promise<{ campaigns: Campaign[], transactions: Transaction[] }> {
    if (this.useMock) {
      this.initMockData(); 
      return { 
        campaigns: [...this._mockCampaigns], 
        transactions: [...this._mockTransactions] 
      };
    }

    try {
      // Set a timeout to prevent long hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const res = await fetch(`${API_URL}/api/init`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error(`Backend Error: ${res.statusText}`);
      return await res.json();
    } catch (error) {
      // Re-throw so the UI knows to switch to mock mode
      throw error;
    }
  }

  // --- Campaign Actions ---

  async createCampaign(data: any): Promise<any> {
    if (this.useMock) {
      await this.delay(1000);
      const newCampaign: Campaign = {
        id: (this._mockCampaigns.length + 1).toString(),
        title: data.title,
        ngoName: 'Verified NGO (You)',
        description: data.description,
        targetAmount: Number(data.targetAmount),
        raisedAmount: 0,
        status: CampaignStatus.FUNDRAISING,
        category: data.category,
        imageUrl: data.imageUrl,
        beneficiariesCount: Number(data.beneficiariesCount),
        location: data.location,
        createdAt: new Date().toISOString().split('T')[0]
      };
      this._mockCampaigns.unshift(newCampaign);
      
      this._mockTransactions.unshift({
        hash: 'tx_' + Math.random().toString(16).substr(2, 9),
        campaignId: newCampaign.id,
        from: 'addr_ngo',
        to: 'sc_registry',
        amount: 0,
        timestamp: new Date().toLocaleString(),
        type: 'CAMPAIGN_CREATED',
        blockHeight: 9234000
      });
      
      this.persistMockData();
      return { success: true, campaign: { ...newCampaign } };
    }
    const res = await fetch(`${API_URL}/api/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }

  async donate(campaignId: string, amount: number): Promise<any> {
    if (this.useMock) {
      await this.delay(1500);
      const campaign = this._mockCampaigns.find(c => c.id === campaignId);
      if (campaign) {
        campaign.raisedAmount += amount;
        if (campaign.raisedAmount >= campaign.targetAmount && campaign.status === CampaignStatus.FUNDRAISING) {
          campaign.status = CampaignStatus.LOCKED_FUNDED;
        }
        this._mockTransactions.unshift({
          hash: 'tx_' + Math.random().toString(16).substr(2, 9),
          campaignId: campaign.id,
          from: 'addr_donor',
          to: 'sc_pool',
          amount: amount,
          timestamp: new Date().toLocaleString(),
          type: 'DONATION',
          blockHeight: 9234000
        });
        this.persistMockData();
        return { success: true, campaign: { ...campaign } };
      }
      return { success: false, error: 'Campaign not found' };
    }
    const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    return res.json();
  }

  async submitProof(campaignId: string, proof: string): Promise<any> {
    if (this.useMock) {
      await this.delay(1500);
      const campaign = this._mockCampaigns.find(c => c.id === campaignId);
      if (campaign) {
        campaign.status = CampaignStatus.VERIFICATION_PENDING;
        campaign.proofOfWork = proof;
        this._mockTransactions.unshift({
          hash: 'tx_' + Math.random().toString(16).substr(2, 9),
          campaignId: campaign.id,
          from: 'addr_ngo',
          to: 'sc_contract',
          amount: 0,
          timestamp: new Date().toLocaleString(),
          type: 'PROOF_SUBMISSION',
          blockHeight: 9234000
        });
        this.persistMockData();
        return { success: true, campaign: { ...campaign } };
      }
      return { success: false, error: 'Campaign not found' };
    }
    const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proofHash: proof })
    });
    return res.json();
  }

  async verify(campaignId: string): Promise<any> {
    if (this.useMock) {
      await this.delay(2000);
      const campaign = this._mockCampaigns.find(c => c.id === campaignId);
      if (campaign && campaign.status === CampaignStatus.VERIFICATION_PENDING) {
        campaign.status = CampaignStatus.DISBURSED;
        campaign.nftBadgeMinted = true;
        if (!campaign.beneficiaryIds) campaign.beneficiaryIds = [];
        campaign.beneficiaryIds.push('addr_ben...9x');

        this._mockTransactions.unshift({
          hash: 'tx_' + Math.random().toString(16).substr(2, 9),
          campaignId: campaign.id,
          from: 'sc_contract',
          to: 'addr_ngo',
          amount: campaign.raisedAmount,
          timestamp: new Date().toLocaleString(),
          type: 'DISBURSEMENT',
          blockHeight: 9234000
        });
        this._mockTransactions.unshift({
          hash: 'tx_nft_' + Math.random().toString(16).substr(2, 9),
          campaignId: campaign.id,
          from: 'sc_policy',
          to: 'addr_ngo',
          amount: 0,
          timestamp: new Date().toLocaleString(),
          type: 'NFT_MINT',
          blockHeight: 9234000
        });
        this.persistMockData();
        return { success: true, campaign: { ...campaign } };
      }
      return { success: false, error: 'Campaign not in valid state for verification' };
    }
    const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/approve-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditNotes: 'Verified' })
    });
    return res.json();
  }

  async confirm(campaignId: string): Promise<any> {
    if (this.useMock) {
      await this.delay(1500);
      const campaign = this._mockCampaigns.find(c => c.id === campaignId);
      if (campaign) {
        campaign.status = CampaignStatus.COMPLETED;
        this._mockTransactions.unshift({
          hash: 'tx_' + Math.random().toString(16).substr(2, 9),
          campaignId: campaign.id,
          from: 'addr_beneficiary',
          to: 'sc_contract',
          amount: 0,
          timestamp: new Date().toLocaleString(),
          type: 'COMPLETED' as any,
          blockHeight: 9234000
        });
        this.persistMockData();
        return { success: true, campaign: { ...campaign } };
      }
      return { success: false, error: 'Campaign not found' };
    }
    const res = await fetch(`${API_URL}/api/campaigns/${campaignId}/confirm-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ beneficiaryStatement: 'Received' })
    });
    return res.json();
  }

  async addAudit(campaignId: string, score: number, report: string): Promise<any> {
    if (this.useMock) {
      const campaign = this._mockCampaigns.find(c => c.id === campaignId);
      if (campaign) {
        campaign.trustScore = score;
        campaign.auditReport = report;
        this.persistMockData();
      }
      return { success: true };
    }
    const res = await fetch(`${API_URL}/api/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId, score, report })
    });
    return res.json();
  }
}

export const chainService = new ChainService(true);
