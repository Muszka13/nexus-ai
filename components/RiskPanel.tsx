import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldEllipsis, 
  Zap, 
  Activity, 
  AlertTriangle 
} from 'lucide-react';

interface RiskPanelProps {
  auditScore: number | null;
  gasGwei: number;
  networkLoad: 'LOW' | 'MEDIUM' | 'HIGH';
  volatility: number; // 0-100
}

const RiskPanel: React.FC<RiskPanelProps> = ({ 
  auditScore, 
  gasGwei, 
  networkLoad, 
  volatility 
}) => {
  const safetyScore = useMemo(() => {
    let score = 100;
    
    // Audit Impact
    if (auditScore !== null) {
      score -= (100 - auditScore) * 0.5;
    } else {
      score -= 15; // Penalty for no audit
    }

    // Gas/Load Impact
    if (networkLoad === 'HIGH') score -= 20;
    if (networkLoad === 'MEDIUM') score -= 5;
    if (gasGwei > 100) score -= 10;

    // Volatility Impact
    score -= volatility * 0.2;

    return Math.max(0, Math.min(100, Math.round(score)));
  }, [auditScore, gasGwei, networkLoad, volatility]);

  const getStatusColor = (score: number) => {
    if (score > 80) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5';
    if (score > 50) return 'text-amber-400 border-amber-500/20 bg-amber-500/5';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/5';
  };

  const status = safetyScore > 80 ? 'SECURE' : safetyScore > 50 ? 'CAUTION' : 'HIGH_RISK';

  return (
    <div className={`p-6 rounded-3xl border transition-all duration-500 ${getStatusColor(safetyScore)}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-current opacity-20`}></div>
          {safetyScore > 80 ? <ShieldCheck className="w-5 h-5" /> : safetyScore > 50 ? <ShieldEllipsis className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60">Neural Safety Score</h4>
            <div className="text-xl font-black tracking-tighter">{safetyScore}%</div>
          </div>
        </div>
        <div className="text-right">
           <span className="text-[9px] font-black uppercase tracking-widest block opacity-40">System Status</span>
           <span className="text-xs font-black">{status}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 opacity-60">
            <Zap className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Slippage Tolerance</span>
          </div>
          <div className="text-xs font-mono">0.5% (DYNAMIC)</div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2 opacity-60">
            <Activity className="w-3 h-3" />
            <span className="text-[9px] font-black uppercase tracking-widest">Front-Run Risk</span>
          </div>
          <div className="text-xs font-mono">{networkLoad === 'HIGH' ? 'CRITICAL' : 'MINIMAL'}</div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-current border-opacity-10">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-3 h-3 mt-0.5 opacity-60" />
          <p className="text-[10px] leading-relaxed opacity-60">
            {safetyScore > 80 
              ? "Synapses aligned. Net positive outcome highly probable. MEV protection active."
              : safetyScore > 50
              ? "Minor neural noise detected. Slippage may occur during high-latency periods."
              : "Neural saturation reached. Execution not recommended due to extreme gas/volatility."}
          </p>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4 h-1 w-full bg-black/20 rounded-full overflow-hidden">
        <motion.div 
          className="h-full bg-current"
          initial={{ width: 0 }}
          animate={{ width: `${safetyScore}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

export default RiskPanel;
