
export enum ExchangeType {
  CEX = 'CEX',
  DEX = 'DEX'
}

export interface Exchange {
  id: string;
  name: string;
  type: ExchangeType;
  volume24h: string;
  trustScore: number; // 1-10
  status: 'active' | 'maintenance';
  logo: string;
}

export interface ArbitrageOpportunity {
  id: string;
  pair: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  profitPotential: number;
  timestamp: number;
  // Enhanced fields
  liquidityDepth?: 'High' | 'Medium' | 'Low';
  bidWall?: number; // Normalized 0-100
  askWall?: number; // Normalized 0-100
}

export interface FlashLoanParams {
  token: string;
  amount: number;
  route: string[];
  estimatedGas: number;
}

export interface Wallet {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  address?: string;
  balance?: string;
  tier?: 'Standard' | 'Elite' | 'Neural';
  trustScore?: number;
  lastAudit?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface OptimizationResult {
  suggestedThreshold: number;
  deepScanRecommended: boolean;
  reasoning: string;
  confidenceScore: number;
}
