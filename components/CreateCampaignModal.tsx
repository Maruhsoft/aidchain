
import React, { useState } from 'react';
import { Plus, X, Coins } from 'lucide-react';

interface CreateCampaignModalProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    category: 'Infrastructure',
    location: 'Lagos, Nigeria',
    imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=800',
    beneficiariesCount: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    onSubmit({
      ...formData,
      targetAmount: Number(formData.targetAmount),
      beneficiariesCount: Number(formData.beneficiariesCount)
    });
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Plus className="text-emerald-600" /> Create New Campaign
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-500" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Campaign Title</label>
              <input 
                required
                className="w-full border border-slate-200 bg-slate-50/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                placeholder="e.g. Clean Water for Village X"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Target Amount (ADA)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₳</span>
                <input 
                  required
                  type="number"
                  className="w-full border border-slate-200 bg-slate-50/50 rounded-lg pl-10 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                  placeholder="5000"
                  value={formData.targetAmount}
                  onChange={e => setFormData({...formData, targetAmount: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Description</label>
            <textarea 
              required
              rows={4}
              className="w-full border border-slate-200 bg-slate-50/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all shadow-sm resize-none"
              placeholder="Describe the problem, solution, and how funds will be used..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Category</label>
              <select 
                className="w-full border border-slate-200 bg-slate-50/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all shadow-sm cursor-pointer"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option>Infrastructure</option>
                <option>Education</option>
                <option>Disaster Relief</option>
                <option>Healthcare</option>
                <option>Environment</option>
              </select>
            </div>
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Location</label>
              <input 
                required
                className="w-full border border-slate-200 bg-slate-50/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                placeholder="City, Country"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
              />
            </div>
          </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Beneficiaries Count</label>
              <input 
                required
                type="number"
                className="w-full border border-slate-200 bg-slate-50/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                placeholder="1000"
                value={formData.beneficiariesCount}
                onChange={e => setFormData({...formData, beneficiariesCount: e.target.value})}
              />
            </div>
             <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700">Cover Image URL</label>
              <input 
                required
                className="w-full border border-slate-200 bg-slate-50/50 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all shadow-sm"
                placeholder="https://..."
                value={formData.imageUrl}
                onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-lg font-bold transition-colors disabled:opacity-70 active:scale-95"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 rounded-lg font-bold transition-all shadow-lg shadow-emerald-200 hover:shadow-emerald-300 flex items-center justify-center gap-2 disabled:opacity-70 active:scale-95"
            >
              {isLoading && <Coins className="animate-spin" size={20} />}
              Launch Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCampaignModal;
