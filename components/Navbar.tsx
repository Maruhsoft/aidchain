
import React from 'react';
import { 
  Globe, 
  Wallet, 
  LayoutDashboard, 
  Activity, 
  Code, 
  FileText, 
  HeartHandshake, 
  ShieldCheck, 
  User, 
  LogOut 
} from 'lucide-react';
import { UserRole, WalletContextState } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  wallet: WalletContextState;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  wallet, 
  onConnectClick, 
  onDisconnectClick 
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: <Globe size={18}/> },
    { id: 'explorer', label: 'Explorer', icon: <Activity size={18}/> },
    { id: 'codebase', label: 'Codebase', icon: <Code size={18}/> },
    { id: 'docs', label: 'Docs', icon: <FileText size={18}/> },
  ];

  // Show Dashboard if user is connected, regardless of role (Guest shouldn't be "connected" usually, but check isSafe)
  if (wallet.isConnected && wallet.role !== UserRole.GUEST) {
    navItems.splice(1, 0, { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18}/> });
  }

  return (
    <>
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab('home')}>
               <div className="bg-emerald-600 group-hover:bg-emerald-700 transition-colors p-2.5 rounded-xl shadow-lg shadow-emerald-200">
                 <HeartHandshake className="text-white h-6 w-6" />
               </div>
               <span className="text-2xl font-extrabold tracking-tight text-slate-900 group-hover:text-emerald-900 transition-colors">Aid<span className="text-emerald-600">Chain</span></span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all duration-200 ${
                    activeTab === item.id 
                    ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-slate-500 hover:text-emerald-600 hover:bg-slate-200/50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>

            {/* Wallet Section */}
            <div className="flex items-center gap-4">
              {wallet.isConnected ? (
                <div className="flex items-center gap-3 pl-4 pr-2 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm hover:border-emerald-300 transition-colors">
                  <div className="hidden sm:flex flex-col items-end mr-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">{wallet.role}</span>
                    <span className="text-sm font-bold text-slate-800 font-mono">₳ {wallet.balance.toLocaleString()}</span>
                  </div>
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center text-white shadow-md ${
                    wallet.role === UserRole.NGO ? 'bg-emerald-500' : 
                    wallet.role === UserRole.AUDITOR ? 'bg-blue-500' : 
                    wallet.role === UserRole.BENEFICIARY ? 'bg-rose-500' : 
                    wallet.role === UserRole.DONOR ? 'bg-purple-500' : 'bg-slate-500'
                  }`}>
                    {wallet.role === UserRole.NGO ? <Globe size={16}/> : 
                     wallet.role === UserRole.AUDITOR ? <ShieldCheck size={16}/> : 
                     wallet.role === UserRole.BENEFICIARY ? <HeartHandshake size={16}/> : 
                     <User size={16}/>}
                  </div>
                  <button 
                    onClick={onDisconnectClick}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-full transition-colors"
                    title="Disconnect"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={onConnectClick}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 md:px-7 py-3 rounded-xl text-sm font-bold shadow-xl shadow-emerald-200 transition-all flex items-center gap-2 active:scale-95 hover:-translate-y-0.5"
                >
                  <Wallet size={18} /> 
                  <span className="hidden sm:inline">Connect Wallet</span>
                  <span className="sm:hidden">Connect</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom App Bar */}
      <div className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] pb-safe">
        <div className="flex justify-around items-center h-[76px] px-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                  isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  isActive ? 'bg-emerald-50 -translate-y-1 shadow-sm' : ''
                }`}>
                  {React.cloneElement(item.icon as React.ReactElement<any>, { 
                    size: 22, 
                    strokeWidth: isActive ? 2.5 : 2 
                  })}
                </div>
                <span className={`text-[10px] tracking-tight transition-all ${
                  isActive ? 'opacity-100 font-extrabold' : 'opacity-70 font-medium'
                }`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Navbar;
