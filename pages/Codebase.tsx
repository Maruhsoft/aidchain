
import React, { useState } from 'react';
import { Folder, Code, Server, Terminal, Settings } from 'lucide-react';
import CodeBlock from '../components/CodeBlock';
import { 
  FOLDER_STRUCTURE, 
  PLUTUS_CONTRACT, 
  EXPRESS_BACKEND, 
  DEPLOY_SCRIPT, 
  PACKAGE_JSON 
} from '../data/projectSources';

const CodebasePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'structure' | 'contract' | 'backend' | 'scripts' | 'config'>('structure');

  const tabs = [
    { id: 'structure', label: 'Folder Structure', icon: <Folder size={16}/> },
    { id: 'contract', label: 'Smart Contract (Plutus)', icon: <Code size={16}/> },
    { id: 'backend', label: 'Backend API', icon: <Server size={16}/> },
    { id: 'scripts', label: 'Deploy Scripts', icon: <Terminal size={16}/> },
    { id: 'config', label: 'Configuration', icon: <Settings size={16}/> },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 min-h-screen">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Project Codebase</h2>
        <p className="text-slate-500 max-w-2xl">
          Review the underlying architecture of AidChain. This section showcases the Plutus smart contracts, 
          Express.js backend logic, and deployment scripts used to power the platform.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === tab.id 
              ? 'bg-slate-900 text-white shadow-md' 
              : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
        {activeTab === 'structure' && (
          <CodeBlock code={FOLDER_STRUCTURE} language="bash" filename="Project Structure" />
        )}
        {activeTab === 'contract' && (
           <CodeBlock code={PLUTUS_CONTRACT} language="haskell" filename="contracts/AidChain.hs" />
        )}
        {activeTab === 'backend' && (
           <CodeBlock code={EXPRESS_BACKEND} language="javascript" filename="backend/src/server.js" />
        )}
        {activeTab === 'scripts' && (
           <CodeBlock code={DEPLOY_SCRIPT} language="bash" filename="scripts/deploy.sh" />
        )}
         {activeTab === 'config' && (
           <CodeBlock code={PACKAGE_JSON} language="json" filename="backend/package.json" />
        )}
      </div>
    </div>
  );
};

export default CodebasePage;
