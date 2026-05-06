
import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Wallet as WalletIcon, CheckCircle2, Loader2, ArrowRight, AlertCircle, 
  LogOut, ShieldCheck, Fingerprint, Bell, Lock, PieChart as PieChartIcon, 
  Activity as Pulse, ArrowUpRight, ArrowDownLeft, RefreshCcw, Zap, Send, Copy, 
  Info, MinusCircle, ShieldAlert, Binary, Search, ExternalLink, 
  ChevronRight, Fuel, TrendingUp, TrendingDown, History, Plus, CreditCard,
  Shield, AlertTriangle, Eye, EyeOff, Terminal, Cpu, Globe, Key, Brain, Sparkles,
  Command, Box, ShieldX, Ghost, BarChart3, Radio, Check, Settings, ShieldEllipsis, Smartphone
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RechartTooltip } from 'recharts';
import { Wallet } from '../types';
import { WALLETS } from '../constants';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeWallet: (Wallet & { isValidated?: boolean }) | null;
  onConnect: (wallet: Wallet) => Promise<void>;
  onDisconnect: () => void;
  onWithdraw: () => void;
  onRestake: () => void;
  error?: string | null;
  isValidating?: boolean;
  transactions: {id: string, type: 'ARB' | 'GAS' | 'WITHDRAW' | 'STAKE' | 'DEPOSIT', amount: number, token: string, time: string}[];
}

interface SecurityThreat {
  id: string;
  contract: string;
  type: 'High Risk Approval' | 'Stale Permission' | 'Honeypot Link';
  severity: 'high' | 'medium' | 'low';
  isRevoking?: boolean;
}

const WalletModal: React.FC<WalletModalProps> = ({ 
  isOpen, 
  onClose, 
  activeWallet, 
  onConnect, 
  onDisconnect, 
  onWithdraw,
  onRestake,
  error: propError, 
  isValidating,
  transactions
}) => {
  const [localError, setLocalError] = useState<string | null>(null);
  const [validationLogs, setValidationLogs] = useState<string[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'vault' | 'defense' | 'portfolio'>('vault');
  const [riskFlux, setRiskFlux] = useState(0.42);
  const [isScanning, setIsScanning] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  const portfolioData = [
    { name: 'ETH', value: 45, color: '#6366f1' },
    { name: 'BTC', value: 30, color: '#f59e0b' },
    { name: 'SOL', value: 15, color: '#10b981' },
    { name: 'USDT', value: 10, color: '#2dd4bf' },
  ];
  
  const [threats, setThreats] = useState<SecurityThreat[]>([
    { id: '1', contract: '0x88e6...24e1', type: 'High Risk Approval', severity: 'high' },
    { id: '2', contract: '0x1111...1111', type: 'Stale Permission', severity: 'low' },
    { id: '3', contract: '0x7a25...b11e', type: 'Honeypot Link', severity: 'medium' }
  ]);

  // Handle Tab Change with Scanning Effect
  useEffect(() => {
    if (activeTab === 'defense' && threats.length > 0) {
      setIsScanning(true);
      const timer = setTimeout(() => setIsScanning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Real-time Risk Flux
  useEffect(() => {
    if (activeWallet && isOpen) {
      const interval = setInterval(() => {
        setRiskFlux(prev => {
          const delta = (Math.random() - 0.5) * 0.04;
          return Math.min(1, Math.max(0, prev + delta));
        });
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [activeWallet, isOpen]);

  // Revoke Logic
  const handleRevoke = async (threatId: string) => {
    setThreats(prev => prev.map(t => t.id === threatId ? { ...t, isRevoking: true } : t));
    
    // Simulate on-chain revocation handshake
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    setThreats(prev => prev.filter(t => t.id !== threatId));
    
    // Trigger AI notification if possible
    if ((window as any).triggerNexusAi) {
      (window as any).triggerNexusAi(`Confirmed: Permission for threat ID ${threatId} has been successfully revoked. Neural Core updated.`);
    }
  };

  // Validation Simulation Logs
  useEffect(() => {
    if (isValidating) {
      const logs = [
        "BOOTING NEURAL HANDSHAKE...",
        "ENCRYPTING PUBLIC KEY FRAGMENT...",
        "CHALLENGING WALLET ENTITY...",
        "SCANNING ON-CHAIN REPUTATION...",
        "BYPASSING HONEYPOTS...",
        "SECURE LINK ESTABLISHED."
      ];
      let i = 0;
      const interval = setInterval(() => {
        if (i < logs.length) {
          setValidationLogs(prev => [...prev, logs[i]]);
          i++;
        } else {
          clearInterval(interval);
        }
      }, 300);
      return () => {
        clearInterval(interval);
        setValidationLogs([]);
      };
    }
  }, [isValidating]);

  const triggerDeepAudit = () => {
    if ((window as any).triggerNexusAi && activeWallet) {
      (window as any).triggerNexusAi(`Perform a Deep Neural Audit on my ${activeWallet.name} wallet. Focus on 'Nexus Neural Defence' parameters.`);
    }
  };

  useEffect(() => {
    if (propError) setLocalError(propError);
  }, [propError]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 overflow-hidden font-sans">
      <div className="bg-surface border border-slate-700/50 w-full max-w-2xl rounded-[3rem] shadow-[0_0_100px_rgba(59,130,246,0.1)] overflow-hidden animate-in fade-in zoom-in duration-500 flex flex-col max-h-[90vh] relative">
        
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-600/5 pointer-events-none" />
        
        {/* Top Header */}
        <div className="p-8 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/40 relative z-10">
          <div className="flex items-center gap-6">
             <div className="p-4 bg-gradient-to-br from-primary to-blue-700 rounded-3xl shadow-2xl shadow-primary/20">
                <WalletIcon className="w-8 h-8 text-white" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">Nexus Vault Core</h2>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
                   <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.4em]">Nexus Neural Defence Alpha</p>
                </div>
             </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white hover:bg-slate-800 rounded-2xl transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation Tabs */}
        {activeWallet && !isValidating && (
          <div className="px-8 pt-6 flex gap-4 relative z-10">
             {[
               { id: 'vault', label: 'Vault', icon: Box },
               { id: 'portfolio', label: 'Portfolio', icon: BarChart3 },
               { id: 'defense', label: 'Security', icon: ShieldCheck, badge: threats.length }
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border relative
                 ${activeTab === tab.id 
                   ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10' 
                   : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-600'}`}
               >
                 <tab.icon className="w-4 h-4" />
                 {tab.label}
                 {tab.badge && tab.badge > 0 && (
                   <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] text-white font-black animate-bounce">
                     {tab.badge}
                   </span>
                 )}
               </button>
             ))}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar relative z-10">
          {isValidating ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-10">
              <div className="relative">
                 <div className="w-40 h-40 border-[6px] border-primary/10 border-t-primary rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="w-16 h-16 text-primary animate-pulse" />
                 </div>
              </div>
              <div className="w-full max-w-sm bg-black border border-slate-800 rounded-3xl p-6 font-mono text-[11px] space-y-2.5 shadow-2xl">
                 <div className="flex items-center justify-between text-primary mb-4 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      <span className="font-bold tracking-widest uppercase">Security_Shell.log</span>
                    </div>
                 </div>
                 {validationLogs.map((log, i) => (
                   <div key={i} className="text-slate-400 flex items-center gap-3">
                      <span className="text-slate-800 font-bold">[{i+1}]</span>
                      <span>{log}</span>
                   </div>
                 ))}
                 <div className="w-1.5 h-4 bg-primary/50 animate-pulse inline-block ml-1" />
              </div>
            </div>
          ) : activeWallet ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'vault' && (
                <div className="space-y-8">
                  {/* High Tech Asset Card */}
                  <div className="bg-slate-900/60 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
                     <div className="absolute right-[-10%] top-[-20%] opacity-5 transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-6">
                        <Radio className="w-64 h-64 text-primary" />
                     </div>
                     <div className="flex items-center justify-between relative z-10 mb-10">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-3xl bg-slate-800 border border-slate-700 p-2 flex items-center justify-center shadow-2xl overflow-hidden group-hover:border-primary/50 transition-colors">
                               <img src={activeWallet.icon} alt={activeWallet.name} className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h3 className="font-black text-white text-3xl tracking-tighter italic uppercase">{activeWallet.name}</h3>
                                <div className="flex items-center gap-3 mt-2">
                                   <span className="font-mono text-slate-400 text-sm bg-black/60 px-3 py-1 rounded-xl border border-slate-700">
                                      {activeWallet.address}
                                   </span>
                                   <button className="text-slate-500 hover:text-white transition-all" onClick={() => navigator.clipboard.writeText(activeWallet.address || '')}>
                                      <Copy className="w-4 h-4" />
                                   </button>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                           <span className="block text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Neural Trust</span>
                           <span className={`text-3xl font-mono font-black drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] ${threats.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                             {threats.length === 0 ? '100%' : `${(99.8 - (threats.length * 5)).toFixed(1)}%`}
                           </span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8 pt-8 border-t border-slate-800/50">
                        <div>
                           <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-2">Alpha Liquidity</span>
                           <div className="flex items-end gap-3">
                              <span className="text-5xl font-black text-white tracking-tighter">
                                {showBalance ? activeWallet.balance : '••••••••'}
                              </span>
                              <button onClick={() => setShowBalance(!showBalance)} className="text-slate-600 hover:text-white mb-2 transition-colors">
                                 {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                           </div>
                        </div>
                        <div className="flex flex-col justify-end gap-3">
                           <button 
                             onClick={onWithdraw}
                             disabled={!activeWallet || parseFloat(activeWallet.balance) <= 0}
                             className="w-full py-3 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/80 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              <Send className="w-3 h-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                              Withdraw Capital
                           </button>
                           <button 
                             onClick={onRestake}
                             disabled={!activeWallet || parseFloat(activeWallet.balance) <= 0.01}
                             className="w-full py-3 bg-slate-800 border border-slate-700 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              Neural Re-stake
                           </button>
                        </div>
                     </div>
                  </div>

                  {/* Quick Access */}
                  <div className="grid grid-cols-2 gap-6">
                     <button onClick={() => setActiveTab('defense')} className="p-6 rounded-[2.5rem] bg-rose-500/5 border border-rose-500/20 hover:border-rose-500/50 transition-all text-left group">
                        <ShieldX className={`w-8 h-8 mb-4 group-hover:scale-110 transition-transform ${threats.length > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-600'}`} />
                        <h4 className="font-black text-white text-xs uppercase tracking-widest">Neural Defence</h4>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{threats.length} vulnerabilities detected in contract approvals.</p>
                     </button>
                     <button onClick={triggerDeepAudit} className="p-6 rounded-[2.5rem] bg-indigo-600/5 border border-indigo-500/20 hover:border-indigo-500/50 transition-all text-left group">
                        <Brain className="w-8 h-8 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="font-black text-white text-xs uppercase tracking-widest">Global Audit</h4>
                        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">Run a full-trace scan on all interconnected DApps.</p>
                     </button>
                  </div>
                </div>
              )}

              {activeTab === 'defense' && (
                <div className="space-y-6 relative min-h-[400px]">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <Smartphone className="w-5 h-5 text-primary" />
                               <span className="text-[10px] font-black uppercase text-white">MFA Auth</span>
                            </div>
                            <button 
                               onClick={() => setMfaEnabled(!mfaEnabled)}
                               className={`w-10 h-5 rounded-full relative transition-colors ${mfaEnabled ? 'bg-emerald-500' : 'bg-slate-700'}`}
                            >
                               <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${mfaEnabled ? 'left-6' : 'left-1'}`} />
                            </button>
                         </div>
                         <p className="text-[9px] text-slate-500 font-medium">Protect high-value trades with secondary biometric confirmation.</p>
                      </div>
                      <div className="bg-slate-900/60 p-5 rounded-3xl border border-slate-800">
                         <div className="flex items-center gap-3 mb-4">
                            <ShieldEllipsis className="w-5 h-5 text-amber-500" />
                            <span className="text-[10px] font-black uppercase text-white">Security Score</span>
                         </div>
                         <div className="flex items-baseline gap-2">
                             <span className="text-xl font-mono text-white">94.2</span>
                             <span className="text-[9px] text-slate-600">/ 100</span>
                         </div>
                      </div>
                   </div>

                   {isScanning && (
                     <div className="absolute inset-0 z-20 bg-surface/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 rounded-3xl animate-in fade-in duration-300">
                        <Pulse className="w-12 h-12 text-primary animate-ping" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em] animate-pulse">Scanning On-Chain Permissions...</span>
                     </div>
                   )}

                   <div className={`bg-rose-500/5 border border-rose-500/20 rounded-[2.5rem] p-8 flex items-center gap-6 ${threats.length === 0 ? 'opacity-40 grayscale' : ''}`}>
                      <div className="p-5 bg-rose-500/10 rounded-3xl">
                         <ShieldAlert className={`w-10 h-10 ${threats.length > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
                      </div>
                      <div>
                         <h4 className="text-xl font-black text-rose-500 uppercase tracking-tighter">Nexus Defence Layer</h4>
                         <p className="text-xs text-rose-200/50 mt-1 font-medium italic">
                           {threats.length > 0 
                             ? `Monitoring ${threats.length} active vector vulnerabilities.` 
                             : 'Neural bridge is fully shielded. No threats detected.'}
                         </p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex justify-between items-center px-2">
                         <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Permission Scryer Results</h5>
                         <span className="text-[9px] text-slate-600 font-bold uppercase">v4.0.2 Stable</span>
                      </div>
                      
                      {threats.length === 0 ? (
                        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl">
                           <CheckCircle2 className="w-16 h-16 text-emerald-500/20 mx-auto mb-4" />
                           <p className="text-xs font-black text-slate-600 uppercase tracking-widest">All contract permissions are secure.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {threats.map(threat => (
                            <div key={threat.id} className="bg-slate-900/40 border border-slate-800 rounded-3xl p-5 flex items-center justify-between hover:border-slate-700 transition-all group/item">
                               <div className="flex items-center gap-5">
                                  <div className={`p-3 rounded-2xl ${
                                    threat.severity === 'high' ? 'bg-rose-500/10 text-rose-500' : 
                                    threat.severity === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                                  }`}>
                                     {threat.severity === 'high' ? <ShieldX className="w-5 h-5" /> : <Ghost className="w-5 h-5" />}
                                  </div>
                                  <div>
                                     <span className="block text-xs font-black text-white uppercase">{threat.type}</span>
                                     <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{threat.contract}</span>
                                  </div>
                               </div>
                               <button 
                                 onClick={() => handleRevoke(threat.id)}
                                 disabled={threat.isRevoking}
                                 className={`px-5 py-2.5 rounded-xl border text-[9px] font-black uppercase transition-all flex items-center gap-2
                                 ${threat.isRevoking 
                                   ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
                                   : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/50'}`}
                               >
                                  {threat.isRevoking ? (
                                    <><Loader2 className="w-3 h-3 animate-spin" /> Revoking...</>
                                  ) : (
                                    <>Revoke Access</>
                                  )}
                               </button>
                            </div>
                          ))}
                        </div>
                      )}
                   </div>
                </div>
              )}

              {activeTab === 'portfolio' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   {/* Distribution Chart */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-6 flex flex-col items-center">
                         <div className="w-full h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                               <PieChart>
                                  <Pie
                                    data={portfolioData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                  >
                                    {portfolioData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                  </Pie>
                                  <RechartTooltip 
                                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }} 
                                    itemStyle={{ color: '#fff' }}
                                  />
                               </PieChart>
                            </ResponsiveContainer>
                         </div>
                         <h5 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-4">Asset Distribution</h5>
                      </div>

                      <div className="space-y-3">
                         {portfolioData.map((asset) => (
                           <div key={asset.name} className="flex items-center justify-between p-4 bg-slate-900/40 border border-slate-800 rounded-2xl hover:border-slate-700 transition-all">
                              <div className="flex items-center gap-3">
                                 <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: asset.color, boxShadow: `0 0 10px ${asset.color}` }} />
                                 <span className="text-sm font-black text-white">{asset.name}</span>
                              </div>
                              <div className="text-right">
                                 <span className="text-sm font-mono text-white">{asset.value}%</span>
                                 <div className="flex items-center justify-end gap-1 text-[9px] text-emerald-400">
                                    <TrendingUp className="w-2 h-2" />
                                    +1.2%
                                 </div>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   {/* Performance Metric */}
                   <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 flex items-center justify-between">
                      <div>
                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Neural Flow History</span>
                         <div className="space-y-4 w-full mt-4">
                            {transactions.length === 0 ? (
                              <p className="text-[11px] text-slate-500 italic opacity-40 py-4 text-center">No neural traces found in current session.</p>
                            ) : (
                              transactions.map(tx => (
                                <div key={tx.id} className="flex justify-between items-center p-3 rounded-2xl bg-slate-900 border border-slate-800">
                                   <div className="flex items-center gap-3">
                                      <div className={`p-2 rounded-xl ${tx.type === 'ARB' ? 'bg-emerald-500/10 text-emerald-500' : tx.type === 'STAKE' ? 'bg-indigo-500/10 text-indigo-500' : 'bg-rose-500/10 text-rose-500'}`}>
                                         {tx.type === 'ARB' ? <Zap className="w-3 h-3" /> : tx.type === 'STAKE' ? <Pulse className="w-3 h-3" /> : tx.type === 'DEPOSIT' ? <Plus className="w-3 h-3" /> : <Fuel className="w-3 h-3" />}
                                      </div>
                                      <div>
                                         <span className="text-[10px] font-black text-white uppercase block">
                                            {tx.type === 'ARB' ? 'Arbitrage' : tx.type === 'STAKE' ? 'Neural Stake' : tx.type === 'WITHDRAW' ? 'Withdrawal' : tx.type === 'DEPOSIT' ? 'Deposit' : 'Network Fee'}
                                         </span>
                                         <span className="text-[8px] text-slate-600 font-mono">{tx.time}</span>
                                      </div>
                                   </div>
                                   <div className={`text-xs font-black font-mono ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(4)} {tx.token}
                                   </div>
                                </div>
                              ))
                            )}
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Bottom Terminate Actions */}
              <div className="flex gap-4 pt-10">
                 <button onClick={onDisconnect} className="flex-1 py-5 bg-rose-500/5 border border-rose-500/20 text-rose-400 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-rose-500/10 transition-all flex items-center justify-center gap-3">
                    <LogOut className="w-5 h-5" /> TERMINATE_SESSION
                 </button>
                 <button className="flex-[2] py-5 bg-slate-900 border border-slate-800 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3">
                    <History className="w-5 h-5 text-primary" /> DOWNLOAD_AUDIT_REPORT
                 </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-4">
              <div className="bg-primary/5 border border-primary/10 rounded-[3rem] p-12 text-center relative overflow-hidden group">
                 <Cpu className="w-24 h-24 text-primary mx-auto mb-6 opacity-30 animate-[spin_12s_linear_infinite]" />
                 <h3 className="text-3xl font-black text-white uppercase tracking-tighter mb-4 italic">Neural Bridge Initialization</h3>
                 <p className="text-sm text-slate-400 leading-relaxed max-w-sm mx-auto font-medium">
                   Authorize your wallet to access high-frequency scanning and the Nexus Defence layer.
                 </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {WALLETS.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => onConnect(wallet)}
                    className="flex items-center gap-6 p-6 rounded-[2.5rem] border border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-primary/50 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-primary opacity-0 group-hover:opacity-100 transition-all" />
                    <div className="w-16 h-16 rounded-3xl bg-slate-900 flex items-center justify-center border border-slate-800 group-hover:border-primary/30 transition-all overflow-hidden shrink-0">
                      <img src={wallet.icon} alt={wallet.name} className="w-10 h-10 object-contain group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left">
                      <span className="font-black text-white tracking-tighter uppercase text-sm block">{wallet.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                         <Shield className="w-3 h-3 text-emerald-500" />
                         <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Handshake Ready</span>
                      </div>
                    </div>
                  </button>
                ))}
                
                <button className="flex items-center gap-6 p-6 rounded-[2.5rem] border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group">
                   <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 group-hover:scale-105 transition-all shrink-0">
                      <Binary className="w-8 h-8 text-primary" />
                   </div>
                   <div className="text-left">
                      <span className="font-black text-primary tracking-tighter uppercase text-sm block italic text-glow">Neural Direct</span>
                      <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Direct Node Bridge</span>
                   </div>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Persistent Security Footer */}
        <div className="px-10 py-6 bg-slate-950/90 border-t border-slate-800/50 flex items-center justify-between relative z-10">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_#10b981]" />
                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">TLS_AES_256_GCM_ENCRYPTED</span>
              </div>
              <div className="h-5 w-px bg-slate-800" />
              <div className="flex items-center gap-2">
                 <Globe className="w-4 h-4 text-slate-600" />
                 <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">P2P_MESH_READY</span>
              </div>
           </div>
           <div className="flex items-center gap-5 text-slate-700">
              <ShieldAlert className="w-5 h-5 hover:text-white transition-colors cursor-help" />
              <Key className="w-5 h-5 hover:text-white transition-colors cursor-help" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModal;
