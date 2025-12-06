
import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import Toast, { ToastProps, ToastType } from './Toast';
import { WalletContextState, ToastMessage } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wallet: WalletContextState;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
  useMockData: boolean;
  onToggleSource: () => void;
  toasts: ToastMessage[];
  removeToast: (id: string) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  wallet,
  onConnectClick,
  onDisconnectClick,
  useMockData,
  onToggleSource,
  toasts,
  removeToast
}) => {
  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-emerald-100 flex flex-col pb-24 md:pb-0">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col items-end pointer-events-none gap-2">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto w-full flex justify-end">
            <Toast {...t} onClose={removeToast} />
          </div>
        ))}
      </div>

      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        wallet={wallet} 
        onConnectClick={onConnectClick}
        onDisconnectClick={onDisconnectClick}
      />

      <main className="flex-grow animate-in fade-in duration-500 flex flex-col">
        {children}
      </main>

      <Footer 
        useMockData={useMockData} 
        onToggleSource={onToggleSource}
      />
    </div>
  );
};

export default Layout;
