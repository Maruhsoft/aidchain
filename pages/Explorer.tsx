
import React, { useContext, useState } from 'react';
import { ChainContext } from '../types';
import { Server, Database, Clock, Activity } from 'lucide-react';
import Pagination from '../components/Pagination';

const ExplorerPage: React.FC = () => {
  const chain = useContext(ChainContext);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!chain) return null;

  const totalPages = Math.ceil(chain.transactions.length / itemsPerPage);
  const currentTransactions = chain.transactions.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500 min-h-screen">
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">Blockchain Explorer</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 text-slate-500 mb-2">
               <Server size={18} /> <span className="text-sm font-bold uppercase">Network Status</span>
             </div>
             <p className="text-lg font-bold text-emerald-600 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div> Connected (Preprod)</p>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 text-slate-500 mb-2">
               <Database size={18} /> <span className="text-sm font-bold uppercase">Latest Block</span>
             </div>
             <p className="text-lg font-bold text-slate-800">9,234,102</p>
           </div>
           <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 text-slate-500 mb-2">
               <Clock size={18} /> <span className="text-sm font-bold uppercase">Avg. Block Time</span>
             </div>
             <p className="text-lg font-bold text-slate-800">20s</p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Activity className="text-emerald-600" /> Recent Transactions
          </h3>
          <button className="text-emerald-600 text-sm font-bold hover:underline">View All on Cardanoscan</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                <th className="px-8 py-4 font-bold">Tx Hash</th>
                <th className="px-8 py-4 font-bold">Type</th>
                <th className="px-8 py-4 font-bold">From</th>
                <th className="px-8 py-4 font-bold">To</th>
                <th className="px-8 py-4 font-bold text-right">Amount (ADA)</th>
                <th className="px-8 py-4 font-bold text-right">Time</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {currentTransactions.map((tx, i) => (
                <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-8 py-4 font-mono text-emerald-600 truncate max-w-[120px] cursor-pointer hover:underline" title={tx.hash}>{tx.hash}</td>
                  <td className="px-8 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                      tx.type === 'DONATION' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                      tx.type === 'DISBURSEMENT' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                      'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-8 py-4 font-mono text-slate-500 truncate max-w-[100px]" title={tx.from}>{tx.from}</td>
                  <td className="px-8 py-4 font-mono text-slate-500 truncate max-w-[100px]" title={tx.to}>{tx.to}</td>
                  <td className="px-8 py-4 text-right font-bold text-slate-800">{tx.amount > 0 ? tx.amount.toLocaleString() : '-'}</td>
                  <td className="px-8 py-4 text-right text-slate-500">{tx.timestamp}</td>
                </tr>
              ))}
              {currentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center text-slate-400 italic">No transactions found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-6 border-t border-slate-100 bg-white">
          <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
};

export default ExplorerPage;
