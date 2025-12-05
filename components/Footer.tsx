
import React from 'react';
import { HeartHandshake, Github, Twitter, Linkedin, Database, Server } from 'lucide-react';

interface FooterProps {
  useMockData?: boolean;
  onToggleSource?: () => void;
}

const Footer: React.FC<FooterProps> = ({ useMockData, onToggleSource }) => {
  return (
    <footer className="bg-white border-t border-slate-200 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
           
           <div className="text-center md:text-left">
             <span className="text-xl font-extrabold text-slate-900 flex items-center justify-center md:justify-start gap-2 mb-2">
               <HeartHandshake className="text-emerald-600"/> AidChain
             </span>
             <p className="text-slate-500 text-sm font-medium">Empowering transparency in Nigerian aid with Cardano.</p>
             <p className="text-slate-400 text-xs mt-2">© 2024 AidChain Foundation. Open Source.</p>
           </div>
           
           {onToggleSource && (
             <div className="flex flex-col items-center gap-2">
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data Source</span>
               <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                 <button 
                   onClick={() => !useMockData && onToggleSource()}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                     useMockData ? 'bg-white shadow-sm text-emerald-600 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                   }`}
                 >
                   <Database size={14} /> Mock
                 </button>
                 <button 
                   onClick={() => useMockData && onToggleSource()}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                     !useMockData ? 'bg-white shadow-sm text-emerald-600 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                   }`}
                 >
                   <Server size={14} /> Backend
                 </button>
               </div>
             </div>
           )}

           <div className="flex gap-6 text-slate-400">
             <a href="#" className="hover:text-slate-900 transition-colors p-2 hover:bg-slate-50 rounded-full"><Github size={24} /></a>
             <a href="#" className="hover:text-blue-400 transition-colors p-2 hover:bg-blue-50 rounded-full"><Twitter size={24} /></a>
             <a href="#" className="hover:text-blue-700 transition-colors p-2 hover:bg-blue-50 rounded-full"><Linkedin size={24} /></a>
           </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
