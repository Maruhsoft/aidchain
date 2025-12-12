
import React, { useState, useEffect } from 'react';
import { 
  UserRole, 
  Campaign, 
  Transaction, 
  WalletContextState, 
  ToastMessage,
  WalletContext,
  ChainContext
} from './types';
import { ToastType } from './components/Toast';
import WalletModal from './components/WalletModal';
import CreateCampaignModal from './components/CreateCampaignModal';
import HomePage from './pages/Home';
import { NgoDashboard, BeneficiaryDashboard, DonorDashboard, AuditorDashboard } from './pages/Dashboard';
import ExplorerPage from './pages/Explorer';
import CodebasePage from './pages/Codebase';
import DocsPage from './pages/Docs';
import Layout from './components/Layout';
import { Lock } from 'lucide-react';
import { chainService } from './services/chainService';

export const App = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const [useMockData, setUseMockData] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [wallet, setWallet] = useState<WalletContextState>({
    isConnected: false,
    address: null,
    balance: 0,
    role: UserRole.GUEST,
    connectWallet: () => {},
    disconnectWallet: () => {}
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    return id;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const loadData = async () => {
    setIsLoading(true);
    chainService.setSource(useMockData);
    
    try {
      const data = await chainService.fetchData();
      setCampaigns(data.campaigns);
      setTransactions(data.transactions);
    } catch (err) {
      if (!useMockData) {
        console.warn("Backend unavailable, auto-switching to mock.");
        addToast('Backend unreachable. Reverting to Mock Mode.', 'info');
        setUseMockData(true); 
      } else {
         console.error("Critical: Failed to load mock data", err);
         addToast('System Error: Could not load application.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [useMockData]);

  const handleConnectWallet = async (role: UserRole) => {
    // Simulated Wallet Addresses
    const address = role === UserRole.NGO ? 'addr_ngo...8s' : role === UserRole.BENEFICIARY ? 'addr_ben...9x' : 'addr_test...3x';
    
    try {
        await chainService.login(address, role);
        setWallet({
          isConnected: true,
          address: address,
          balance: 1500,
          role,
          connectWallet: handleConnectWallet,
          disconnectWallet: handleDisconnectWallet
        });
        setIsWalletModalOpen(false);
        addToast(`Connected as ${role}`, 'success');
    } catch (e) {
        addToast('Login Failed', 'error');
    }
  };

  const handleDisconnectWallet = () => {
    setWallet({
      isConnected: false,
      address: null,
      balance: 0,
      role: UserRole.GUEST,
      connectWallet: handleConnectWallet,
      disconnectWallet: handleDisconnectWallet
    });
    if (activeTab === 'dashboard') setActiveTab('home');
    addToast('Wallet disconnected', 'info');
  };

  const wrapAction = async (actionFn: () => Promise<any>, loadingMsg: string, successMsg: string, failMsg: string) => {
    const loadId = addToast(loadingMsg, 'loading');
    try {
      const result = await actionFn();
      
      // If the result includes updated campaign data, update state directly
      if (result && result.campaign) {
        setCampaigns(prevCampaigns => 
          prevCampaigns.map(c => c.id === result.campaign.id ? result.campaign : c)
        );
      } else {
        // Otherwise reload all data
        await loadData();
      }
      
      removeToast(loadId);
      addToast(successMsg, 'success');
      return true;
    } catch (e) {
      removeToast(loadId);
      addToast(failMsg, 'error');
      return false;
    }
  };

  const chainActions = {
    campaigns,
    transactions,
    donate: (id: string, amt: number) => {
      if (!wallet.isConnected) return Promise.reject('Not connected');
      return wrapAction(() => chainService.donate(id, amt), 'Processing transaction...', `Successfully donated ₳${amt}!`, 'Transaction failed');
    },
    submitProof: (id: string, proof: string) => wrapAction(() => chainService.submitProof(id, proof), 'Submitting proof...', 'Proof submitted for verification', 'Submission failed'),
    verifyAndDisburse: (id: string) => wrapAction(() => chainService.verify(id), 'Verifying & Releasing funds...', 'Funds released & NFT Minted', 'Verification failed'),
    confirmReceipt: (id: string) => wrapAction(() => chainService.confirm(id), 'Confirming receipt...', 'Receipt confirmed. Campaign Completed!', 'Confirmation failed'),
    createCampaign: (data: any) => {
      return wrapAction(() => chainService.createCampaign(data), 'Creating campaign...', 'Campaign created successfully', 'Creation failed').then(success => {
        if (success) {
          setIsCreateModalOpen(false);
          // Reload campaigns after creation to ensure we have the latest list
          loadData();
        }
        return success;
      });
    },
    addAudit: async (id: string, score: number, report: string) => {
      await chainService.addAudit(id, score, report);
      // Update the campaign in state with audit info
      setCampaigns(prevCampaigns =>
        prevCampaigns.map(c => 
          c.id === id ? { ...c, trustScore: score, auditReport: report } : c
        )
      );
      addToast('AI Audit Report Generated', 'info');
    }
  };

  return (
    <WalletContext.Provider value={{ ...wallet, connectWallet: handleConnectWallet, disconnectWallet: handleDisconnectWallet }}>
      <ChainContext.Provider value={chainActions}>
        <Layout
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          wallet={wallet}
          onConnectClick={() => setIsWalletModalOpen(true)}
          onDisconnectClick={handleDisconnectWallet}
          useMockData={useMockData}
          onToggleSource={() => setUseMockData(!useMockData)}
          toasts={toasts}
          removeToast={removeToast}
        >
          {isLoading ? (
             <div className="flex-grow flex items-center justify-center min-h-[60vh]">
               <div className="flex flex-col items-center gap-4 animate-in fade-in">
                 <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                 <p className="text-slate-500 font-medium">Syncing with {useMockData ? 'Mock Network' : 'Local Backend'}...</p>
               </div>
             </div>
          ) : (
            <>
              {activeTab === 'home' && <HomePage onCreateClick={() => setIsCreateModalOpen(true)} onConnectClick={() => setIsWalletModalOpen(true)} />}
              
              {activeTab === 'dashboard' && (
                wallet.isConnected ? (
                  wallet.role === UserRole.BENEFICIARY ? <BeneficiaryDashboard /> : 
                  wallet.role === UserRole.NGO ? <NgoDashboard /> : 
                  wallet.role === UserRole.AUDITOR ? <AuditorDashboard /> :
                  wallet.role === UserRole.DONOR ? <DonorDashboard /> :
                  <DonorDashboard />
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center animate-in fade-in p-6 text-center">
                    <div className="bg-slate-100 p-6 rounded-full mb-4 shadow-sm">
                      <Lock className="text-slate-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800">Access Restricted</h2>
                    <p className="text-slate-500 mb-6 max-w-md mt-2">You must connect a wallet with appropriate permissions to view the private dashboard.</p>
                    <button 
                      onClick={() => setIsWalletModalOpen(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-xl shadow-emerald-200 hover:-translate-y-1"
                    >
                      Connect Wallet
                    </button>
                  </div>
                )
              )}
              
              {activeTab === 'explorer' && <ExplorerPage />}
              {activeTab === 'codebase' && <CodebasePage />}
              {activeTab === 'docs' && <DocsPage />}
            </>
          )}

          {isWalletModalOpen && (
            <WalletModal 
              onClose={() => setIsWalletModalOpen(false)} 
              onConnect={handleConnectWallet} 
            />
          )}
          {isCreateModalOpen && (
            <CreateCampaignModal 
              onClose={() => setIsCreateModalOpen(false)}
              onSubmit={chainActions.createCampaign}
            />
          )}
        </Layout>
      </ChainContext.Provider>
    </WalletContext.Provider>
  );
};
