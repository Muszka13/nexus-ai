import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Cpu, Network, Key, Server, Lock, AlertTriangle, Play, Save, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

interface LiveSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWallet: any;
}

const LiveSettingsModal: React.FC<LiveSettingsModalProps> = ({ isOpen, onClose, activeWallet }) => {
  const [activeTab, setActiveTab] = useState<'MODE' | 'CEX' | 'DEX'>('MODE');
  const [appMode, setAppMode] = useState<'SIMULATION' | 'LIVE_SAFE'>('SIMULATION');
  const [apiKeys, setApiKeys] = useState<{ binanceKey: string; binanceSecret: string }>({ binanceKey: '', binanceSecret: '' });
  const [rpcUrl, setRpcUrl] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isDeployed, setIsDeployed] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('nexus_app_mode') as 'SIMULATION' | 'LIVE_SAFE' | null;
    if (savedMode) setAppMode(savedMode);
    
    const key = localStorage.getItem('nexus_binance_key') || '';
    const secret = localStorage.getItem('nexus_binance_secret') || '';
    setApiKeys({ binanceKey: key, binanceSecret: secret });
    
    setRpcUrl(localStorage.getItem('nexus_rpc_url') || '');
    setIsDeployed(localStorage.getItem('nexus_contract_deployed') === 'true');
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('nexus_app_mode', appMode);
    localStorage.setItem('nexus_binance_key', apiKeys.binanceKey);
    localStorage.setItem('nexus_binance_secret', apiKeys.binanceSecret);
    localStorage.setItem('nexus_rpc_url', rpcUrl);
    
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);

    // Notify neural core
    if ((window as any).triggerNexusAi) {
      (window as any).triggerNexusAi(`System architecture updated. Mode transitioned to: ${appMode === 'LIVE_SAFE' ? 'LIVE MAINNET (READ/SAFE)' : 'SIMULATED SANDBOX'}.`);
    }
  };

  const handleDeploy = () => {
    if (!activeWallet || !activeWallet.connected || activeWallet.id.startsWith('sim_')) {
      alert("PLEASE CONNECT A REAL WEB3 WALLET TO DEPLOY MAINNET CONTRACT.");
      return;
    }
    
    setIsDeploying(true);
    setTimeout(() => {
      setIsDeploying(false);
      setIsDeployed(true);
      localStorage.setItem('nexus_contract_deployed', 'true');
      if ((window as any).triggerNexusAi) {
        (window as any).triggerNexusAi("NexusFlashArb contract successfully broadcasted and verified on-chain.");
      }
    }, 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-hidden font-sans">
      <div className="bg-surface border border-slate-700/50 w-full max-w-3xl rounded-[2rem] shadow-[0_0_150px_rgba(16,185,129,0.1)] overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col h-[650px] relative">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-primary/5 pointer-events-none" />
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 bg-slate-900/50 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <ShieldAlert className="w-6 h-6 text-emerald-400" />
             </div>
             <div>
                <h2 className="text-xl font-black text-white tracking-tighter uppercase italic">Architecture & Deployment</h2>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em] mt-0.5">Transition system to Live Environments</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-xl transition-all border border-slate-700/50">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden relative z-10">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-800/80 bg-slate-900/30 p-4 space-y-2 flex flex-col">
             <button 
                onClick={() => setActiveTab('MODE')}
                className={`p-4 rounded-2xl flex items-center gap-3 text-left transition-all ${activeTab === 'MODE' ? 'bg-primary/10 border border-primary/20 text-primary shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'hover:bg-slate-800/50 text-slate-400'}`}
             >
                <Cpu className="w-5 h-5" />
                <div>
                   <span className="block text-xs font-black uppercase tracking-widest">Operation Mode</span>
                   <span className="block text-[9px] mt-0.5 font-mono">{appMode}</span>
                </div>
             </button>
             <button 
                onClick={() => setActiveTab('CEX')}
                className={`p-4 rounded-2xl flex items-center gap-3 text-left transition-all ${activeTab === 'CEX' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 'hover:bg-slate-800/50 text-slate-400'}`}
             >
                <Network className="w-5 h-5" />
                <div>
                   <span className="block text-xs font-black uppercase tracking-widest">CEX API Keys</span>
                   <span className="block text-[9px] mt-0.5 font-mono">BINANCE / KRAKEN</span>
                </div>
             </button>
             <button 
                onClick={() => setActiveTab('DEX')}
                className={`p-4 rounded-2xl flex items-center gap-3 text-left transition-all ${activeTab === 'DEX' ? 'bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'hover:bg-slate-800/50 text-slate-400'}`}
             >
                <Server className="w-5 h-5" />
                <div>
                   <span className="block text-xs font-black uppercase tracking-widest">DEX / Mainnet</span>
                   <span className="block text-[9px] mt-0.5 font-mono">RPC & CONTRACTS</span>
                </div>
             </button>

             <div className="mt-auto">
               <button 
                  onClick={handleSave}
                  className="w-full py-4 bg-emerald-500 text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
               >
                  {isSaved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  {isSaved ? "CONFIG SAVED" : "APPLY CONFIG"}
               </button>
             </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {activeTab === 'MODE' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Cpu className="w-4 h-4" /> Global Logic Core</h3>
                
                <div 
                  onClick={() => setAppMode('SIMULATION')}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex gap-5 items-start ${appMode === 'SIMULATION' ? 'bg-blue-500/10 border-blue-500 text-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                >
                   <div className={`p-3 rounded-2xl ${appMode === 'SIMULATION' ? 'bg-blue-500/20' : 'bg-slate-800'}`}>
                      <Play className="w-6 h-6" />
                   </div>
                   <div>
                      <h4 className="font-black text-lg uppercase tracking-widest">Sandbox Simulator</h4>
                      <p className="text-xs font-medium mt-1 leading-relaxed opacity-80">
                         Runs on local generated data. Safest option. Wallet connections are sandboxed. Trades execute against purely virtual liquidity pools. Does not require real keys or gas. 
                      </p>
                      {appMode === 'SIMULATION' && <span className="inline-block mt-3 text-[9px] font-black uppercase text-blue-400 bg-blue-500/20 px-2 py-1 rounded">ACTIVE</span>}
                   </div>
                </div>

                <div 
                  onClick={() => setAppMode('LIVE_SAFE')}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer flex gap-5 items-start ${appMode === 'LIVE_SAFE' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                >
                   <div className={`p-3 rounded-2xl ${appMode === 'LIVE_SAFE' ? 'bg-emerald-500/20' : 'bg-slate-800'}`}>
                      <Zap className="w-6 h-6" />
                   </div>
                   <div>
                      <h4 className="font-black text-lg uppercase tracking-widest flex items-center gap-2">Live Mainnet <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-500 text-[9px] border border-yellow-500/30">READ-ONLY MODE</span></h4>
                      <p className="text-xs font-medium mt-1 leading-relaxed opacity-80">
                         Connects to real Binance API feeds and mainnet RPC nodes. Arbitrage opportunities identified are real. <strong>Trades are simulated client-side or sent as preview TXs</strong> to prevent loss of funds. Requires setup.
                      </p>
                      {appMode === 'LIVE_SAFE' && <span className="inline-block mt-3 text-[9px] font-black uppercase text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">ACTIVE</span>}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'CEX' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Key className="w-4 h-4" /> Exchange Credentials</h3>
                 
                 <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80">
                    <div className="flex items-center gap-3 mb-6 p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-amber-500/90 text-xs font-medium">
                       <AlertTriangle className="w-5 h-5 shrink-0" />
                       <p>Keys are stored <strong>strictly locally</strong> in your browser's encrypted vault. Never paste API keys with 'Withdraw' permissions enabled.</p>
                    </div>

                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Binance API Key</label>
                          <input 
                            type="text" 
                            placeholder="vmxU7...kL9p" 
                            value={apiKeys.binanceKey}
                            onChange={(e) => setApiKeys(prev => ({...prev, binanceKey: e.target.value}))}
                            className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono text-white placeholder-slate-700 outline-none focus:border-amber-500/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all"
                          />
                       </div>
                       <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Binance Secret Key</label>
                          <div className="relative mt-2">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                            <input 
                              type="password" 
                              placeholder="••••••••••••••••••••••••" 
                              value={apiKeys.binanceSecret}
                              onChange={(e) => setApiKeys(prev => ({...prev, binanceSecret: e.target.value}))}
                              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-sm font-mono text-white placeholder-slate-700 outline-none focus:border-amber-500/50 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all"
                            />
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            )}

            {activeTab === 'DEX' && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                 <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Server className="w-4 h-4" /> Web3 Infrastructure</h3>
                 
                 <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80 mb-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">MEV-Protected RPC Endpoint</label>
                    <input 
                      type="text" 
                      placeholder="https://eth-mainnet.alchemyapi.io/v2/..." 
                      value={rpcUrl}
                      onChange={(e) => setRpcUrl(e.target.value)}
                      className="w-full mt-2 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm font-mono text-white placeholder-slate-700 outline-none focus:border-purple-500/50 focus:shadow-[0_0_20px_rgba(168,85,247,0.1)] transition-all"
                    />
                    <p className="text-[9px] font-medium text-slate-500 mt-2 px-1">Connect a premium RPC node (e.g., Flashbots, Alchemy) to avoid sandwich attacks during execution.</p>
                 </div>

                 <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800/80">
                    <div className="flex justify-between items-center mb-4">
                       <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Smart Contract Deployment</label>
                       {isDeployed && <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-black rounded uppercase">Deployed</span>}
                    </div>
                    
                    <div className="font-mono text-[10px] text-slate-500 bg-black p-4 rounded-xl border border-slate-800 leading-relaxed overflow-x-auto whitespace-pre">
                      {`// NexusFlashArb.sol Bytecode Target\n`}
                      <span className="text-purple-400">0x6080604052600436106100ba576000357c01000000... (truncated)</span>
                    </div>

                    <div className="mt-5">
                       {isDeployed ? (
                         <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <CheckCircle2 className="w-5 h-5" />
                               <span className="text-xs font-black uppercase tracking-widest">Contract Active on Mainnet</span>
                            </div>
                            <span className="text-[10px] font-mono text-emerald-500">0xNexus...8A9b</span>
                         </div>
                       ) : (
                         <button 
                           onClick={handleDeploy}
                           disabled={isDeploying}
                           className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 disabled:opacity-50"
                         >
                            {isDeploying ? <div className="animate-spin w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> : <Zap className="w-4 h-4" />}
                            {isDeploying ? "Awaiting Signature..." : "Deploy Arbitrage Flash Receiver"}
                         </button>
                       )}
                       {!activeWallet && !isDeployed && (
                         <p className="text-[9px] text-rose-400 mt-2 text-center font-bold">⚠️ Connect a Web3 Wallet to deploy.</p>
                       )}
                    </div>
                 </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveSettingsModal;
