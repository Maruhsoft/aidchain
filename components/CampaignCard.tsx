
import React, { useState } from 'react';
import { Campaign, CampaignStatus, UserRole } from '../types';
import { ShieldCheck, Coins, Users, MapPin, CheckCircle, Activity, FileText, Upload, Award, ExternalLink, Loader2, Info, HeartHandshake, Wallet, ArrowRight } from 'lucide-react';
import { auditCampaign } from '../services/geminiService';

interface CampaignCardProps {
  campaign: Campaign;
  userRole: UserRole;
  onDonate: (amount: number) => Promise<void | boolean>;
  onSubmitProof: (proof: string) => Promise<void | boolean>;
  onVerify: () => Promise<void | boolean>;
  onConfirm: () => Promise<void | boolean>;
  onUpdateAudit: (score: number, report: string) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ 
  campaign, 
  userRole, 
  onDonate, 
  onSubmitProof, 
  onVerify, 
  onConfirm,
  onUpdateAudit 
}) => {
  const [donationAmount, setDonationAmount] = useState<string>('50');
  const [isAuditing, setIsAuditing] = useState(false);
  const [proofText, setProofText] = useState('');
  const [showProofInput, setShowProofInput] = useState(false);
  
  const [isDonating, setIsDonating] = useState(false);
  const [isSubmittingProof, setIsSubmittingProof] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  const progress = Math.min((campaign.raisedAmount / campaign.targetAmount) * 100, 100);
  const isGuest = userRole === UserRole.GUEST;

  const handleAudit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsAuditing(true);
    const result = await auditCampaign(campaign.title, campaign.description, campaign.location);
    if (result) {
      onUpdateAudit(result.trustScore, result.riskAnalysis);
    }
    setIsAuditing(false);
  };

  const handleDonateClick = async () => {
    if (isGuest) {
      onDonate(0).catch(() => {}); 
      return;
    }

    if (!donationAmount || Number(donationAmount) <= 0) return;
    setIsDonating(true);
    await onDonate(Number(donationAmount));
    setIsDonating(false);
    setDonationAmount('50');
  };

  const handleSubmitProofClick = async () => {
    if (!proofText) return;
    setIsSubmittingProof(true);
    await onSubmitProof(proofText);
    setIsSubmittingProof(false);
    setShowProofInput(false);
  };

  const handleVerifyClick = async () => {
    setIsVerifying(true);
    await onVerify();
    setIsVerifying(false);
  };

  const handleConfirmClick = async () => {
    setIsConfirming(true);
    await onConfirm();
    setIsConfirming(false);
  };

  const getStatusBadge = (status: CampaignStatus) => {
    const styles = {
      [CampaignStatus.FUNDRAISING]: 'bg-emerald-100/50 text-emerald-700 border-emerald-200 ring-emerald-500/20 backdrop-blur-md',
      [CampaignStatus.LOCKED_FUNDED]: 'bg-blue-100/50 text-blue-700 border-blue-200 ring-blue-500/20 backdrop-blur-md',
      [CampaignStatus.VERIFICATION_PENDING]: 'bg-amber-100/50 text-amber-700 border-amber-200 ring-amber-500/20 backdrop-blur-md',
      [CampaignStatus.DISBURSED]: 'bg-purple-100/50 text-purple-700 border-purple-200 ring-purple-500/20 backdrop-blur-md',
      [CampaignStatus.COMPLETED]: 'bg-teal-100/50 text-teal-700 border-teal-200 ring-teal-500/20 backdrop-blur-md',
    };

    const labels = {
      [CampaignStatus.FUNDRAISING]: 'Fundraising',
      [CampaignStatus.LOCKED_FUNDED]: 'Fully Funded',
      [CampaignStatus.VERIFICATION_PENDING]: 'Verifying',
      [CampaignStatus.DISBURSED]: 'Disbursed',
      [CampaignStatus.COMPLETED]: 'Completed',
    };

    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${styles[status]} flex items-center gap-1.5 shadow-sm`}>
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status === CampaignStatus.COMPLETED ? 'bg-teal-400' : 'bg-current'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${status === CampaignStatus.COMPLETED ? 'bg-teal-500' : 'bg-current'}`}></span>
        </span>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="group bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl hover:shadow-emerald-200/30 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
      {/* Image Section */}
      <div className="relative h-56 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/0 transition-colors z-10"></div>
        <img 
          src={campaign.imageUrl} 
          alt={campaign.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute top-4 left-4 z-20">
          <span className="bg-white/90 backdrop-blur-md text-slate-800 text-xs font-bold px-2.5 py-1 rounded-md shadow-sm border border-white/40">
            {campaign.category}
          </span>
        </div>
        <div className="absolute top-4 right-4 z-20">
          {getStatusBadge(campaign.status)}
        </div>
        
        {/* Trust Score Overlay */}
        {campaign.trustScore && (
          <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-md shadow-lg border border-white/40 flex items-center gap-2">
            <ShieldCheck size={16} className={campaign.trustScore > 80 ? 'text-emerald-500' : 'text-amber-500'} />
            <span className="font-bold text-slate-800 text-xs">{campaign.trustScore}/100 Trust</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-6 flex-grow flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-xl font-bold text-slate-900 leading-snug mb-1 group-hover:text-emerald-700 transition-colors">
              {campaign.title}
            </h3>
            <p className="text-sm text-slate-500 font-medium flex items-center gap-1">
              By <span className="text-slate-700 font-semibold">{campaign.ngoName}</span>
              {campaign.nftBadgeMinted && (
                <span title="Verified Impact NFT" className="flex items-center">
                  <Award size={14} className="text-emerald-500 ml-1" />
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 mt-2">
          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><MapPin size={12} /> {campaign.location}</span>
          <span className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Users size={12} /> {campaign.beneficiariesCount.toLocaleString()} Ppl</span>
        </div>

        <p className="text-slate-600 text-sm mb-6 line-clamp-2 leading-relaxed">
          {campaign.description}
        </p>

        {/* AI Audit Section */}
        {!isGuest && !campaign.trustScore && (
          <button 
            onClick={handleAudit}
            disabled={isAuditing}
            title="Use AI to analyze campaign risks"
            className="mb-6 w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors border border-emerald-200 border-dashed active:scale-95"
          >
            {isAuditing ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
            Run AI Fraud Check
          </button>
        )}

        {campaign.auditReport && (
          <div className="mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-xs text-slate-600 italic">
              <span className="font-bold text-emerald-600 not-italic flex items-center gap-1 mb-1"><Activity size={12}/> AI Analysis:</span> 
              "{campaign.auditReport}"
            </p>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-auto">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-slate-700">Raised: <span className="text-emerald-600 font-bold">₳{campaign.raisedAmount.toLocaleString()}</span></span>
            <span className="text-slate-400 text-xs mt-0.5">Target: ₳{campaign.targetAmount.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mb-6 overflow-hidden border border-slate-100">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                progress >= 100 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'
              }`}
              style={{ width: `${progress}%` }}
            >
              {progress >= 100 && (
                 <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              )}
            </div>
          </div>

          {/* Action Buttons based on Role & Status */}
          <div className="space-y-3 pt-5 border-t border-slate-100">
            
            {/* DONOR Actions (Includes GUEST) */}
            {(userRole === UserRole.DONOR || isGuest) && campaign.status === CampaignStatus.FUNDRAISING && (
              isGuest ? (
                 <button 
                  onClick={handleDonateClick}
                  title="Connect your wallet to start donating"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-lg text-sm font-bold shadow-lg shadow-slate-200 transition-all flex items-center justify-center gap-2 active:scale-95 group/btn"
                >
                  <Wallet size={16} /> Connect to Donate
                  <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform opacity-0 group-hover/btn:opacity-100" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">₳</span>
                    <input 
                      type="number" 
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all shadow-sm focus:bg-white text-slate-800"
                      placeholder="Amount"
                      disabled={isDonating}
                    />
                  </div>
                  <button 
                    onClick={handleDonateClick}
                    disabled={isDonating}
                    title="Send ADA to campaign smart contract"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-lg text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-95"
                  >
                    {isDonating ? <Loader2 size={16} className="animate-spin" /> : <Coins size={16} />}
                    Donate
                  </button>
                </div>
              )
            )}

            {/* NGO Actions */}
            {userRole === UserRole.NGO && (
              <>
                {(campaign.status === CampaignStatus.LOCKED_FUNDED || campaign.status === CampaignStatus.FUNDRAISING) && (
                  !showProofInput ? (
                    <button 
                      onClick={() => setShowProofInput(true)}
                      title="Upload evidence to request funds"
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg text-sm font-bold shadow-lg shadow-slate-300 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Upload size={16} /> Submit Proof of Work
                    </button>
                  ) : (
                    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
                       <input 
                        type="text" 
                        value={proofText}
                        onChange={(e) => setProofText(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm font-medium"
                        placeholder="IPFS Hash or Doc URL..."
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setShowProofInput(false)}
                          className="flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 py-2.5 rounded-lg text-sm font-bold transition-colors active:scale-95"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSubmitProofClick}
                          disabled={isSubmittingProof || !proofText}
                          title="Submit to blockchain"
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                          {isSubmittingProof ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle size={16} />}
                          Submit
                        </button>
                      </div>
                    </div>
                  )
                )}
                {campaign.status === CampaignStatus.VERIFICATION_PENDING && (
                  <div className="bg-amber-50 text-amber-800 px-4 py-3 rounded-lg text-xs font-bold flex items-center gap-2 border border-amber-100 justify-center">
                    <Loader2 size={14} className="animate-spin" /> Waiting for Auditor Verification...
                  </div>
                )}
              </>
            )}

            {/* AUDITOR Actions */}
            {userRole === UserRole.AUDITOR && (
              <>
                {campaign.status === CampaignStatus.VERIFICATION_PENDING ? (
                  <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
                      <FileText size={14} className="mt-0.5 text-emerald-500 shrink-0" />
                      <div className="w-full">
                        <span className="font-bold block text-slate-800 mb-1">Proof Submitted:</span>
                        <a href="#" className="font-mono text-emerald-600 hover:underline block break-all truncate">{campaign.proofOfWork || 'ipfs://Qm...'}</a>
                      </div>
                    </div>
                    <button 
                      onClick={handleVerifyClick}
                      disabled={isVerifying}
                      title="Release funds from smart contract"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-emerald-300 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                    >
                      {isVerifying ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                      Verify & Release Funds
                    </button>
                  </div>
                ) : campaign.status === CampaignStatus.FUNDRAISING || campaign.status === CampaignStatus.LOCKED_FUNDED ? (
                  <div className="text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                    Waiting for NGO proof submission...
                  </div>
                ) : null}
              </>
            )}

            {/* BENEFICIARY Actions */}
            {userRole === UserRole.BENEFICIARY && (
              <>
                {campaign.status === CampaignStatus.DISBURSED ? (
                  <button 
                    onClick={handleConfirmClick}
                    disabled={isConfirming}
                    title="Confirm you have received aid"
                    className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-3 rounded-lg text-sm font-bold shadow-lg shadow-teal-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
                  >
                    {isConfirming ? <Loader2 size={18} className="animate-spin" /> : <HeartHandshake size={18} />}
                    Confirm Receipt of Aid
                  </button>
                ) : campaign.status === CampaignStatus.COMPLETED ? (
                  <div className="bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border border-emerald-100">
                    <CheckCircle size={14} /> Receipt Confirmed
                  </div>
                ) : (
                   <div className="text-center text-xs text-slate-400 py-3 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                    Funds not yet disbursed.
                  </div>
                )}
              </>
            )}

            {/* Default Status Messages for Guests/Others */}
            {campaign.status === CampaignStatus.COMPLETED && userRole !== UserRole.BENEFICIARY && (
              <div className="w-full bg-slate-50 text-slate-500 py-3 rounded-lg text-xs font-bold text-center flex items-center justify-center gap-2 border border-slate-100">
                <CheckCircle size={14} className="text-emerald-500" /> Campaign Successfully Completed
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignCard;
