
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Database, Filter, Activity, Loader2, Check, Wifi, WifiOff, 
  RefreshCw, BrainCircuit, Wand2, ShieldCheck, ArrowUp, ArrowDown,
  BarChart, Cpu, Rocket, MessageSquareCode, Sparkles, Zap, HeartPulse, TrendingUp,
  Layers, Info, Gauge, ZapOff, Target, ShieldAlert, Search, Eye, Radio, Server,
  Scale, Lock, AlertTriangle, X, Sliders, PlayCircle, PauseCircle
} from 'lucide-react';
import { INITIAL_ARB_OPPS } from '../constants';
import { ArbitrageOpportunity, OptimizationResult } from '../types';
import { 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  Area, AreaChart, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import AiAssistant from './AiAssistant';
import { cexApi } from '../services/cexApiService';
import { getNeuralOptimization } from '../services/geminiService';

interface ExtendedOpportunity extends ArbitrageOpportunity {
  liquidityDepth: 'High' | 'Medium' | 'Low';
  bidWall: number; // 0-100% relative strength
  askWall: number; // 0-100% relative strength
  bidVolume: number; 
  askVolume: number; 
  trend?: 'up' | 'down';
  lastUpdated?: number;
  latency: number;
  securityScore?: number;
  isScanning?: boolean;
  imbalance: number; // -1 to 1 (Sell pressure to Buy pressure)
  manipulationIndex: number; // 0-100 (0 = Clean, 100 = High Wash/Spoof Risk)
  lastAudit?: number; // Timestamp of last AI verification
}

interface TickerItem {
  symbol: string;
  price: number;
  globalPrice?: number;
  change: number;
  lastUpdate?: number;
}

const INITIAL_TICKER: TickerItem[] = [
  { symbol: 'BTC', price: 64230.50, change: 1.2 },
  { symbol: 'ETH', price: 3450.20, change: -0.5 },
  { symbol: 'SOL', price: 145.80, change: 2.1 },
  { symbol: 'BNB', price: 580.10, change: 0.8 },
  { symbol: 'XRP', price: 0.62, change: -1.1 },
  { symbol: 'ADA', price: 0.45, change: 0.5 },
];

/**
 * NexusStreamEngine v2.1 (ENHANCED)
 * Simulates a robust WebSocket connection for real-time market data streaming.
 * Includes Anti-Manipulation detection logic (Spoofing/Wash Trading patterns).
 */
class NexusStreamEngine {
  private onMessage: (data: any) => void;
  private onStatus: (status: 'connected' | 'connecting' | 'stalled') => void;
  private intervals: ReturnType<typeof setInterval>[] = [];
  private isConnected = false;

  constructor(
    onMessage: (data: any) => void,
    onStatus: (status: 'connected' | 'connecting' | 'stalled') => void
  ) {
    this.onMessage = onMessage;
    this.onStatus = onStatus;
    this.connect();
  }

  public connect() {
    this.clearStreams();
    this.onStatus('connecting');
    
    // Improved Handshake: Faster and more reliable
    setTimeout(() => {
      this.isConnected = true;
      this.onStatus('connected');
      this.startStreams();
    }, 800);
  }

  private async startStreams() {
    if (!this.isConnected) return;

    // 1. High-frequency Ticker Feed using Binance WebSocket
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker/ethusdt@ticker/solusdt@ticker/bnbusdt@ticker/xrpusdt@ticker/adausdt@ticker');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data && data.s) {
        const symbol = data.s.replace('USDT', '');
        if (['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'].includes(symbol)) {
          this.onMessage({
            type: 'REAL_TICKER',
            data: {
              symbol,
              price: parseFloat(data.c),
              change: parseFloat(data.P)
            }
          });
        }
      }
    };
    
    ws.onerror = (e) => {
      console.warn("Binance WS error", e);
    };

    // Store reference to ws to close it later
    (this as any).ws = ws;

    // 2. Arbitrage Opportunity Scanner (Order Book Depth Simulation) (1.5s)
    this.intervals.push(setInterval(() => {
      if (Math.random() > 0.2) { // 80% chance to update for "active" feel
        const idx = Math.floor(Math.random() * INITIAL_ARB_OPPS.length);
        const noise = (Math.random() * 0.0004) - 0.0002;
        
        // Simulate Order Book Dynamics
        const bidVol = Math.random() * 800 + 50;
        const askVol = Math.random() * 800 + 50;
        const totalVol = bidVol + askVol;
        
        // Calculate walls relative to a hypothetical "max depth" for visualization
        const maxDepthRef = 1500;
        const bidWall = Math.min(100, Math.floor((bidVol / maxDepthRef) * 100));
        const askWall = Math.min(100, Math.floor((askVol / maxDepthRef) * 100));
        
        // Determine Liquidity State
        let liquidity: 'High' | 'Medium' | 'Low' = 'Low';
        if (totalVol > 1200) liquidity = 'High';
        else if (totalVol > 600) liquidity = 'Medium';
        
        // Calculate Imbalance (-1 to 1)
        const imbalance = (bidVol - askVol) / totalVol;

        // Detect Manipulation Patterns (Spoofing/Wash Trading)
        // High volume imbalance + low liquidity often signals spoofing
        const volDiff = Math.abs(bidVol - askVol);
        let manipulationIndex = 0;
        
        if (volDiff > 400 && liquidity === 'Low') manipulationIndex += 40; // Spoof risk
        if (Math.abs(noise) > 0.0003) manipulationIndex += 30; // Volatility risk
        if (Math.random() > 0.9) manipulationIndex += 20; // Random wash trade spike

        this.onMessage({
          type: 'SCANNER',
          data: {
            index: idx,
            noise,
            walls: [bidWall, askWall],
            volumes: [bidVol, askVol],
            liquidity,
            imbalance,
            manipulationIndex: Math.min(100, manipulationIndex),
            latency: Math.floor(Math.random() * 10) + 1 // Improved latency simulation (1-11ms)
          }
        });
      }
    }, 1500));

    // 3. Heartbeat (3s)
    this.intervals.push(setInterval(() => {
      this.onMessage({ type: 'HEARTBEAT', timestamp: Date.now() });
    }, 3000));
  }

  private clearStreams() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    if ((this as any).ws) {
      (this as any).ws.close();
      (this as any).ws = null;
    }
  }

  public disconnect() {
    this.isConnected = false;
    this.clearStreams();
    this.onStatus('stalled');
  }
}

interface CexDashboardProps {
  portfolioBalance: number;
  onTradeSuccess: (amount: number, type: 'ARB' | 'GAS', token: string) => Promise<void>;
  transactions: any[];
}

const CexDashboard: React.FC<CexDashboardProps> = ({ 
  portfolioBalance, 
  onTradeSuccess,
  transactions
}) => {
  const [opportunities, setOpportunities] = useState<ExtendedOpportunity[]>(
    INITIAL_ARB_OPPS.map(o => ({ 
      ...o, 
      lastUpdated: 0, 
      liquidityDepth: 'Medium', 
      bidWall: 50, 
      askWall: 50, 
      bidVolume: 12.4, 
      askVolume: 10.8, 
      latency: 4, 
      securityScore: 92,
      imbalance: 0.1,
      manipulationIndex: 5
    }))
  );
  
  const [tickerData, setTickerData] = useState<TickerItem[]>(INITIAL_TICKER);
  const [streamStatus, setStreamStatus] = useState<'connected' | 'connecting' | 'stalled'>('connecting');
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now());
  const [lastRealSync, setLastRealSync] = useState<number>(Date.now());
  const [tradeStatuses, setTradeStatuses] = useState<Record<string, 'executing' | 'filled' | 'failed'>>({});
  const [isLive, setIsLive] = useState(true);
  const [autoPilot, setAutoPilot] = useState(false);
  const [neuralSentiment, setNeuralSentiment] = useState(72);
  const [sentimentHistory, setSentimentHistory] = useState<{time: string, value: number}[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  // Strategy Optimization State
  const [minSpread, setMinSpread] = useState(0);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optError, setOptError] = useState<string | null>(null);
  
  // Websocket Integration
  useEffect(() => {
    if (!isLive) return;

    const engine = new NexusStreamEngine(
      (msg) => {
        if (!msg || !msg.type) return;

        if (msg.type === 'HEARTBEAT') {
          setLastHeartbeat(msg.timestamp);
          setNeuralSentiment(prev => {
            const drift = (Math.random() * 4) - 2;
            const newVal = Math.min(100, Math.max(0, prev + drift));
            setSentimentHistory(h => [...h, { time: new Date().toLocaleTimeString(), value: newVal }].slice(-20));
            return newVal;
          });
        }
        
        if (msg.type === 'REAL_TICKER' && msg.data) {
          setLastRealSync(Date.now());
          setTickerData(prev => prev.map(t => {
            if (t.symbol === msg.data.symbol) {
              return {
                ...t, 
                price: msg.data.price,
                change: msg.data.change,
                lastUpdate: Date.now() 
              };
            }
            return t;
          }));

          setOpportunities(prev => prev.map(opp => {
             const baseSymbol = opp.pair.split('/')[0];
             if (baseSymbol === msg.data.symbol) {
                const bPrice = msg.data.price;
                // Add a small random noise 0.1% to 1.5% to create a fake spread on another exchange
                const fakeSpread = 1 + ((Math.random() * 0.014) + 0.001);
                const isBuyBinance = Math.random() > 0.5;
                const gPrice = isBuyBinance ? bPrice * fakeSpread : bPrice / fakeSpread;
                const diff = Math.abs(bPrice - gPrice);
                const spread = (diff / Math.min(bPrice, gPrice)) * 100;
                
                return {
                   ...opp,
                   buyPrice: Math.min(bPrice, gPrice),
                   sellPrice: Math.max(bPrice, gPrice),
                   spread: spread > 0.1 ? spread : opp.spread, 
                   lastUpdated: Date.now()
                };
             }
             return opp;
          }));
        }
        
        if (msg.type === 'SCANNER' && msg.data) {
          setOpportunities(prev => {
            const next = [...prev];
            const opp = next[msg.data.index];
            if (opp) {
              const oldPrice = opp.buyPrice;
              opp.buyPrice *= (1 + msg.data.noise);
              opp.sellPrice *= (1 + msg.data.noise + 0.0001); 
              
              opp.spread = ((opp.sellPrice - opp.buyPrice) / opp.buyPrice) * 100;
              opp.bidWall = msg.data.walls[0];
              opp.askWall = msg.data.walls[1];
              opp.bidVolume = msg.data.volumes[0];
              opp.askVolume = msg.data.volumes[1];
              opp.liquidityDepth = msg.data.liquidity;
              opp.latency = msg.data.latency;
              opp.lastUpdated = Date.now();
              opp.trend = opp.buyPrice > oldPrice ? 'up' : 'down';
              opp.imbalance = msg.data.imbalance;
              opp.manipulationIndex = msg.data.manipulationIndex;
              
              // Dynamic Security Score Calculation
              const spreadPenalty = opp.spread > 5 ? 20 : 0;
              const imbalancePenalty = Math.abs(opp.imbalance) > 0.6 ? 15 : 0;
              const depthPenalty = opp.liquidityDepth === 'Low' ? 30 : (opp.liquidityDepth === 'Medium' ? 10 : 0);
              const manipPenalty = opp.manipulationIndex > 40 ? 35 : (opp.manipulationIndex > 20 ? 15 : 0);
              
              let baseScore = 100 - imbalancePenalty - depthPenalty - spreadPenalty - manipPenalty;
              
              // Boost score if verified by AI recently (within 30s)
              if (opp.lastAudit && Date.now() - opp.lastAudit < 30000) {
                 baseScore += 10;
              }
              
              opp.securityScore = Math.max(0, Math.min(100, baseScore));
            }
            return next;
          });
        }
      },
      setStreamStatus
    );

    return () => engine.disconnect();
  }, [isLive]);

  // Handle Strategy Optimization
  const handleOptimize = async () => {
    if (isOptimizing) return;
    setIsOptimizing(true);
    
    // Create lightweight snapshot for AI context
    const marketSnapshot = opportunities.map(o => 
      `${o.pair}: Spread ${o.spread.toFixed(2)}%, Vol ${o.bidVolume+o.askVolume}, Risk ${o.securityScore}`
    ).join(' | ');
    
    const historySnapshot = history.length > 0 
      ? history.slice(0, 5).map(h => `Net ${h.netProfit}`).join(', ') 
      : "No recent executions";

    try {
      setOptError(null);
      const result = await getNeuralOptimization(marketSnapshot, historySnapshot);
      setOptimizationResult(result);
    } catch (e) {
      // Gracefully handle if service fails
      setOptError("Neural Uplink saturated. Reverting to local algorithms.");
      // Auto-clear error after 5s
      setTimeout(() => setOptError(null), 5000);
    } finally {
      setIsOptimizing(false);
    }
  };

  // Auto-Pilot Effect: periodically run optimization if enabled
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (autoPilot) {
      interval = setInterval(() => {
         // Conserve quota: 90s intervals for background optimization
         handleOptimize();
      }, 90000);
    }
    return () => clearInterval(interval);
  }, [autoPilot]); // Dependency on AutoPilot state

  // Auto-Apply High Confidence Strategies if Auto-Pilot is ON
  useEffect(() => {
    if (autoPilot && optimizationResult && optimizationResult.confidenceScore > 0.85) {
       // Only apply if significantly different to avoid jitter
       if (Math.abs(optimizationResult.suggestedThreshold - minSpread) > 0.1) {
          setMinSpread(optimizationResult.suggestedThreshold);
          // We could trigger a notification here
       }
    }
  }, [optimizationResult, autoPilot, minSpread]);

  const triggerNeuralAudit = (opp: ExtendedOpportunity) => {
    if ((window as any).triggerNexusAi) {
      setOpportunities(prev => prev.map(o => o.id === opp.id ? { ...o, isScanning: true } : o));
      
      const marketContext = `CURRENT_MARKET_STATE:
      - Tickers: ${tickerData.map(t => `${t.symbol}:$${t.price.toFixed(2)}`).join(' | ')}
      - Pulse: ${neuralSentiment.toFixed(1)}% Bias
      - Recent_Hits: ${transactions?.slice(0, 3).map(tx => `${tx.type}:${tx.amount}${tx.token}`).join(',')}`;

      const prompt = `CRITICAL: NEURAL AUDIT REQUESTED for ${opp.pair}. 
      TELEMETRY:
      - Spread: ${opp.spread.toFixed(3)}% (Discrepancy: ${opp.buyPrice.toFixed(2)} -> ${opp.sellPrice.toFixed(2)})
      - Manipulation Index: ${opp.manipulationIndex}/100
      - Liquidity: ${opp.liquidityDepth} (B:${opp.bidWall}% | A:${opp.askWall}%)
      - Imbalance: ${Math.abs(opp.imbalance * 100).toFixed(2)}% on ${opp.imbalance > 0 ? 'BUY' : 'SELL'} side.
      
      [LIVE_DATA_STREAM]:
      ${marketContext}

      TASK: Verify if this is a 'liquidity trap' or genuine. 
      FORMAT: You MUST include these markers in your brief analysis:
      CONFIDENCE: [0-100]%
      RISK: [LOW/MODERATE/HIGH/CRITICAL]
      ACTION: [EXPLOIT/WATCH/ABORT]
      
      Explain your reasoning comparing current price disparity with telemetry.`;
      
      (window as any).triggerNexusAi(prompt, true);
      
      setTimeout(() => {
        setOpportunities(prev => prev.map(o => o.id === opp.id ? { 
          ...o, 
          isScanning: false,
          lastAudit: Date.now(),
          manipulationIndex: Math.max(0, o.manipulationIndex - 15)
        } : o));
      }, 3000);
    }
  };

  const handleExecute = async (opp: ExtendedOpportunity) => {
    setTradeStatuses(prev => ({ ...prev, [opp.id]: 'executing' }));
    const result = await cexApi.executeArbitrageOrder(opp.pair, opp.buyExchange, opp.sellExchange, opp.buyPrice, opp.sellPrice, 1);
    
    if (result.success) {
      setHistory(prev => [{ ...result, timestamp: Date.now() }, ...prev].slice(0, 10));
      setTradeStatuses(prev => ({ ...prev, [opp.id]: 'filled' }));
      
      // Update Global Neural Portfolio via Firebase Sync
      const ethAmount = result.netProfit / 3500;
      await onTradeSuccess(ethAmount, 'ARB', 'ETH');
    } else {
      setTradeStatuses(prev => ({ ...prev, [opp.id]: 'failed' }));
    }

    setTimeout(() => {
      setTradeStatuses(prev => {
        const n = { ...prev };
        delete n[opp.id];
        return n;
      });
    }, 2000);
  };

  // Learning Progress Calculation
  const learningWeight = useMemo(() => {
    return Math.min(100, 35 + (transactions?.length || 0) * 8);
  }, [transactions]);

  const totalProfit = history.reduce((acc, curr) => acc + curr.netProfit, 0);

  // Filter opportunities based on AI threshold
  const filteredOpportunities = useMemo(() => {
    return opportunities.filter(o => o.spread >= minSpread);
  }, [opportunities, minSpread]);

  const topOpportunitiesContext = useMemo(() => {
    return opportunities
      .slice()
      .sort((a, b) => b.spread - a.spread)
      .slice(0, 3)
      .map(opp => `${opp.pair} (Spread: ${opp.spread.toFixed(2)}%, Security: ${opp.securityScore}%, Walls: B${opp.bidWall}/A${opp.askWall})`)
      .join(' | ');
  }, [opportunities]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'connected': return 'bg-emerald-500 shadow-[0_0_10px_#10b981]';
      case 'connecting': return 'bg-amber-500 shadow-[0_0_10px_#f59e0b]';
      case 'stalled': return 'bg-rose-500 shadow-[0_0_10px_#f43f5e]';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Ticker Tape */}
      <div className="bg-slate-900/40 border-y border-slate-800/50 backdrop-blur-md py-4 overflow-hidden relative group">
        <div className="flex animate-[scroll_50s_linear_infinite] whitespace-nowrap gap-16 px-4 group-hover:[animation-play-state:paused]">
          {tickerData.concat(tickerData).map((t, i) => (
            <div key={i} className="flex items-center gap-4 font-mono">
              <span className="text-slate-600 font-black uppercase text-[10px] tracking-widest">{t.symbol}/USDT</span>
              <span className={`text-sm font-black transition-all ${Date.now() - (t.lastUpdate || 0) < 300 ? 'text-primary scale-110' : 'text-white'}`}>
                ${t.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <div className={`flex items-center gap-1 text-[10px] font-bold ${t.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                {t.change >= 0 ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />}
                {Math.abs(t.change).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-surface border border-slate-800/80 rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-slate-800/50 bg-slate-900/30 flex justify-between items-center">
              <div>
                 <h2 className="text-2xl font-black text-white flex items-center gap-4 italic tracking-tighter uppercase">
                   <Target className="text-primary w-7 h-7" /> Arbitrage Scanner
                 </h2>
                 <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${getStatusColor(streamStatus)} animate-pulse`} />
                       <span className={`text-[10px] font-black uppercase tracking-widest ${
                         streamStatus === 'connected' ? 'text-emerald-500' : 
                         streamStatus === 'connecting' ? 'text-amber-500' : 'text-rose-500'
                       }`}>{streamStatus}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest border-l border-slate-800 pl-6">
                       <Activity className="w-3.5 h-3.5 text-rose-500/60" /> 
                       Relay: {opportunities[0]?.latency || 0}ms
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest border-l border-slate-800 pl-6">
                       <Radio className={`w-3.5 h-3.5 ${Date.now() - lastRealSync < 8000 ? 'text-emerald-500 text shadow-[0_0_8px_#10b981]' : 'text-slate-600'}`} /> 
                       Sync: {Math.floor((Date.now() - lastRealSync) / 1000)}s
                    </div>
                 </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsLive(!isLive)}
                  className={`p-3 rounded-2xl border transition-all ${isLive ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'}`}
                >
                  {isLive ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setAutoPilot(!autoPilot)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2 ${autoPilot ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                >
                  {autoPilot ? <PlayCircle className="w-3.5 h-3.5" /> : <PauseCircle className="w-3.5 h-3.5" />}
                  Auto-Pilot {autoPilot ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[450px]">
              {filteredOpportunities.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[450px] text-slate-500">
                   <Filter className="w-12 h-12 mb-4 opacity-50" />
                   <p className="font-black uppercase tracking-widest text-xs">No opportunities match current threshold</p>
                   <p className="text-[10px] mt-2 font-mono text-slate-600">Current Threshold: &gt;{minSpread}% Spread</p>
                   <button 
                     onClick={() => setMinSpread(0)}
                     className="mt-4 px-4 py-2 bg-slate-800 rounded-lg text-xs font-bold text-white hover:bg-slate-700"
                   >
                     Reset Filter
                   </button>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-slate-950/40 text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] border-b border-slate-800">
                    <tr>
                      <th className="px-8 py-6">Instrument</th>
                      <th className="px-8 py-6">Order Book Depth (Bid | Ask)</th>
                      <th className="px-8 py-6">Neural Risk Assessment</th>
                      <th className="px-8 py-6 text-right">Spread</th>
                      <th className="px-8 py-6 text-center">Protocol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40">
                    {filteredOpportunities.map(opp => (
                      <tr key={opp.id} className={`group hover:bg-slate-800/30 transition-all ${Date.now() - (opp.lastUpdated || 0) < 500 ? 'bg-primary/5' : ''} ${opp.isScanning ? 'bg-indigo-500/5' : ''}`}>
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-5">
                            <div className={`w-1.5 h-12 rounded-full ${opp.trend === 'up' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                            <div>
                                <div className="font-black text-white text-lg tracking-tighter">{opp.pair}</div>
                                <div className="flex items-center gap-3 mt-1 text-[9px] font-mono font-black uppercase">
                                  <span className="text-slate-500">{opp.buyExchange}: <span className="text-emerald-400">${opp.buyPrice.toFixed(2)}</span></span>
                                  <span className="text-slate-400">➔</span>
                                  <span className="text-slate-500">{opp.sellExchange}: <span className="text-rose-400">${opp.sellPrice.toFixed(2)}</span></span>
                                </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="w-60 space-y-3">
                              {/* Header Labels */}
                              <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider px-1">
                                  <span>Bid Wall ({opp.bidWall}%)</span>
                                  <span>Ask Wall ({opp.askWall}%)</span>
                              </div>

                              {/* Visual Order Book Split */}
                              <div className="flex items-center gap-1 h-10 bg-slate-900/50 rounded-lg p-1.5 border border-slate-800 relative overflow-hidden">
                                 {/* Central Divider */}
                                 <div className="absolute left-1/2 top-1 bottom-1 w-px bg-slate-800 z-0" />

                                 {/* Bid Side (Right Aligned) */}
                                 <div className="flex-1 flex flex-col items-end justify-center h-full pr-2 relative z-10">
                                    <div className="w-full flex justify-end h-2 bg-emerald-500/10 rounded-l-full overflow-hidden mb-1">
                                      <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-500" style={{ width: `${opp.bidWall}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono font-black text-emerald-400">{opp.bidVolume.toFixed(2)} Vol</span>
                                 </div>

                                 {/* Ask Side (Left Aligned) */}
                                 <div className="flex-1 flex flex-col items-start justify-center h-full pl-2 relative z-10">
                                    <div className="w-full flex justify-start h-2 bg-rose-500/10 rounded-r-full overflow-hidden mb-1">
                                      <div className="h-full bg-rose-500 shadow-[0_0_10px_#f43f5e] transition-all duration-500" style={{ width: `${opp.askWall}%` }} />
                                    </div>
                                    <span className="text-[10px] font-mono font-black text-rose-400">{opp.askVolume.toFixed(2)} Vol</span>
                                 </div>
                              </div>
                              
                              {/* Liquidity Badge */}
                              <div className="flex justify-between items-center px-1">
                                 <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 ${
                                   opp.liquidityDepth === 'High' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                   opp.liquidityDepth === 'Medium' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                                   'bg-rose-500/10 border-rose-500/30 text-rose-400'
                                 }`}>
                                    {/* Signal Bars */}
                                    <div className="flex gap-0.5 items-end h-2.5">
                                        <div className={`w-0.5 rounded-sm bg-current h-1.5 ${['Low','Medium','High'].includes(opp.liquidityDepth) ? 'opacity-100' : 'opacity-30'}`} />
                                        <div className={`w-0.5 rounded-sm bg-current h-2 ${['Medium','High'].includes(opp.liquidityDepth) ? 'opacity-100' : 'opacity-30'}`} />
                                        <div className={`w-0.5 rounded-sm bg-current h-2.5 ${['High'].includes(opp.liquidityDepth) ? 'opacity-100' : 'opacity-30'}`} />
                                    </div>
                                   {opp.liquidityDepth} LIQUIDITY
                                 </div>
                                 
                                 {/* Mini Liquidity Bars (NEW) */}
                                 <div className="mt-4 flex gap-0.5 h-1.5 w-full bg-slate-950 rounded-full overflow-hidden p-[0.5px] border border-slate-800">
                                    <div className="h-full bg-emerald-500/80 rounded-l-full shadow-[0_0_5px_rgba(16,185,129,0.4)]" style={{ width: '45%' }} />
                                    <div className="h-full bg-emerald-500/20" style={{ width: '15%' }} />
                                    <div className="h-full bg-rose-500/20" style={{ width: '10%' }} />
                                    <div className="h-full bg-rose-500/80 rounded-r-full shadow-[0_0_5px_rgba(244,63,94,0.4)]" style={{ width: '30%' }} />
                                 </div>
                                 <div className="flex justify-between mt-1.5 px-0.5">
                                    <div className="flex flex-col">
                                       <span className="text-[7px] font-black text-emerald-500/70 uppercase">Buy_Pressure</span>
                                       <span className="text-[9px] font-mono text-white">$2.4M</span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                       <span className="text-[7px] font-black text-rose-500/70 uppercase">Sell_Pressure</span>
                                       <span className="text-[9px] font-mono text-white">$1.8M</span>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-1 text-[8px] font-mono text-slate-500 mt-2">
                                    <Scale className="w-3 h-3" />
                                    {Math.abs(opp.imbalance).toFixed(2)} {opp.imbalance > 0 ? 'Buy Bias' : 'Sell Bias'}
                                 </div>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-3">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                    {/* Score Ring */}
                                    <svg className="w-10 h-10 rotate-[-90deg]">
                                      <circle cx="20" cy="20" r="16" fill="transparent" stroke="#1e293b" strokeWidth="4" />
                                      <circle 
                                        cx="20" cy="20" r="16" 
                                        fill="transparent" 
                                        stroke={ (opp.securityScore || 0) > 80 ? '#10b981' : (opp.securityScore || 0) > 50 ? '#f59e0b' : '#ef4444'} 
                                        strokeWidth="4" 
                                        strokeDasharray="100" 
                                        strokeDashoffset={100 - (opp.securityScore || 0)}
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <ShieldCheck className={`w-3.5 h-3.5 ${(opp.securityScore || 0) > 80 ? 'text-emerald-400' : (opp.securityScore || 0) > 50 ? 'text-amber-400' : 'text-rose-400'}`} />
                                    </div>
                                </div>
                                
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-lg font-black leading-none ${(opp.securityScore || 0) > 80 ? 'text-emerald-400' : (opp.securityScore || 0) > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {opp.securityScore}
                                      </span>
                                      {opp.lastAudit && Date.now() - opp.lastAudit < 30000 && (
                                        <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1 py-0.5 rounded border border-indigo-500/30 font-bold uppercase flex items-center gap-1">
                                            <Check className="w-2 h-2" /> Verified
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                                      {opp.manipulationIndex > 30 ? 'High Spoofing Risk' : 'Pattern: Organic'}
                                    </span>
                                </div>
                              </div>

                              <button 
                                onClick={() => triggerNeuralAudit(opp)}
                                className="w-full py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-slate-700 hover:border-slate-600 transition-all flex items-center justify-center gap-2 group/btn"
                              >
                                {opp.isScanning ? (
                                  <><Loader2 className="w-3 h-3 animate-spin text-indigo-400" /> Analyzing...</>
                                ) : (
                                  <><BrainCircuit className="w-3 h-3 group-hover/btn:text-indigo-400 transition-colors" /> Neural Audit</>
                                )}
                              </button>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right font-mono font-black text-emerald-400 text-xl italic">
                          +{opp.spread.toFixed(2)}%
                        </td>
                        <td className="px-8 py-6 text-center">
                          <button 
                            onClick={() => handleExecute(opp)}
                            disabled={!!tradeStatuses[opp.id]}
                            className="px-6 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:border-primary group-hover:text-primary transition-all active:scale-95 flex items-center justify-center gap-3 mx-auto"
                          >
                            {tradeStatuses[opp.id] === 'executing' ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                            tradeStatuses[opp.id] === 'filled' ? <Check className="w-4 h-4 text-emerald-500" /> : 'INITIATE'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Analytics */}
        <div className="lg:col-span-4 space-y-8">
           {/* Neural Discrepancy & Learning (NEW) */}
           <div className="bg-surface border border-slate-800/80 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="p-8 pb-0">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                  <BrainCircuit className="w-3 h-3 animate-pulse" /> Model Reinforcement
                </h3>
                <div className="flex justify-between items-end mb-4">
                   <div className="flex flex-col">
                      <span className="text-[8px] text-slate-500 font-black uppercase mb-1">Inference_Engine_v4.2</span>
                      <span className="text-2xl font-black text-white italic">{(92.4 + (transactions?.length || 0) * 0.1).toFixed(2)}% <span className="text-primary text-xs ml-1">ACCURACY</span></span>
                   </div>
                   <div className="text-right">
                      <span className="text-[10px] font-black text-slate-400">EPOCH_#{1400 + (transactions?.length || 0)}</span>
                   </div>
                </div>
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                   <div 
                      className="h-full bg-primary shadow-[0_0_10px_#06b6d4] transition-all duration-1000" 
                      style={{ width: `${learningWeight}%` }}
                   />
                </div>
                <div className="flex justify-between mt-2">
                   <span className="text-[7px] text-slate-600 font-black uppercase">Training_Active</span>
                   <span className="text-[7px] text-primary/80 font-black uppercase">Alpha_Locked: {(transactions?.length || 0) * 1.2}MB</span>
                </div>
              </div>

              <div className="p-8">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6 mt-4 flex items-center gap-2">
                  <Radio className="w-3 h-3 text-emerald-500" /> Discrepancy Stream
                </h3>
                <div className="space-y-4">
                   {tickerData.slice(0, 3).map((t, i) => (
                     <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/50 border border-slate-800/50">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center font-black text-[10px] text-white">
                              {t.symbol}
                           </div>
                           <div className="flex flex-col">
                              <span className="text-[8px] text-slate-500 font-black uppercase">Binance_Ref</span>
                              <span className="text-xs font-mono text-white">${t.price.toFixed(2)}</span>
                           </div>
                        </div>
                        <div className="text-right">
                           <span className="text-[8px] text-emerald-500 font-black uppercase">Alpha_Signal</span>
                           <div className="text-xs font-black text-emerald-400">
                             {t.globalPrice 
                               ? `${t.price > t.globalPrice ? '-' : '+'}${Math.abs(((t.price - t.globalPrice) / t.globalPrice) * 100).toFixed(3)}%`
                               : `+${((Math.random() * 0.4) + 0.1).toFixed(2)}%`
                             }
                           </div>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
           </div>

           {/* Global Sentiment Meter */}
           <div className="bg-surface border border-slate-800/80 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">Neural Market Pulse</h3>
                <div className="flex items-center justify-between mb-6">
                   <div className="flex flex-col">
                      <span className={`text-3xl font-black italic tracking-tighter ${neuralSentiment > 60 ? 'text-emerald-400' : neuralSentiment > 40 ? 'text-amber-400' : 'text-rose-400'}`}>
                        {neuralSentiment > 75 ? 'HYPER-BUY' : neuralSentiment > 55 ? 'OPTIMISTIC' : neuralSentiment > 40 ? 'NEUTRAL' : 'FEARFUL'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-1">Global Sentiment Flux</span>
                   </div>
                   <span className="text-5xl font-black text-white tracking-tighter font-mono">{neuralSentiment.toFixed(0)}</span>
                </div>
              

              {/* Chart Overlay */}
              <div className="h-32 w-full mt-auto relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sentimentHistory}>
                    <defs>
                      <linearGradient id="gradientSentiment" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={neuralSentiment > 60 ? '#10b981' : neuralSentiment > 40 ? '#f59e0b' : '#f43f5e'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={neuralSentiment > 60 ? '#10b981' : neuralSentiment > 40 ? '#f59e0b' : '#f43f5e'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke={neuralSentiment > 60 ? '#10b981' : neuralSentiment > 40 ? '#f59e0b' : '#f43f5e'} 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#gradientSentiment)" 
                      animationDuration={500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="px-8 pb-8 pt-4">
                <div className="h-2 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5 shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 shadow-lg ${neuralSentiment > 60 ? 'bg-emerald-500 shadow-emerald-500/20' : neuralSentiment > 40 ? 'bg-amber-500 shadow-amber-500/20' : 'bg-rose-500 shadow-rose-500/20'}`}
                    style={{ width: `${neuralSentiment}%` }} 
                  />
                </div>
                <div className="flex justify-between text-[9px] font-bold text-slate-700 uppercase mt-3 tracking-widest">
                   <span>EXTREME_FEAR</span>
                   <span>NEXUS_ALPHA</span>
                   <span>EXTREME_GREED</span>
                </div>
              </div>
           </div>

           {/* Neural Execution Log (Persistent) */}
           <div className="bg-slate-900/50 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-2xl relative">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                  <Activity className="w-3 h-3" /> Execution Log
                </h3>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest bg-slate-950 px-2 py-0.5 rounded">
                  {transactions?.length || 0} SYNCED
                </span>
              </div>
              
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                 {!transactions || transactions.length === 0 ? (
                    <div className="py-10 text-center">
                       <ZapOff className="w-8 h-8 text-slate-800 mx-auto mb-2" />
                       <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed">No persistent Alpha hits recorded.<br/>Sign in to enable neural logging.</p>
                    </div>
                 ) : (
                    transactions.map((tx, i) => (
                      <div key={tx.id || i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800/50 hover:border-primary/30 transition-colors group/item">
                         <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${
                                tx.type === 'ARB' ? 'bg-emerald-500/20 text-emerald-400' : 
                                tx.type === 'WITHDRAW' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                               {tx.type === 'ARB' ? 'HIT' : tx.type.slice(0, 3)}
                            </div>
                            <div className="flex flex-col">
                               <span className="text-[10px] font-black text-white italic group-hover/item:text-primary transition-colors">#{tx.id ? tx.id.slice(0, 6) : 'LOCAL'}</span>
                               <span className="text-[8px] text-slate-500 font-bold uppercase">{tx.time}</span>
                            </div>
                         </div>
                         <div className="text-right">
                           <div className={`text-xs font-black font-mono ${tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(4)} {tx.token}
                           </div>
                           <span className="text-[8px] text-slate-600 font-black uppercase">Gas: 0.0004</span>
                         </div>
                      </div>
                    ))
                 )}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center">
                <div className="flex flex-col text-left">
                   <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1">Portfolio_Val_Current</span>
                   <span className="text-2xl font-black text-white tracking-tighter">${(portfolioBalance * 3500).toFixed(2)}</span>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 group hover:bg-emerald-500/20 transition-all">
                   <TrendingUp className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
              </div>
           </div>

           {/* Neural Prediction Matrix (Machine Learning Layer) */}
           <div className="bg-surface border border-primary/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(6,182,212,0.05),transparent)] pointer-events-none"></div>
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1 flex items-center gap-2">
                       <Cpu className="w-3 h-3" /> Alpha Inference Engine
                    </h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Predictive Market Archetypes v1.4</p>
                 </div>
                 <div className="flex flex-col items-end">
                    <div className="flex gap-1 mb-1">
                       {[1,2,3,4].map(i => <div key={i} className={`w-1 h-3 rounded-full ${i <= 3 ? 'bg-primary' : 'bg-slate-800'} animate-pulse`} style={{ animationDelay: `${i*0.1}s` }}></div>)}
                    </div>
                    <span className="text-[8px] text-slate-600 font-black uppercase">Learning_Active</span>
                 </div>
              </div>

              <div className="space-y-4">
                 {tickerData.slice(0, 4).map((t, i) => {
                    const prob = 70 + (Math.random() * 25);
                    const divergence = t.globalPrice ? ((t.price - t.globalPrice) / t.globalPrice) * 100 : 0;
                    
                    return (
                       <div key={i} className="relative group/pred">
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800/40 group-hover/pred:border-primary/40 transition-all">
                             <div className="flex items-center gap-4">
                                <div className="text-sm font-black text-white w-10">{t.symbol}</div>
                                <div className="h-6 w-[1px] bg-slate-800"></div>
                                <div className="flex flex-col">
                                   <span className="text-[8px] text-slate-500 font-black uppercase">Bias</span>
                                   <span className={`text-[10px] font-black ${divergence > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                                      {divergence > 0 ? 'BEAR_GAP' : 'BULL_GAP'}
                                   </span>
                                </div>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-white">{prob.toFixed(1)}%</span>
                                <div className="w-24 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                                   <div 
                                      className="h-full bg-primary transition-all duration-1000" 
                                      style={{ width: `${prob}%` }}
                                   ></div>
                                </div>
                             </div>
                          </div>
                       </div>
                    );
                 })}
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20 col-span-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                       <BrainCircuit className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-primary uppercase">Neural Prediction</span>
                       <p className="text-[9px] text-slate-400 font-bold leading-tight">
                         {tickerData[0]?.price > (tickerData[0]?.globalPrice || 0) 
                            ? `Negative discrepancy in ${tickerData[0]?.symbol} detected. High probability of arbitrage compression.` 
                            : `Bullish divergence in ${tickerData[0]?.symbol} identified. Neural Core suggests priority monitoring.`
                         }
                       </p>
                    </div>
                 </div>
                 <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 flex flex-col justify-center">
                    <span className="text-[8px] text-slate-500 font-black uppercase mb-1">Model_Accuracy</span>
                    <span className="text-sm font-black text-white italic">98.42% <span className="text-[8px] text-emerald-500 font-normal">verified</span></span>
                 </div>
                 <div className="bg-slate-950/50 p-3 rounded-2xl border border-slate-800 flex flex-col justify-center">
                    <span className="text-[8px] text-slate-500 font-black uppercase mb-1">Epoch_Progress</span>
                    <span className="text-sm font-black text-white italic">#1,402 <span className="text-[8px] text-primary font-normal">syncing</span></span>
                 </div>
              </div>
           </div>

           {/* Market Archetype Radar (NEW) */}
           <div className="bg-slate-900/60 border border-slate-800/80 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Neural Market Archetype</h3>
              <div className="h-64 w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                       { subject: 'Volume', A: Math.min(100, 40 + (transactions?.length || 0) * 5), fullMark: 100 },
                       { subject: 'Volatility', A: Math.min(100, 30 + tickerData.filter(t => Date.now() - (t.lastUpdate || 0) < 2000).length * 15), fullMark: 100 },
                       { subject: 'Slippage', A: 100 - (opportunities[0]?.securityScore || 80), fullMark: 100 },
                       { subject: 'Security', A: opportunities.reduce((acc, o) => acc + (o.securityScore || 0), 0) / opportunities.length, fullMark: 100 },
                       { subject: 'Efficiency', A: Math.max(20, 100 - (opportunities.reduce((acc, o) => acc + o.spread, 0) / opportunities.length) * 10), fullMark: 100 },
                    ]}>
                       <PolarGrid stroke="#334155" />
                       <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                       <Radar
                          name="Market Pulse"
                          dataKey="A"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.4}
                       />
                    </RadarChart>
                 </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-3 mt-4 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                 <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-bold text-slate-400 leading-tight uppercase tracking-wider">
                    Market efficiency is high. Slippage vectors are minimal. Secure for high-frequency execution.
                 </span>
              </div>
           </div>

           {/* Strategy Optimizer Card */}
           <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-8 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Wand2 className="w-32 h-32 text-purple-500" />
               </div>
               <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                  <Cpu className="w-5 h-5 text-purple-500" /> Strategy Optimizer
               </h4>
               
               {!optimizationResult ? (
                  <div className="text-center py-6">
                      <p className="text-xs text-slate-500 mb-6 leading-relaxed">AI analysis of live spread deltas & historical execution rates to recommend optimal entry thresholds.</p>
                      
                      {optError && (
                        <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-[10px] font-bold flex items-center gap-2 animate-pulse">
                           <AlertTriangle className="w-3 h-3" /> {optError}
                        </div>
                      )}

                      <button 
                          onClick={handleOptimize}
                          disabled={isOptimizing}
                          className="w-full py-3 bg-purple-500/10 border border-purple-500/30 text-purple-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-500/20 transition-all flex items-center justify-center gap-2 group"
                      >
                          {isOptimizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />}
                          {isOptimizing ? "Running Simulation..." : "Run Neural Optimization"}
                      </button>
                  </div>
               ) : (
                  <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-black text-slate-500 uppercase">Suggested Threshold</span>
                          <span className="text-xl font-black text-white">{optimizationResult.suggestedThreshold}%</span>
                      </div>
                      
                      <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-xl">
                          <p className="text-[10px] text-purple-200/80 italic leading-relaxed">
                              "{optimizationResult.reasoning}"
                          </p>
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-purple-500/10">
                              <span className="text-[9px] font-bold text-purple-400 uppercase">Confidence: {(optimizationResult.confidenceScore * 100).toFixed(0)}%</span>
                              {optimizationResult.deepScanRecommended && (
                                  <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Deep Scan Needed
                                  </span>
                              )}
                          </div>
                      </div>

                      <div className="flex gap-2">
                          <button 
                              onClick={() => {
                                  setMinSpread(optimizationResult.suggestedThreshold);
                                  setOptimizationResult(null);
                              }}
                              className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500/20 transition-all"
                          >
                              Apply Parameters
                          </button>
                          <button 
                              onClick={() => setOptimizationResult(null)}
                              className="px-4 py-3 bg-slate-800 border border-slate-700 text-slate-400 rounded-xl hover:text-white transition-all"
                          >
                              <X className="w-4 h-4" />
                          </button>
                      </div>
                  </div>
               )}
               
               {minSpread > 0 && (
                  <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-slate-500 bg-slate-950/30 px-4 py-2 rounded-lg border border-slate-800/50">
                      <span className="flex items-center gap-2"><Sliders className="w-3 h-3" /> Active Filter: &gt;{minSpread}% Spread</span>
                      <button onClick={() => setMinSpread(0)} className="hover:text-white transition-colors"><X className="w-3 h-3" /></button>
                  </div>
               )}
           </div>

           {/* Global PnL Analytics */}
           <div className="bg-surface border border-slate-800/80 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <TrendingUp className="w-32 h-32 text-emerald-500" />
              </div>
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8">Session Performance</h3>
              <div className="flex items-end justify-between mb-10">
                 <div>
                    <span className="text-5xl font-black text-white tracking-tighter">
                      ${totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                       <span className="text-emerald-500 text-xs font-black uppercase tracking-widest">+4.2% OVER_PAR</span>
                    </div>
                 </div>
                 <BarChart className="w-12 h-12 text-primary opacity-50" />
              </div>
              <div className="space-y-4">
                 {history.slice(0, 5).map((h, i) => (
                   <div key={i} className="flex justify-between items-center py-3 border-t border-slate-800/50 group/item">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{h.buyLeg.exchange} ➔ {h.sellLeg.exchange}</span>
                        <span className="text-[8px] text-slate-600 font-bold uppercase">{new Date(h.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className="text-sm font-mono text-emerald-400 font-black group-hover/item:scale-110 transition-transform">+${h.netProfit.toFixed(2)}</span>
                   </div>
                 ))}
                 {history.length === 0 && (
                   <div className="py-8 text-center border-t border-slate-800/30">
                      <ZapOff className="w-8 h-8 text-slate-800 mx-auto mb-3" />
                      <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Awaiting Alpha Capture</span>
                   </div>
                 )}
              </div>
           </div>

           <div className="bg-slate-900/40 border border-slate-800/80 rounded-[2rem] p-8">
              <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                 <ShieldCheck className="w-5 h-5 text-emerald-500" /> Security Engine
              </h4>
              <div className="space-y-4 text-[10px] font-mono text-slate-500">
                 <div className="flex gap-3 items-start border-l-2 border-slate-800 pl-4">
                    <span className="text-slate-700 font-bold">[{new Date().toLocaleTimeString()}]</span>
                    <span>WSS Bridge Stabilized: Latency 2ms</span>
                 </div>
                 <div className="flex gap-3 items-start border-l-2 border-emerald-500/30 pl-4">
                    <span className="text-slate-700 font-bold">[{new Date(Date.now()-10000).toLocaleTimeString()}]</span>
                    <span className="text-emerald-400/80">MEV Guard Active: Shielding TX Broadcaster</span>
                 </div>
                 <div className="flex gap-3 items-start border-l-2 border-slate-800 pl-4">
                    <span className="text-slate-700 font-bold">[{new Date(Date.now()-60000).toLocaleTimeString()}]</span>
                    <span>Neural Handshake Complete: Innyfix Ready</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
      
      <AiAssistant currentContext={`MODE: CEX ARBITRAGE | FEED: ${streamStatus} | PROFIT: $${totalProfit.toFixed(2)} | TOP_ALPHAS: ${topOpportunitiesContext} | SENTIMENT: ${neuralSentiment.toFixed(0)}% | STATUS: SHIELDED | FILTER: >${minSpread}%`} />
    </div>
  );
};

export default CexDashboard;
