import React, { useState, useEffect } from 'react';
import { LayoutGrid, Network, Wallet as WalletIcon, ChevronDown, Activity, Wifi, WifiOff, BrainCircuit, ShieldCheck, ShieldAlert, Cloud, CloudOff, LogIn, LogOut, Settings } from 'lucide-react';
import { Wallet } from '../types';

interface NavbarProps {
  activeView: 'CEX' | 'DEX';
  setActiveView: (view: 'CEX' | 'DEX') => void;
  activeWallet: (Wallet & { isValidated?: boolean }) | null;
  onConnectClick: () => void;
  isOnline: boolean;
  user: any;
  isSyncing: boolean;
  onLogin: () => void;
  onLogout: () => void;
  onSettingsClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  activeView, 
  setActiveView, 
  activeWallet, 
  onConnectClick, 
  isOnline,
  user,
  isSyncing,
  onLogin,
  onLogout,
  onSettingsClick
}) => {
  const [whaleAlert, setWhaleAlert] = useState<{ symbol: string; amount: string; side: 'BUY' | 'SELL' } | null>(null);

  useEffect(() => {
    const triggerWhale = () => {
      const symbols = ['BTC', 'ETH', 'SOL', 'USDC'];
      const alert = {
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        amount: (Math.random() * 500 + 100).toFixed(0),
        side: Math.random() > 0.5 ? 'BUY' : 'SELL' as 'BUY' | 'SELL'
      };
      setWhaleAlert(alert);
      setTimeout(() => setWhaleAlert(null), 5000);
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.7) triggerWhale();
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-30">
      {/* Whale Alert Ticker */}
      {whaleAlert && (
          <div className="bg-primary/10 border-b border-primary/20 py-1.5 overflow-hidden animate-in slide-in-from-top duration-500">
             <div className="flex items-center justify-center gap-4 animate-pulse">
                <ShieldAlert className="w-3 h-3 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                  Whale Movement: {whaleAlert.amount} {whaleAlert.symbol} {whaleAlert.side} Order Detected
                </span>
                <span className="text-[9px] font-mono text-slate-500">Handled by Nexus Core</span>
             </div>
          </div>
      )}
      
      <nav className="h-20 border-b border-slate-800 bg-surface/80 backdrop-blur-md flex items-center justify-between px-6 lg:px-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <LayoutGrid className="text-white w-6 h-6" />
        </div>
        <div className="hidden sm:block">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Nexus<span className="text-primary">Trade</span>
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 group hover:bg-primary/20 transition-all cursor-help">
                <BrainCircuit className="w-3 h-3 text-primary animate-pulse" />
                <span className="text-[10px] font-black text-white tracking-widest">
                  LVL <span className="text-primary tracking-tighter">04</span>
                </span>
                <div className="w-8 h-1 bg-slate-800 rounded-full overflow-hidden">
                   <div className="h-full bg-primary w-2/3"></div>
                </div>
             </div>
             
             <div className={`w-1 h-1 rounded-full bg-slate-600`}></div>

             <div className="flex items-center gap-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                    {isOnline ? 'Core_Synced' : 'Uplink_Lost'}
                </span>
             </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 p-1 rounded-xl border border-slate-700 flex gap-1">
        <button 
          onClick={() => setActiveView('CEX')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
          ${activeView === 'CEX' 
            ? 'bg-primary text-white shadow-lg shadow-blue-900/50' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <Network className="w-4 h-4" /> Centralized (CEX)
        </button>
        <button 
          onClick={() => setActiveView('DEX')}
          className={`px-6 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2
          ${activeView === 'DEX' 
            ? 'bg-secondary text-white shadow-lg shadow-indigo-900/50' 
            : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
        >
          <LayoutGrid className="w-4 h-4" /> Decentralized (DEX)
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex flex-col items-end px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2">
                {isOnline ? <Wifi className="w-3 h-3 text-emerald-500" /> : <WifiOff className="w-3 h-3 text-red-500" />}
                <span className={`text-[9px] font-black tracking-widest ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isOnline ? 'NODE_SYNC_ACTIVE' : 'DISCONNECTED'}
                </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {user ? (
                <div className="flex items-center gap-1">
                  <Cloud className={`w-2 h-2 ${isSyncing ? 'text-primary animate-pulse' : 'text-emerald-400'}`} />
                  <span className="text-[7px] text-slate-500 font-bold uppercase tracking-tighter">
                    Cloud Synced: {user.isAnonymous ? 'Guest' : user.displayName || 'User'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <CloudOff className="w-2 h-2 text-rose-500" />
                  <span className="text-[7px] text-rose-500 font-bold uppercase tracking-tighter">
                    Sync Offline
                  </span>
                </div>
              )}
            </div>
        </div>

        {/* Global Login Button */}
        {!user && (
          <button 
            onClick={onLogin}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-xs font-bold"
          >
            <LogIn className="w-3 h-3" />
            <span className="hidden sm:inline">SIGN IN</span>
          </button>
        )}

        {user && !user.isAnonymous && (
           <button 
             onClick={onLogout}
             className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all"
             title="Sign Out"
           >
             <LogOut className="w-4 h-4" />
           </button>
        )}

        <button 
            onClick={onSettingsClick}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
            title="Production Settings"
        >
            <Settings className="w-4 h-4" />
        </button>

        <button 
            onClick={onConnectClick}
            className={`flex items-center gap-3 px-4 py-2 rounded-xl border font-medium transition-all
            ${activeWallet 
            ? 'bg-slate-900/50 border-emerald-500/30 text-emerald-400 hover:bg-slate-900' 
            : 'bg-slate-800 border-slate-700 text-slate-200 hover:border-slate-500'}`}
        >
            {activeWallet ? (
            <>
                <div className="relative">
                   <img src={activeWallet.icon} className="w-6 h-6 rounded-full border border-slate-600" />
                   {activeWallet.isValidated && (
                      <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full border border-slate-900">
                         <ShieldCheck className="w-2.5 h-2.5 text-white" />
                      </div>
                   )}
                </div>
                <div className="flex flex-col items-start text-xs">
                    <div className="flex items-center gap-1">
                       <span className="font-mono font-bold text-white tracking-wide">{activeWallet.address}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">{activeWallet.balance}</span>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />
            </>
            ) : (
            <>
                <WalletIcon className="w-4 h-4" /> 
                <span>Connect Wallet</span>
            </>
            )}
        </button>
      </div>
    </nav>
    </div>
  );
};

export default Navbar;