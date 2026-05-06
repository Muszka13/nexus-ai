
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Minimize2, Maximize2, Sparkles, BrainCircuit, ExternalLink, Globe, Brain, Radio, Trash2, Cpu } from 'lucide-react';
import { ChatMessage } from '../types';
import { generateAiResponse, AiResponse } from '../services/geminiService';

interface ExtendedChatMessage extends ChatMessage {
  sources?: { title: string; uri: string }[];
  isThinking?: boolean;
}

interface AiAssistantProps {
  currentContext: string;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ currentContext }) => {
  const [isOpen, setIsOpen] = useState(false); 
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMode, setLoadingMode] = useState<'thinking' | 'searching' | 'default'>('default');
  const [autoPilot, setAutoPilot] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoPilotRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load Memory on Mount
  useEffect(() => {
    const saved = localStorage.getItem('nexus_ai_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMessages(parsed);
      } catch (e) {
        console.error("Failed to load AI memory");
      }
    } else {
        setMessages([{ id: 'init', role: 'model', text: 'Nexus Core initialized. I am monitoring your trading environment. I will protect you from bad math.', timestamp: new Date() }]);
    }
  }, []);

  // Save Memory on Update
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('nexus_ai_history', JSON.stringify(messages.slice(-20))); 
    }
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Expose trigger
  useEffect(() => {
    (window as any).triggerNexusAi = (prompt: string, autoSend: boolean = false) => {
      if(!isOpen) setIsOpen(true);
      setInput(prompt || '');
      if (autoSend && prompt) {
        // We need to use a brief timeout to let the UI open if it wasn't
        setTimeout(() => {
          const btn = document.querySelector('button[disabled].absolute.right-2.top-2');
          // Actually, let's just trigger a custom event or call handleSend if possible
          // But handleSend is internal. Let's use a more robust way.
          const inputEl = document.querySelector('input[placeholder="Command Nexus Core..."]') as HTMLInputElement;
          if (inputEl) {
             inputEl.value = prompt;
             const event = new KeyboardEvent('keydown', {
               key: 'Enter',
               code: 'Enter',
               keyCode: 13,
               which: 13,
               bubbles: true
             });
             inputEl.dispatchEvent(event);
          }
        }, 500);
      }
    };
  }, [isOpen]);

  // Auto-Pilot Simulation
  useEffect(() => {
    if (autoPilot) {
      autoPilotRef.current = setInterval(() => {
        if (!isLoading && Math.random() > 0.85) {
           const alerts = [
             "Market Volatility detected. Spread on ETH/USDT widening.",
             "Gas fees are currently optimal for Flash execution.",
             "Scan suggests arbitrage opportunity on KuCoin.",
             "Warning: Low liquidity on target DEX pool."
           ];
           const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
           
           setMessages(prev => [...prev, {
             id: Date.now().toString(),
             role: 'model',
             text: `[AUTO-PILOT] ${randomAlert}`,
             timestamp: new Date()
           }]);
        }
      }, 15000); 
    } else {
      if (autoPilotRef.current) clearInterval(autoPilotRef.current);
    }
    return () => { if (autoPilotRef.current) clearInterval(autoPilotRef.current); };
  }, [autoPilot, isLoading]);

  const handleSend = async () => {
    const safeInput = (input || '').trim();
    if (!safeInput || isLoading) return;

    const userMsg: ExtendedChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: safeInput,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    // Determine loading visual based on query type
    const lowerInput = safeInput.toLowerCase();
    if (lowerInput.includes('audit') || lowerInput.includes('why') || lowerInput.includes('plan') || lowerInput.includes('missing')) {
      setLoadingMode('thinking');
    } else {
      setLoadingMode('default');
    }

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    const response: AiResponse = await generateAiResponse(userMsg.text, currentContext || 'IDLE', history);

    if (response.text.includes('RESOURCE_EXHAUSTED') || response.text.includes('limit reached') || response.text.includes('Synapses saturated')) {
      const quotaMsg: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "🚨 [NEURAL QUOTA EXHAUSTED] The Nexus Core is currently cooling down its synapses (Gemini API limit reached). High-density optimization is temporarily restricted. Please wait 60 seconds for neural realignment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, quotaMsg]);
    } else {
      const aiMsg: ExtendedChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text,
        sources: response.sources,
        isThinking: response.isThinking,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
    }

    setIsLoading(false);
    setLoadingMode('default');
  };

  const clearMemory = () => {
      setMessages([{ id: Date.now().toString(), role: 'model', text: 'Memory core purged.', timestamp: new Date() }]);
      localStorage.removeItem('nexus_ai_history');
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 group flex items-center gap-2 z-40 transition-all hover:scale-105"
      >
        <div className={`p-4 rounded-full shadow-2xl shadow-purple-500/30 transition-all ${autoPilot ? 'bg-emerald-600 animate-pulse' : 'bg-purple-600'}`}>
             <BrainCircuit className="w-8 h-8 text-white" />
        </div>
        <span className="bg-surface border border-slate-700 px-3 py-1 rounded-lg text-xs font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
            Nexus Core
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-[90vw] sm:w-[400px] h-[650px] max-h-[80vh] bg-surface/95 backdrop-blur-md border border-purple-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-40 animate-in slide-in-from-bottom-10 duration-300 font-sans">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-900/50 to-slate-900 border-b border-purple-500/20 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`w-2.5 h-2.5 absolute -right-0.5 -top-0.5 rounded-full animate-pulse ${autoPilot ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-purple-500'}`}></div>
            <Bot className={`w-6 h-6 ${autoPilot ? 'text-emerald-400' : 'text-purple-400'}`} />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                Nexus Core
                {autoPilot && <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded border border-emerald-500/30">AUTO</span>}
            </h3>
            <p className="text-[10px] text-purple-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Gemini 1.5 Pro
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={clearMemory} className="text-slate-500 hover:text-red-400" title="Wipe Memory">
                <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <Minimize2 className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-slate-900/80 px-4 py-2 flex items-center justify-between border-b border-slate-800">
         <span className="text-[10px] text-slate-500 uppercase tracking-wider">System 2 Thinking</span>
         <button 
            onClick={() => setAutoPilot(!autoPilot)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all border ${
                autoPilot 
                ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
         >
            <Radio className="w-3 h-3" />
            {autoPilot ? 'WATCHING' : 'IDLE'}
         </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20" ref={scrollRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div 
              className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed relative group
                ${msg.role === 'user' 
                  ? 'bg-purple-600 text-white rounded-br-none shadow-lg shadow-purple-900/20' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none shadow-lg'
                }`}
            >
              {msg.role === 'model' && <Bot className="w-4 h-4 absolute -left-6 top-2 text-slate-600 opacity-50" />}
              
              {/* Synthetic Insight Parser */}
              {msg.role === 'model' && msg.text.includes('CONFIDENCE:') ? (
                <div className="space-y-3">
                   <p className="mb-2 italic opacity-90">{msg.text.split('TELEMETRY:')[0].split('CONFIDENCE:')[0]}</p>
                   <div className="p-3 bg-slate-950/80 rounded-xl border border-primary/20 space-y-2">
                       <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-primary">
                          <span>Neural Assessment</span>
                          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> System 2</span>
                       </div>
                       <div className="grid grid-cols-2 gap-2">
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                             <div className="text-[8px] text-slate-500 font-bold uppercase">Confidence</div>
                             <div className="text-sm font-black text-emerald-400">{msg.text.match(/CONFIDENCE: (\d+%)/)?.[1] || 'N/A'}</div>
                          </div>
                          <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                             <div className="text-[8px] text-slate-500 font-bold uppercase">Risk_Level</div>
                             <div className="text-sm font-black text-rose-400">{msg.text.match(/RISK: (\w+)/)?.[1] || 'MODERATE'}</div>
                          </div>
                       </div>
                       {msg.text.includes('ACTION:') && (
                          <div className="mt-2 text-[10px] font-bold text-white bg-primary/20 p-2 rounded-lg border border-primary/30 flex items-center gap-2">
                             <Sparkles className="w-3 h-3 text-primary" />
                             RECOMMENDED: {msg.text.match(/ACTION: ([^.\n]+)/)?.[1] || 'Wait for confirmation'}
                          </div>
                       )}
                   </div>
                   <p className="text-xs text-slate-400 leading-normal">{msg.text.split('ACTION:').pop()?.split('CONFIDENCE:')[0]}</p>
                </div>
              ) : (
                msg.text
              )}
            </div>
            
            {/* Thinking Indicator for completed messages */}
            {msg.isThinking && (
              <div className="mt-1 flex items-center gap-1.5 ml-2 animate-in fade-in">
                <Brain className="w-3 h-3 text-purple-400" />
                <span className="text-[9px] text-purple-400/70 font-mono tracking-wide">COMPLEX REASONING USED</span>
              </div>
            )}
            
            {/* Sources Display */}
            {msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 max-w-[85%] animate-in fade-in">
                {msg.sources.slice(0, 3).map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[10px] bg-slate-900/80 text-blue-400 border border-slate-700 px-2 py-1 rounded-md hover:bg-slate-800 transition-colors"
                  >
                    <Globe className="w-3 h-3" />
                    <span className="truncate max-w-[120px]">{source.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
           <div className="flex justify-start">
             <div className="bg-slate-800 p-3 rounded-2xl rounded-bl-none border border-slate-700 shadow-lg">
               <div className="flex items-center gap-2">
                 {loadingMode === 'thinking' ? (
                   <>
                    <Cpu className="w-4 h-4 text-purple-500 animate-[spin_3s_linear_infinite]" />
                    <span className="text-xs text-purple-300 font-mono animate-pulse">Running Neural Simulation...</span>
                   </>
                 ) : (
                   <>
                    <Globe className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-xs text-blue-300 font-mono">Processing...</span>
                   </>
                 )}
               </div>
             </div>
           </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Command Nexus Core..."
            className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-purple-500 transition-colors placeholder-slate-500 text-sm font-medium"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 flex justify-between items-center px-1">
            <div className="flex gap-2 items-center">
                <div className="flex gap-0.5">
                    <div className="w-1 h-3 bg-emerald-500/40 rounded-full animate-pulse"></div>
                    <div className="w-1 h-3 bg-emerald-500/60 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                    <div className="w-1 h-3 bg-emerald-500/40 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                </div>
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">
                   Uplink: Live_Feed
                </span>
            </div>
            <span className="text-[9px] text-slate-700 font-mono flex items-center gap-1">
                <Cpu className="w-2.5 h-2.5" /> Core: G3.1_HEDH
            </span>
        </div>
      </div>
    </div>
  );
};

export default AiAssistant;
