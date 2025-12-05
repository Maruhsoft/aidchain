
import React from 'react';
import { Terminal, Globe, Server, Code } from 'lucide-react';

const DocsPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 min-h-screen">
      <div className="bg-white rounded-xl shadow-xl p-8 md:p-12 border border-slate-100">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6">Setup & Documentation</h1>
        
        <div className="prose prose-slate max-w-none">
          <div className="flex items-center gap-2 text-emerald-600 font-bold mb-8 bg-emerald-50 px-4 py-2 rounded-lg w-fit">
            <Terminal size={20} /> Developer Guide for Hackathon Judges
          </div>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">1. Prerequisites</h3>
            <ul className="space-y-2 list-disc pl-5 text-slate-600">
              <li>Node.js v18+</li>
              <li>GHC & Cabal (for Plutus contract compilation)</li>
              <li>Cardano Node (or Blockfrost API Key)</li>
              <li>Nami Wallet (Browser Extension)</li>
            </ul>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">2. Quick Start (Local Mock)</h3>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm mb-4">
              <p># Clone the repo</p>
              <p className="text-white">git clone https://github.com/Maruhsoft/aidchain.git</p>
              <p className="mt-2"># Install dependencies</p>
              <p className="text-white">cd aidchain && npm install</p>
              <p className="mt-2"># Run local dev environment</p>
              <p className="text-white">npm run dev</p>
            </div>
            <p className="text-slate-600">This will spin up the React frontend and a mock backend service that simulates blockchain latency and transactions.</p>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">3. Running with Local Backend</h3>
            <p className="text-slate-600 mb-4">To enable full backend logic including authentication and persistent database simulation:</p>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm mb-4">
              <p># 1. Start the Backend Server</p>
              <p className="text-white">cd backend</p>
              <p className="text-white">npm install</p>
              <p className="text-white">npm run dev</p>
              <p className="text-gray-500 mt-2"># Server runs at http://localhost:3001</p>
              <p className="mt-4"># 2. Start the Frontend (if not already running)</p>
              <p className="text-white">cd ../frontend</p>
              <p className="text-white">npm start</p>
            </div>
            <p className="text-slate-600 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
              <strong>Tip:</strong> Once the app is loaded, scroll to the <strong>Footer</strong> and toggle the 
              <span className="font-bold mx-1 px-2 py-0.5 bg-white border border-slate-200 rounded text-xs uppercase text-slate-500">Data Source</span> 
              switch from <strong>Mock</strong> to <strong>Backend</strong>. The app will reload and sync with your local Node.js server.
            </p>
          </section>

          <section className="mb-10">
            <h3 className="text-2xl font-bold text-slate-800 mb-4">4. Smart Contract Deployment</h3>
            <p className="text-slate-600 mb-4">To deploy the Plutus contracts to the Preprod testnet:</p>
            <div className="bg-slate-900 text-slate-300 p-4 rounded-lg font-mono text-sm mb-4">
              <p>cd contracts</p>
              <p>cabal build</p>
              <p className="text-white">./scripts/deploy.sh testnet</p>
            </div>
          </section>

           <section>
            <h3 className="text-2xl font-bold text-slate-800 mb-4">5. Architecture</h3>
            <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
              <ul className="space-y-4">
                <li className="flex gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm h-fit"><Globe size={20} className="text-emerald-600"/></div>
                  <div>
                    <span className="font-bold text-slate-900 block">Frontend (React)</span>
                    <span className="text-slate-600 text-sm">Handles user interactions, wallet connections (Lucid), and data visualization.</span>
                  </div>
                </li>
                 <li className="flex gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm h-fit"><Server size={20} className="text-emerald-600"/></div>
                  <div>
                    <span className="font-bold text-slate-900 block">Backend (Express + Blockfrost)</span>
                    <span className="text-slate-600 text-sm">Acts as an oracle for off-chain data and indexes blockchain events for the explorer.</span>
                  </div>
                </li>
                 <li className="flex gap-3">
                  <div className="bg-white p-2 rounded-lg shadow-sm h-fit"><Code size={20} className="text-emerald-600"/></div>
                  <div>
                    <span className="font-bold text-slate-900 block">Smart Contract (Plutus)</span>
                    <span className="text-slate-600 text-sm">Validates donations, locks funds, checks proof submission, and manages fund release.</span>
                  </div>
                </li>
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default DocsPage;
