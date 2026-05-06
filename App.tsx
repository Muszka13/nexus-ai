
import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CexDashboard from './components/CexDashboard';
import DexDashboard from './components/DexDashboard';
import WalletModal from './components/WalletModal';
import { Wallet } from './types';
import { BrowserProvider, formatEther } from 'ethers';
import { WALLETS } from './constants';
import { auth, db, handleFirestoreError, OperationType, loginWithGoogle } from './services/firebase';
import { onAuthStateChanged, signInAnonymously, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, serverTimestamp, addDoc } from 'firebase/firestore';
import { ShieldAlert } from 'lucide-react';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'CEX' | 'DEX'>('CEX');
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [activeWallet, setActiveWallet] = useState<(Wallet & { isValidated?: boolean }) | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [user, setUser] = useState<any>(null);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Proactive AI Insights (Neural Telepathy)
  useEffect(() => {
    const triggerTelepathy = () => {
      if ((window as any).triggerNexusAi) {
        const insights = [
          "NEURAL_PING: I'm noticing an unusual liquidity migration towards Arbitrum layer-2. Might be worth checking the DEX loops.",
          "ANOMALY_DETECTED: BTC/USDT global spread exceeding 0.15%. Arbitrage potential identified in CEX Neural Core.",
          "SYSTEM_ADAPTATION: Your execution patterns suggest a preference for LOW-RISK delta neutral strategies. Optimization active.",
          "MEMPOOL_WARNING: High MEV activity detected in Ethereum block 19284300. Shield activation recommended for DEX trades."
        ];
        const randomInsight = insights[Math.floor(Math.random() * insights.length)];
        (window as any).triggerNexusAi(randomInsight, false); // false = don't wait for response, just post it
      }
    };

    const interval = setInterval(() => {
      if (Math.random() > 0.9) triggerTelepathy(); // 10% chance every min
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Global Neural Portfolio State
  const [portfolioBalance, setPortfolioBalance] = useState<number>(0.25);
  const [transactions, setTransactions] = useState<{id: string, type: 'ARB' | 'GAS' | 'WITHDRAW' | 'STAKE' | 'DEPOSIT', amount: number, token: string, time: string}[]>([]);

  // Firebase Auth & Sync Logic
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthError(null);
      if (!firebaseUser) {
        setIsFirebaseSyncing(true);
        signInAnonymously(auth).catch((error) => {
          if (error.code === 'auth/admin-restricted-operation') {
            const msg = "Firebase Anonymous Auth is DISABLED. Enable it in Firebase Console.";
            console.warn("[Nexus Neural Uplink] " + msg);
            setAuthError(msg);
          } else {
            console.error("Auth error:", error);
          }
        }).finally(() => setIsFirebaseSyncing(false));
      }
    });
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  const handleLogout = () => signOut(auth);

  // Sync Data from Firestore
  useEffect(() => {
    if (!user) return;

    setIsFirebaseSyncing(true);
    const userDocRef = doc(db, 'users', user.uid);
    
    // Listen to profile
    const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setPortfolioBalance(docSnap.data().balance || 0);
        setIsFirebaseSyncing(false);
      } else {
        // Initialize if not exists
        setDoc(userDocRef, {
          balance: 0.25,
          updatedAt: serverTimestamp()
        }, { merge: true }).finally(() => setIsFirebaseSyncing(false));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    // Listen to transactions
    const txQuery = query(
      collection(db, 'users', user.uid, 'transactions'),
      orderBy('timestamp', 'desc'),
      limit(10)
    );

    const unsubTxs = onSnapshot(txQuery, (querySnap) => {
      const txs = querySnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          amount: data.amount,
          token: data.token,
          time: data.timestamp?.toDate ? data.timestamp.toDate().toLocaleTimeString() : new Date().toLocaleTimeString()
        };
      }) as any[];
      setTransactions(txs);
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}/transactions`));

    return () => {
      unsubProfile();
      unsubTxs();
    };
  }, [user]);

  const addTradeEarnings = async (amount: number, type: 'ARB' | 'GAS' | 'DEPOSIT', token: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        balance: portfolioBalance + amount, // Note: simplified for display sync
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(userDocRef, 'transactions'), {
        type,
        amount,
        token,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleWithdraw = async () => {
    if (portfolioBalance <= 0 || !user) return;
    
    const amount = portfolioBalance;
    const unit = activeWallet?.id === 'phantom' ? 'SOL' : 'ETH';
    
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        balance: 0,
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(userDocRef, 'transactions'), {
        type: 'WITHDRAW',
        amount: -amount,
        token: unit,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleRestake = async () => {
    if (portfolioBalance < 0.01 || !user) return;
    
    const stakeAmount = portfolioBalance * 0.5; // Re-stake 50% of capital
    const unit = activeWallet?.id === 'phantom' ? 'SOL' : 'ETH';

    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        balance: portfolioBalance - stakeAmount,
        updatedAt: serverTimestamp()
      });

      await addDoc(collection(userDocRef, 'transactions'), {
        type: 'STAKE',
        amount: -stakeAmount,
        token: unit,
        timestamp: serverTimestamp()
      });

      // Simulate rewards after a delay
      setTimeout(async () => {
        const reward = stakeAmount * 0.05; // 5% reward
        const currentDoc = await getDoc(userDocRef);
        const currentBalance = currentDoc.data()?.balance || 0;
        
        await updateDoc(userDocRef, {
          balance: currentBalance + stakeAmount + reward,
          updatedAt: serverTimestamp()
        });

        await addDoc(collection(userDocRef, 'transactions'), {
          type: 'ARB', // Represented as yield
          amount: reward,
          token: unit,
          timestamp: serverTimestamp()
        });
      }, 5000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  // Sync Logic to Wallet UI
  useEffect(() => {
    if (activeWallet) {
      const unit = activeWallet.id === 'phantom' ? 'SOL' : 'ETH';
      setActiveWallet(prev => prev ? {
        ...prev,
        balance: `${portfolioBalance.toFixed(4)} ${unit}`
      } : null);
    }
  }, [portfolioBalance]);

  // Global Session Hydration
  useEffect(() => {
    // 1. Recover View
    const savedView = localStorage.getItem('nexus_v4_view') as 'CEX' | 'DEX';
    if (savedView) setActiveView(savedView);

    // 2. Recover Wallet Session
    const savedWalletId = localStorage.getItem('nexus_v4_wallet_id');
    const savedAddress = localStorage.getItem('nexus_v4_address');
    if (savedWalletId && savedAddress) {
      const wallet = WALLETS.find(w => w.id === savedWalletId);
      if (wallet) {
        setActiveWallet({
          ...wallet,
          address: savedAddress,
          balance: localStorage.getItem('nexus_v4_balance') || '0.00 ETH',
          connected: true,
          isValidated: true,
          tier: 'Neural',
          trustScore: 99.9
        });
      }
    }
  }, []);

  // Sync Logic to LocalStorage
  useEffect(() => {
    localStorage.setItem('nexus_v4_view', activeView);
  }, [activeView]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleConnectWallet = async (wallet: Wallet) => {
    setConnectionError(null);
    setIsValidating(true);
    
    try {
      let connectionData: Partial<Wallet> = {};

      if (wallet.id === 'metamask' && (window as any).ethereum) {
        const ethereum = (window as any).ethereum;
        const provider = new BrowserProvider(ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        const balanceBigInt = await provider.getBalance(address);
        const formattedAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;
        const formattedBalance = `${parseFloat(formatEther(balanceBigInt)).toFixed(4)} ETH`;
        
        connectionData = {
          address: formattedAddress,
          balance: formattedBalance,
          tier: 'Elite',
          trustScore: 99.4,
          lastAudit: Date.now()
        };
      } else {
        // Mocking advanced "Innyfix" neural connection
        await new Promise(resolve => setTimeout(resolve, 2000));
        const mockAddress = '0x71C...9A21';
        const mockBalance = wallet.id === 'phantom' ? '124.5 SOL' : '14.5 ETH';
        connectionData = {
          address: mockAddress,
          balance: mockBalance,
          tier: 'Neural',
          trustScore: 99.9,
          lastAudit: Date.now()
        };
      }

      // Finalize persistence
      localStorage.setItem('nexus_v4_wallet_id', wallet.id);
      localStorage.setItem('nexus_v4_address', connectionData.address!);
      localStorage.setItem('nexus_v4_balance', connectionData.balance!);

      // Sync to Firebase Profile
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        updateDoc(userDocRef, {
          walletAddress: connectionData.address,
          walletProvider: wallet.id,
          updatedAt: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`));
      }

      setActiveWallet({
        ...wallet,
        ...connectionData,
        connected: true,
        isValidated: true
      });
      setIsValidating(false);
      setIsWalletModalOpen(false);

    } catch (error: any) {
      setIsValidating(false);
      setConnectionError(error?.message || "Secure handshake failed. Neural bridge unavailable.");
      throw error;
    }
  };

  const handleDisconnect = () => {
    setActiveWallet(null);
    localStorage.removeItem('nexus_v4_wallet_id');
    localStorage.removeItem('nexus_v4_address');
    localStorage.removeItem('nexus_v4_balance');
    setIsWalletModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-background text-slate-200 font-sans selection:bg-primary/30">
      <Navbar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        activeWallet={activeWallet}
        onConnectClick={() => setIsWalletModalOpen(true)}
        isOnline={isOnline}
        user={user}
        isSyncing={isFirebaseSyncing}
        onLogin={handleGoogleLogin}
        onLogout={handleLogout}
      />

      {authError && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
               </div>
               <div>
                  <p className="text-[11px] font-black text-rose-400 uppercase tracking-wider">Sync Handshake Restricted</p>
                  <p className="text-[10px] text-slate-500 font-medium">Automatic guest sync is disabled by neural configuration. Sign in with Google to enable persistent cloud backup.</p>
               </div>
             </div>
             <button 
               onClick={handleGoogleLogin}
               className="px-4 py-1.5 bg-rose-500 text-white text-[10px] font-black rounded-lg hover:bg-rose-600 transition-colors uppercase"
             >
               Sign In Now
             </button>
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-40">
        <div className="mb-12 animate-in fade-in slide-in-from-top-6 duration-1000">
          <div className="flex items-center gap-4 mb-4">
             <div className="w-2.5 h-12 bg-gradient-to-b from-primary to-purple-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)]" />
             <div>
                <h2 className="text-6xl font-black text-white tracking-tighter uppercase italic leading-none">
                  {activeView === 'CEX' ? 'CEX SCAN' : 'DEX FLOW'}
                </h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-2 opacity-60">
                  Nexus Intelligence Layer v4.0.2
                </p>
             </div>
          </div>
        </div>

        {activeView === 'CEX' ? (
          <CexDashboard 
            portfolioBalance={portfolioBalance} 
            onTradeSuccess={addTradeEarnings}
            transactions={transactions}
          />
        ) : (
          <DexDashboard 
            portfolioBalance={portfolioBalance} 
            transactions={transactions}
            onTradeSuccess={addTradeEarnings}
          />
        )}
      </main>

      <WalletModal 
        isOpen={isWalletModalOpen} 
        onClose={() => { setIsWalletModalOpen(false); setConnectionError(null); }}
        activeWallet={activeWallet}
        onConnect={handleConnectWallet}
        onDisconnect={handleDisconnect}
        onWithdraw={handleWithdraw}
        onRestake={handleRestake}
        error={connectionError}
        isValidating={isValidating}
        transactions={transactions}
      />
    </div>
  );
};

export default App;
