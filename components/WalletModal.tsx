
import React from 'react';
import { X, Wallet, User, Globe, ShieldCheck, HeartHandshake, ArrowRight } from 'lucide-react';
import { UserRole } from '../types';

interface WalletModalProps {
  onClose: () => void;
  onConnect: (role: UserRole) => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ onClose, onConnect }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-300 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="text-emerald-600" /> Connect Wallet
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} className="text-slate-500"/></button>
        </div>
        <div className="p-6">
          <p className="text-slate-500 text-sm mb-6">
            For this hackathon demo, select a role to simulate wallet permissions. In production, this would verify your wallet's policy ID or stake key.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {[
              { role: UserRole.DONOR, label: 'Donor / Public', icon: <User size={18}/>, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
              { role: UserRole.NGO, label: 'NGO Manager', icon: <Globe size={18}/>, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
              { role: UserRole.AUDITOR, label: 'Independent Auditor', icon: <ShieldCheck size={18}/>, color: 'bg-teal-50 text-teal-700 hover:bg-teal-100' },
              { role: UserRole.BENEFICIARY, label: 'Beneficiary (DID)', icon: <HeartHandshake size={18}/>, color: 'bg-rose-50 text-rose-700 hover:bg-rose-100' }
            ].map((option) => (
              <button 
                key={option.role}
                onClick={() => onConnect(option.role)}
                className={`flex items-center gap-4 p-4 rounded-lg font-bold transition-all ${option.color} border border-transparent hover:border-current active:scale-95`}
              >
                <div className="p-2 bg-white rounded-full shadow-sm">
                  {option.icon}
                </div>
                <span>{option.label}</span>
                <ArrowRight size={16} className="ml-auto opacity-50" />
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 bg-slate-50 text-center text-xs text-slate-400">
          Supports Nami, Eternl, Flint, and Lace
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
