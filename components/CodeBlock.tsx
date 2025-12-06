
import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language: string;
  filename: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language, filename }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-900 text-slate-100 shadow-xl my-6">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700">
        <div className="flex items-center gap-2">
           <div className="flex gap-1.5">
             <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
             <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
           </div>
           <span className="ml-3 text-xs font-mono text-slate-400 font-bold">{filename}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="text-slate-400 hover:text-white transition-colors"
          title="Copy code"
        >
          {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-xs md:text-sm leading-relaxed">
          <code>
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock;
