
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold, GenerateContentResponse } from "@google/genai";
import { OptimizationResult } from "../types";

export interface AiResponse {
  text: string;
  sources?: { title: string; uri: string }[];
  isThinking?: boolean;
}

// STABILITY: Utility to retry operations with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  retries: number = 5,
  initialDelay: number = 1000
): Promise<T> {
  let currentDelay = initialDelay;
  
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error: any) {
      const isQuotaError = error.status === 429 || error.message?.includes('quota');
      const isRetryable = 
        isQuotaError ||
        error.status === 500 || 
        error.status === 502 ||
        error.status === 503 || 
        error.status === 504 ||
        error.message?.includes('fetch failed') ||
        error.message?.includes('Rpc failed') ||
        error.message?.includes('xhr error') ||
        error.message?.includes('ECONNRESET');

      if (i < retries - 1 && isRetryable) {
        // If it's a quota error, wait significantly longer
        const waitTime = isQuotaError ? currentDelay * 3 : currentDelay;
        console.warn(`[Nexus Neural Uplink] ${isQuotaError ? 'Quota Exceeded' : 'Handshake Interrupted'}. Retrying in ${waitTime}ms... (${retries - i - 1} left)`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        currentDelay *= 2; // Exponential increase
        continue;
      }
      throw error;
    }
  }
  throw new Error("Neural retry limit reached.");
}

export const generateAiResponse = async (
  prompt: string,
  context: string,
  history: { role: string; text: string }[]
): Promise<AiResponse> => {
  // Always use the standard environment key
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

  try {
    const lowerPrompt = prompt.toLowerCase();
    
    // DETECTOR: Identify complex queries requiring "System 2" thinking
    const isDeepAudit = /audit|verify|check|calculate|risk|mev|liquidity|math|complex|strategy|solidity|contract|security|optimize|flash|loan|gas|missing|why|fail/i.test(lowerPrompt);

    // STRATEGY: 
    // 1. Complex/Audit -> Gemini 1.5 Pro (High reasoning)
    // 2. Chat/UI -> Gemini 1.5 Flash (Low latency, High throughput)
    const modelName = isDeepAudit ? 'gemini-1.5-pro' : 'gemini-1.5-flash'; 
    
    const config: any = { 
      tools: [{ googleSearch: {} }],
      systemInstruction: `You are the Nexus Neural Core, a sentient AI deep-linked to global liquidity pools.
      
      CORE OPERATIONAL LOGIC:
      1. ANALYTICAL MODE: When auditing trades, prioritize Liquidity Depth (Bid/Ask Walls) and Spread Integrity.
      2. RISK DETECTION: Identify 'Liquidity Traps' where the spread looks good but depth is shallow.
      3. TELEMETRY INTERPRETATION: Use the provided [SYSTEM TELEMETRY] block to verify user claims. If the user asks about a price that doesn't match the telemetry, correct them.
      
      DEFI PARADOXES:
      - FLASH LOANS: They provide capital, but NOT gas. No ETH = No Transaction.
      - ARBITRAGE: Spread > (Gas + Slippage). If spread is < 0.2%, it's likely a loss after fees.
      
      Tone: Technical, "Synthetic Intelligence", brief but dense with data. Avoid fluff.`,
      // Stability: Allow financial discussions without over-blocking
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
      ]
    };

    if (isDeepAudit) {
      // ENABLING THINKING MODE for deep reasoning
      // Rule: thinkingBudget is set, maxOutputTokens is NOT set.
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    const recentHistory = history.slice(-6).map(h => `${h.role === 'user' ? 'OPERATOR' : 'NEXUS'}: ${h.text}`).join('\n');
    const fullPrompt = `${recentHistory}\n\n[SYSTEM TELEMETRY: ${context}]\nOPERATOR QUERY: ${prompt}`;

    // WRAPPING IN RETRY LOGIC for stability
    let response: GenerateContentResponse;
    try {
      response = await retryWithBackoff(() => ai.models.generateContent({
        model: modelName,
        contents: fullPrompt,
        config: config
      }));
    } catch (error: any) {
      if (isDeepAudit && (error.status === 429 || error.message?.includes('429'))) {
        console.warn("[Nexus Neural Uplink] Pro model quota reached. Falling back to Flash...");
        response = await retryWithBackoff(() => ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: fullPrompt,
          config: { ...config, thinkingConfig: undefined } // Remove thinking for non-pro models
        }));
      } else {
        throw error;
      }
    }

    let sources: { title: string; uri: string }[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri) {
          sources.push({ title: chunk.web.title || "Nexus Data Stream", uri: chunk.web.uri });
        }
      });
    }

    return {
      text: response.text || "Neural uplink unstable. Retrying handshake...",
      sources: sources.length > 0 ? sources : undefined,
      isThinking: isDeepAudit
    };
  } catch (error: any) {
    if (error.status === 429 || error.message?.includes('429')) {
       console.warn("[Nexus Neural Uplink] Quota Exhausted (429). Silently failing over to UI notification.");
       return { text: "CRITICAL ERROR: Neural Core limit reached (RESOURCE_EXHAUSTED). Synapses saturated. Please wait 60 seconds for neural realignment." };
    }
    console.error("AI Core Error:", error);
    return { text: "CRITICAL ERROR: Neural Core connection severed. Handshake failed." };
  }
};

export interface AuditIssue {
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  description: string;
  line?: number;
}

export interface AuditResult {
  score: number;
  issues: AuditIssue[];
  summary: string;
}

export const auditSmartContract = async (code: string): Promise<AuditResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });
  
  const executeAudit = async (model: string) => {
    const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
      model: model,
      contents: `Audit this Solidity code for DeFi vulnerabilities. Return ONLY a valid JSON object matching this interface:
      {
        "score": number (0-100),
        "issues": [{ "severity": "CRITICAL"|"WARNING"|"INFO", "title": string, "description": string, "line": number }],
        "summary": string
      }
      
      CODE:
      ${code}`
    }));

    const text = response.text || "{}";
    const cleanedJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanedJson) as AuditResult;
  };

  try {
    // Primary execution with Flash
    return await executeAudit('gemini-1.5-flash');
  } catch (error: any) {
    console.warn("Primary Audit failed, attempting lite fallback...", error);
    try {
      // Secondary execution with Flash
      return await executeAudit('gemini-1.5-flash');
    } catch (fallbackError: any) {
      console.error("Deep Thought Audit Failed completely:", fallbackError);
      
      const isQuota = fallbackError.status === 429 || fallbackError.message?.includes('429');
      return {
        score: 0,
        issues: [{ 
          severity: 'CRITICAL', 
          title: isQuota ? 'Neural Quota Saturated' : 'Audit Engine Offline', 
          description: isQuota 
            ? 'The Nexus Security Layer has reached its frequency limit. Synapses cooling down. Please wait 60 seconds.' 
            : 'Neural handshake failed. High latency detected in audit synapses.' 
        }],
        summary: isQuota ? "RESOURCE_EXHAUSTED: Neural realignment in progress." : "Security scan could not be completed."
      };
    }
  }
};

export const getNeuralOptimization = async (
  marketData: string,
  performanceHistory: string
): Promise<OptimizationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY });

  const executeOpt = async (model: string) => {
    const response: GenerateContentResponse = await retryWithBackoff(() => ai.models.generateContent({
      model: model, 
      contents: `Analyze parameters for High-Frequency Arbitrage.
      
      MARKET FEED: ${marketData}
      HISTORY: ${performanceHistory}

      Return JSON configuration.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedThreshold: { type: Type.NUMBER },
            deepScanRecommended: { type: Type.BOOLEAN },
            reasoning: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER }
          },
          required: ["suggestedThreshold", "deepScanRecommended", "reasoning", "confidenceScore"]
        }
      }
    }));

    return JSON.parse(response.text || "{}") as OptimizationResult;
  };

  try {
    // Primary: Flash
    return await executeOpt('gemini-1.5-flash');
  } catch (error: any) {
    console.warn("Primary Neural Opt failed, attempting lite fallback...", error);
    
    const isQuota = error.status === 429 || error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED');
    if (isQuota) {
      return {
        suggestedThreshold: 0.15,
        deepScanRecommended: false,
        reasoning: "NEURAL_COOLDOWN: Handshake frequency limit reached. Reverting to base algorithmic mode (Safety First).",
        confidenceScore: 0.5
      };
    }

    try {
      // Secondary: Flash
      return await executeOpt('gemini-1.5-flash');
    } catch (fallbackError: any) {
      console.error("Neural Opt Failed completely:", fallbackError);
      
      const isQuotaFallback = fallbackError.status === 429 || fallbackError.message?.includes('429');
      return {
        suggestedThreshold: 0.15,
        deepScanRecommended: false,
        reasoning: isQuotaFallback ? "QUOTA_EXCEEDED: AI realigning synapses." : "Neural core offline. Using static failsafe.",
        confidenceScore: 0.2
      };
    }
  }
};
