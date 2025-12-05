
import React, { useContext, useState, useEffect } from 'react';
import { Search, Globe, ArrowRight, Wallet, Lock, Sparkles, Filter } from 'lucide-react';
import { ChainContext, WalletContext, UserRole, CampaignStatus } from '../types';
import CampaignCard from '../components/CampaignCard';
import Pagination from '../components/Pagination';

interface HeroSectionProps {
  onCreateClick: () => void;
  onConnectClick: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onCreateClick, onConnectClick }) => {
  const wallet = useContext(WalletContext);

  return (
    <div className="relative bg-slate-900 overflow-hidden min-h-[600px] flex items-center justify-center">
      {/* Dynamic Background */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1543857770-7245f1345f47?auto=format&fit=crop&q=80&w=2000" 
          alt="Lagos Skyline" 
          className="w-full h-full object-cover opacity-30 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/80 via-slate-900/80 to-slate-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center z-10">
        <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-emerald-200 text-xs font-bold uppercase tracking-widest">Live on Cardano Preprod</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight drop-shadow-2xl">
            Transparency for every <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-400 animate-gradient">Naira and ADA donated.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Empowering Nigerian communities through blockchain transparency. 
            Track every Kobo from Lagos to Maiduguri using smart contracts.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => {
                const element = document.getElementById('campaigns-section');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-emerald-900/50 transition-all flex items-center justify-center gap-2 transform active:scale-95"
            >
              Start Donating
              <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
            </button>
            
            {/* Logic for Create Campaign Button */}
            {wallet?.isConnected && wallet.role === UserRole.NGO ? (
              <button 
                onClick={onCreateClick}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/20 backdrop-blur-md px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                Start a Campaign <Sparkles size={20} className="text-yellow-400" />
              </button>
            ) : wallet?.isConnected ? (
              <button 
                disabled
                className="bg-slate-800/50 text-slate-500 border border-slate-700 backdrop-blur-md px-8 py-4 rounded-xl font-bold text-lg cursor-not-allowed flex items-center justify-center gap-2"
              >
                Start a Campaign <Lock size={18} />
              </button>
            ) : (
              <button 
                onClick={onConnectClick}
                className="bg-white/5 hover:bg-white/10 text-white border border-white/20 backdrop-blur-md px-8 py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                Connect to Create <Wallet size={18} />
              </button>
            )}
          </div>
          
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/5 pt-8 max-w-3xl mx-auto">
            <div className="animate-in fade-in delay-100 duration-500">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">₳ 1.2M+</p>
              <p className="text-xs md:text-sm text-slate-400 uppercase tracking-wider font-semibold">Value Locked</p>
            </div>
            <div className="animate-in fade-in delay-200 duration-500">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">450+</p>
              <p className="text-xs md:text-sm text-slate-400 uppercase tracking-wider font-semibold">Verified NGOs</p>
            </div>
            <div className="animate-in fade-in delay-300 duration-500">
              <p className="text-3xl md:text-4xl font-bold text-white mb-1">100%</p>
              <p className="text-xs md:text-sm text-slate-400 uppercase tracking-wider font-semibold">Traceability</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage: React.FC<{ onCreateClick: () => void, onConnectClick: () => void }> = ({ onCreateClick, onConnectClick }) => {
  const chain = useContext(ChainContext);
  const wallet = useContext(WalletContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, statusFilter]);

  if (!chain || !wallet) return null;

  const filteredCampaigns = chain.campaigns.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.ngoName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesStatus = statusFilter === 'All' || 
                          (statusFilter === 'Active' && (c.status === CampaignStatus.FUNDRAISING || c.status === CampaignStatus.LOCKED_FUNDED)) ||
                          (statusFilter === 'Completed' && c.status === CampaignStatus.COMPLETED);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPages = Math.ceil(filteredCampaigns.length / itemsPerPage);
  const currentCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="pb-20 min-h-screen bg-slate-50">
      <HeroSection onCreateClick={onCreateClick} onConnectClick={onConnectClick} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20" id="campaigns-section">
        <div className="bg-white rounded-xl shadow-xl shadow-emerald-900/10 p-6 border border-slate-100 flex flex-col lg:flex-row gap-4 items-center">
          <div className="relative flex-grow w-full lg:w-auto">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search campaigns, NGOs, or locations..." 
              className="w-full pl-12 pr-4 py-4 rounded-lg border border-slate-200 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-slate-50 focus:bg-white text-slate-800 font-medium placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
             <div className="relative group min-w-[200px]">
               <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
               <select 
                 className="w-full pl-10 pr-8 py-4 rounded-lg border border-slate-200 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 bg-white cursor-pointer hover:bg-slate-50 transition-all font-bold text-slate-700 appearance-none"
                 value={selectedCategory}
                 onChange={(e) => setSelectedCategory(e.target.value)}
               >
                 <option value="All">All Categories</option>
                 <option value="Infrastructure">Infrastructure</option>
                 <option value="Education">Education</option>
                 <option value="Disaster Relief">Disaster Relief</option>
                 <option value="Healthcare">Healthcare</option>
                 <option value="Environment">Environment</option>
               </select>
             </div>

             <div className="relative group min-w-[200px]">
               <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusFilter === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
               <select 
                 className="w-full pl-8 pr-8 py-4 rounded-lg border border-slate-200 outline-none focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 bg-white cursor-pointer hover:bg-slate-50 transition-all font-bold text-slate-700 appearance-none"
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
               >
                 <option value="All">All Statuses</option>
                 <option value="Active">Active Fundraising</option>
                 <option value="Completed">Completed</option>
               </select>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Featured Campaigns</h2>
            <p className="text-slate-500 mt-2">Support verified projects making real impact across Nigeria.</p>
          </div>
          <span className="text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-lg font-bold text-sm shadow-sm border border-emerald-100">
            {filteredCampaigns.length} Active Projects
          </span>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-xl border border-dashed border-slate-300">
            <div className="bg-slate-50 p-6 rounded-full mb-6">
              <Globe className="h-12 w-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No campaigns found</h3>
            <p className="text-slate-500 max-w-md text-center">Try adjusting your filters or search term to find what you're looking for.</p>
            <button 
              onClick={() => {setSearchTerm(''); setSelectedCategory('All'); setStatusFilter('All');}}
              className="mt-6 text-emerald-600 font-bold hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {currentCampaigns.map(c => (
                <CampaignCard 
                  key={c.id} 
                  campaign={c} 
                  userRole={wallet.role}
                  onDonate={(amount) => {
                    if (!wallet.isConnected) {
                      onConnectClick();
                      return Promise.reject('Guest');
                    }
                    return chain.donate(c.id, amount);
                  }}
                  onSubmitProof={(proof) => chain.submitProof(c.id, proof)}
                  onVerify={() => chain.verifyAndDisburse(c.id)}
                  onConfirm={() => chain.confirmReceipt(c.id)}
                  onUpdateAudit={(score, report) => chain.addAudit(c.id, score, report)}
                />
              ))}
            </div>
            
            <Pagination 
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
