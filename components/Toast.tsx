import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Loader2 } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, onClose }) => {
  useEffect(() => {
    if (type !== 'loading') {
      const timer = setTimeout(() => onClose(id), 5000);
      return () => clearTimeout(timer);
    }
  }, [id, type, onClose]);

  const styles = {
    success: 'bg-white border-l-4 border-emerald-500 text-slate-800',
    error: 'bg-white border-l-4 border-rose-500 text-slate-800',
    info: 'bg-white border-l-4 border-indigo-500 text-slate-800',
    loading: 'bg-slate-900 border-l-4 border-indigo-400 text-white',
  };

  const icons = {
    success: <CheckCircle size={20} className="text-emerald-500" />,
    error: <AlertCircle size={20} className="text-rose-500" />,
    info: <Info size={20} className="text-indigo-500" />,
    loading: <Loader2 size={20} className="text-indigo-400 animate-spin" />,
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg shadow-xl border border-slate-100/50 animate-in slide-in-from-right-full fade-in duration-300 w-full max-w-sm mb-3 relative overflow-hidden backdrop-blur-sm ${styles[type]}`}>
      <div className="shrink-0">{icons[type]}</div>
      <p className="text-sm font-medium leading-relaxed flex-1">{message}</p>
      {type !== 'loading' && (
        <button 
          onClick={() => onClose(id)} 
          className="shrink-0 p-1 rounded-full hover:bg-black/5 transition-colors text-slate-400 hover:text-slate-600"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export default Toast;