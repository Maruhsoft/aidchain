
import { createContext } from 'react';
import { ToastType } from "./components/Toast";

export enum UserRole {
  GUEST = 'GUEST',
  DONOR = 'DONOR',
  NGO = 'NGO',
  AUDITOR = 'AUDITOR',
  BENEFICIARY = 'BENEFICIARY'
}

export enum CampaignStatus {
  FUNDRAISING = 'FUNDRAISING',
  LOCKED_FUNDED = 'LOCKED_FUNDED', // Target reached, funds held in SC
  VERIFICATION_PENDING = 'VERIFICATION_PENDING', // NGO submitted proof
  DISBURSED = 'DISBURSED', // Auditor verified, funds released to NGO
  COMPLETED = 'COMPLETED' // Beneficiaries confirmed receipt
}

export type CampaignCategory = 'Infrastructure' | 'Education' | 'Disaster Relief' | 'Healthcare' | 'Environment';

export interface Campaign {
  id: string;
  title: string;
  ngoName: string;
  description: string;
  targetAmount: number; // In ADA
  raisedAmount: number; // In ADA
  status: CampaignStatus;
  category: CampaignCategory | string;
  imageUrl: string;
  trustScore?: number; // AI Generated
  auditReport?: string; // AI Generated
  beneficiariesCount: number;
  location: string;
  proofOfWork?: string; // Link or Hash of proof submitted by NGO
  nftBadgeMinted?: boolean;
  beneficiaryIds?: string[]; // List of wallet addresses allowed to claim/confirm
  createdAt: string;
}

export interface Transaction {
  hash: string;
  campaignId: string;
  from: string;
  to: string; // Contract Address or NGO Address
  amount: number;
  timestamp: string;
  type: 'DONATION' | 'DISBURSEMENT' | 'NFT_MINT' | 'PROOF_SUBMISSION' | 'CAMPAIGN_CREATED' | 'COMPLETED';
  blockHeight: number;
}

export interface WalletContextState {
  isConnected: boolean;
  address: string | null;
  balance: number;
  role: UserRole;
  connectWallet: (role: UserRole) => void;
  disconnectWallet: () => void;
}

export interface ChainDataState {
  campaigns: Campaign[];
  transactions: Transaction[];
  createCampaign: (campaign: Omit<Campaign, 'id' | 'raisedAmount' | 'status' | 'createdAt'>) => Promise<boolean>;
  donate: (campaignId: string, amount: number) => Promise<boolean>;
  submitProof: (campaignId: string, proof: string) => Promise<boolean>;
  verifyAndDisburse: (campaignId: string) => Promise<boolean>;
  confirmReceipt: (campaignId: string) => Promise<boolean>;
  addAudit: (campaignId: string, score: number, report: string) => void;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export const WalletContext = createContext<WalletContextState | null>(null);
export const ChainContext = createContext<ChainDataState | null>(null);
