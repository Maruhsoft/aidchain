
import React, { useContext } from 'react';
import { LayoutDashboard, Activity, Coins, ArrowRight, User, Box, HeartHandshake, TrendingUp, Calendar, CheckCircle, ShieldCheck, FileText, Search, History } from 'lucide-react';
import { ChainContext, CampaignStatus, UserRole, WalletContext } from '../types';
import CampaignCard from '../components/CampaignCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

// --- NGO DASHBOARD ---
export const NgoDashboard: React.FC = () => {
  const chain = useContext(ChainContext);
  if (!chain) return null;

  const totalRaised = chain.campaigns.reduce((sum, c) => sum + c.raisedAmount, 0);
  const activeCount = chain.campaigns.filter(c => c.status === CampaignStatus.FUNDRAISING || c.status === CampaignStatus.LOCKED_FUNDED).length;
  const impactCount = chain.campaigns.filter(c => c.status === CampaignStatus.DISBURSED || c.status === CampaignStatus.COMPLETED).length;

  const chartData = chain.campaigns.map(c => ({
    name: c.title.length > 15 ? c.title.substring(0, 15) + '...' : c.title,
    fullTitle: c.title,
    Target: c.targetAmount,
    Raised: c.raisedAmount,
    Completion: Math.min((c.raisedAmount/c.targetAmount)*100, 100)
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700">
          <p className="font-bold text-sm mb-2">{payload[0].payload.fullTitle}</p>
          <p className="text-xs text-slate-400">Target: <span className="text-white font-mono">₳{payload[0].value.toLocaleString()}</span></p>
          <p className="text-xs text-slate-400">Raised: <span className="text-emerald-400 font-mono">₳{payload[1].value.toLocaleString()}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">NGO Dashboard</h2>
          <p className="text-slate-500 mt-1">Real-time oversight of your humanitarian campaigns.</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 bg-white shadow-sm border border-slate-200 px-4 py-2 rounded-full font-bold">
           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
           Syncing Live
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
             <div className="flex items-center gap-2 mb-3">
               <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Coins size={20}/></div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Raised</p>
             </div>
             <p className="text-4xl font-extrabold text-slate-900">₳ {totalRaised.toLocaleString()}</p>
             <p className="text-sm text-slate-400 mt-1 flex items-center gap-1"><TrendingUp size={14} className="text-emerald-500"/> +12% this month</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
           <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
               <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Activity size={20}/></div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Active Campaigns</p>
             </div>
            <p className="text-4xl font-extrabold text-slate-900">{activeCount}</p>
            <p className="text-sm text-slate-400 mt-1">Requires your attention</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
           <div className="absolute top-0 right-0 w-40 h-40 bg-teal-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
               <div className="p-2 bg-teal-100 text-teal-600 rounded-lg"><CheckCircle size={20}/></div>
               <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Projects Completed</p>
             </div>
            <p className="text-4xl font-extrabold text-slate-900">{impactCount}</p>
            <p className="text-sm text-slate-400 mt-1">Fully verified on-chain</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[450px]">
          <h3 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
            <LayoutDashboard size={20} className="text-emerald-500"/> Fundraising Velocity
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="Target" fill="#e2e8f0" radius={[6, 6, 6, 6]} />
                <Bar dataKey="Raised" fill="#10b981" radius={[6, 6, 6, 6]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 min-h-[450px] flex flex-col">
           <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
             <Activity size={20} className="text-emerald-500"/> Live Feed
           </h3>
           <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-grow max-h-[400px]">
              {chain.transactions.slice(0, 10).map((tx, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-slate-50 hover:border-slate-100 group">
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          tx.type === 'DONATION' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-100' : 
                          tx.type === 'DISBURSEMENT' ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100' : 
                          'bg-slate-50 text-slate-600 group-hover:bg-slate-100'
                      }`}>
                         {tx.type === 'DONATION' ? <Coins size={20}/> : tx.type === 'DISBURSEMENT' ? <ArrowRight size={20}/> : <Activity size={20}/>}
                      </div>
                      <div>
                         <p className="text-sm font-bold text-slate-900">{tx.type.replace('_', ' ')}</p>
                         <p className="text-xs text-slate-500 font-medium">{tx.timestamp.split(',')[0]}</p>
                      </div>
                   </div>
                   <span className="font-mono font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg text-sm group-hover:bg-white group-hover:shadow-sm transition-all">
                     {tx.amount > 0 ? `₳${tx.amount.toLocaleString()}` : 'Log'}
                   </span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

// --- BENEFICIARY DASHBOARD ---
export const BeneficiaryDashboard: React.FC = () => {
  const chain = useContext(ChainContext);
  const wallet = useContext(WalletContext);
  if (!chain || !wallet) return null;

  // Filter campaigns where the beneficiary ID matches the wallet address
  // Also showing COMPLETED/DISBURSED status to filter relevant active aid
  const myCampaigns = chain.campaigns.filter(c => {
    const isTargeted = c.beneficiaryIds?.includes(wallet.address || '');
    const isReady = c.status === CampaignStatus.DISBURSED || c.status === CampaignStatus.COMPLETED;
    return isTargeted && isReady;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in slide-in-from-bottom-4 min-h-screen">
      <div className="bg-gradient-to-r from-emerald-900 to-green-900 p-8 md:p-12 rounded-2xl mb-12 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">Welcome, Verified Beneficiary</h2>
            <p className="text-emerald-100 text-lg max-w-xl leading-relaxed">
              Your digital identity (NIN linked) is active. Confirm receipt of aid packages below to build on-chain reputation and unlock future funding tiers.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-xl max-w-xs w-full">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                <User size={24} />
              </div>
              <div>
                <p className="text-emerald-200 text-xs uppercase font-bold tracking-wider">Identity Status</p>
                <p className="text-white font-bold">Verified (DID)</p>
              </div>
            </div>
            <div className="bg-black/20 rounded-lg p-3 font-mono text-xs text-emerald-200 break-all border border-white/5">
              {wallet.address || 'did:cardano:unavailable'}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><Box size={24}/></div>
        <h3 className="text-2xl font-bold text-slate-800">Pending Aid Disbursements</h3>
      </div>
      
      {myCampaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-sm">
          <div className="bg-slate-50 p-6 rounded-full mb-6">
            <HeartHandshake className="h-16 w-16 text-slate-300" />
          </div>
          <h4 className="text-xl font-bold text-slate-800 mb-2">No active disbursements found</h4>
          <p className="text-slate-500 max-w-md text-center">
             Funds will appear here when an NGO disburses aid to your wallet address ({wallet.address}).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {myCampaigns.map(c => (
              <CampaignCard 
                key={c.id}
                campaign={c}
                userRole={UserRole.BENEFICIARY}
                onDonate={async () => {}}
                onSubmitProof={async () => {}}
                onVerify={async () => {}}
                onConfirm={() => chain.confirmReceipt(c.id)}
                onUpdateAudit={() => {}}
              />
           ))}
        </div>
      )}
    </div>
  );
};

// --- DONOR DASHBOARD ---
export const DonorDashboard: React.FC = () => {
  const chain = useContext(ChainContext);
  const wallet = useContext(WalletContext);
  if (!chain || !wallet) return null;

  // Filter transactions made by this donor
  const myDonations = chain.transactions.filter(tx => 
    tx.type === 'DONATION' && (tx.from === wallet.address || wallet.address === 'addr_donor1' || wallet.address === 'addr_test...3x')
  );
  
  const totalDonated = myDonations.reduce((sum, tx) => sum + tx.amount, 0);
  
  const supportedCampaignIds = [...new Set(myDonations.map(tx => tx.campaignId))];
  const supportedCampaigns = chain.campaigns.filter(c => supportedCampaignIds.includes(c.id));

  // Category breakdown for chart
  const categoryData = supportedCampaigns.reduce((acc: any[], campaign) => {
    const existing = acc.find(i => i.name === campaign.category);
    const amount = myDonations.filter(tx => tx.campaignId === campaign.id).reduce((s, t) => s + t.amount, 0);
    
    if (existing) {
      existing.value += amount;
    } else {
      acc.push({ name: campaign.category, value: amount });
    }
    return acc;
  }, []);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500 min-h-screen">
      <div className="mb-10">
        <h2 className="text-3xl font-bold text-slate-900">Donor Portfolio</h2>
        <p className="text-slate-500 mt-1">Track the impact of your contributions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="p-4 bg-emerald-100 text-emerald-600 rounded-full">
             <Coins size={28} />
           </div>
           <div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Donated</p>
             <p className="text-3xl font-extrabold text-slate-900">₳ {totalDonated.toLocaleString()}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="p-4 bg-blue-100 text-blue-600 rounded-full">
             <HeartHandshake size={28} />
           </div>
           <div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Campaigns Supported</p>
             <p className="text-3xl font-extrabold text-slate-900">{supportedCampaigns.length}</p>
           </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
           <div className="p-4 bg-purple-100 text-purple-600 rounded-full">
             <User size={28} />
           </div>
           <div>
             <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Est. Impact</p>
             <p className="text-3xl font-extrabold text-slate-900">
               {supportedCampaigns.reduce((sum, c) => sum + c.beneficiariesCount, 0).toLocaleString()} <span className="text-sm font-medium text-slate-400">People</span>
             </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <h3 className="text-xl font-bold text-slate-800">Your Supported Campaigns</h3>
           {supportedCampaigns.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {supportedCampaigns.map(c => (
                  <CampaignCard 
                    key={c.id} 
                    campaign={c} 
                    userRole={UserRole.DONOR}
                    onDonate={() => chain.donate(c.id, 0)} // Placeholder, handled in modal
                    onSubmitProof={async () => {}}
                    onVerify={async () => {}}
                    onConfirm={async () => {}}
                    onUpdateAudit={() => {}}
                  />
                ))}
             </div>
           ) : (
             <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
               <p className="text-slate-500 font-medium">You haven't made any donations yet.</p>
               <button className="mt-4 text-emerald-600 font-bold hover:underline">Browse Campaigns</button>
             </div>
           )}
        </div>

        <div>
          <h3 className="text-xl font-bold text-slate-800 mb-6">Impact Distribution</h3>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex justify-center">
             {categoryData.length > 0 ? (
               <PieChart width={300} height={300}>
                <Pie
                  data={categoryData}
                  cx={150}
                  cy={150}
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
             ) : (
               <div className="h-[300px] flex items-center justify-center text-slate-400 text-sm">No data available</div>
             )}
          </div>
          
          <div className="mt-8">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Donation History</h3>
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
               {myDonations.slice(0, 5).map((tx, i) => (
                 <div key={i} className="p-4 border-b border-slate-50 hover:bg-slate-50 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-bold text-slate-700">Donation Sent</p>
                      <p className="text-xs text-slate-400">{tx.timestamp.split(',')[0]}</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-600">-{tx.amount} ADA</span>
                 </div>
               ))}
               {myDonations.length === 0 && <div className="p-6 text-center text-slate-400 text-sm">No history found</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- AUDITOR DASHBOARD ---
export const AuditorDashboard: React.FC = () => {
  const chain = useContext(ChainContext);
  if (!chain) return null;

  const pendingVerification = chain.campaigns.filter(c => c.status === CampaignStatus.VERIFICATION_PENDING);
  const pastAudits = chain.campaigns.filter(c => c.status === CampaignStatus.DISBURSED || c.status === CampaignStatus.COMPLETED);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Auditor Workstation</h2>
          <p className="text-slate-500 mt-1">Independent verification and fund release management.</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-sm font-bold border border-slate-200">
             License: #AUD-NG-2024
           </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-amber-500">
           <div className="flex items-center justify-between mb-2">
             <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Pending Review</p>
             <ClockIcon className="text-amber-500" size={20} />
           </div>
           <p className="text-4xl font-extrabold text-slate-900">{pendingVerification.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-emerald-500">
           <div className="flex items-center justify-between mb-2">
             <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Audits Completed</p>
             <CheckCircle className="text-emerald-500" size={20} />
           </div>
           <p className="text-4xl font-extrabold text-slate-900">{pastAudits.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-blue-500">
           <div className="flex items-center justify-between mb-2">
             <p className="text-slate-500 font-bold uppercase text-xs tracking-wider">Reputation Score</p>
             <ShieldCheck className="text-blue-500" size={20} />
           </div>
           <p className="text-4xl font-extrabold text-slate-900">98/100</p>
        </div>
      </div>

      <div className="mb-12">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FileText className="text-amber-500" /> Pending Verification Queue
        </h3>
        {pendingVerification.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingVerification.map(c => (
              <div key={c.id} className="relative">
                 <div className="absolute -top-3 -right-3 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md z-10 animate-pulse">Action Required</div>
                 <CampaignCard 
                    campaign={c}
                    userRole={UserRole.AUDITOR}
                    onDonate={async () => {}}
                    onSubmitProof={async () => {}}
                    onVerify={() => chain.verifyAndDisburse(c.id)}
                    onConfirm={async () => {}}
                    onUpdateAudit={() => {}}
                  />
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-xl p-12 text-center border border-dashed border-slate-300">
            <CheckCircle className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <h4 className="text-lg font-bold text-slate-700">All caught up!</h4>
            <p className="text-slate-500">No campaigns are currently waiting for verification.</p>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <History className="text-emerald-500" /> Audit History
        </h3>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Campaign</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Amount Released</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pastAudits.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{c.title}</td>
                  <td className="px-6 py-4">
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold border border-emerald-200">Verified</span>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-600">₳ {c.raisedAmount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-slate-500 text-sm">Oct 20, 2023</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ClockIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
