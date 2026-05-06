
import { Exchange, ExchangeType, ArbitrageOpportunity, Wallet } from './types';

export const CEX_LIST: Exchange[] = [
  { id: 'binance', name: 'Binance', type: ExchangeType.CEX, volume24h: '$12.5B', trustScore: 10, status: 'active', logo: 'https://picsum.photos/40/40?random=1' },
  { id: 'coinbase', name: 'Coinbase', type: ExchangeType.CEX, volume24h: '$3.2B', trustScore: 10, status: 'active', logo: 'https://picsum.photos/40/40?random=2' },
  { id: 'kraken', name: 'Kraken', type: ExchangeType.CEX, volume24h: '$1.8B', trustScore: 9, status: 'active', logo: 'https://picsum.photos/40/40?random=3' },
  { id: 'kucoin', name: 'KuCoin', type: ExchangeType.CEX, volume24h: '$1.1B', trustScore: 8, status: 'active', logo: 'https://picsum.photos/40/40?random=4' },
  { id: 'bybit', name: 'Bybit', type: ExchangeType.CEX, volume24h: '$4.5B', trustScore: 9, status: 'active', logo: 'https://picsum.photos/40/40?random=5' },
  { id: 'custom-cex', name: 'Other (API)', type: ExchangeType.CEX, volume24h: 'N/A', trustScore: 5, status: 'maintenance', logo: 'https://picsum.photos/40/40?random=16' },
];

export const DEX_LIST: Exchange[] = [
  { id: 'uniswap', name: 'Uniswap V3', type: ExchangeType.DEX, volume24h: '$900M', trustScore: 10, status: 'active', logo: 'https://picsum.photos/40/40?random=6' },
  { id: 'pancakeswap', name: 'PancakeSwap', type: ExchangeType.DEX, volume24h: '$400M', trustScore: 8, status: 'active', logo: 'https://picsum.photos/40/40?random=7' },
  { id: 'curve', name: 'Curve Finance', type: ExchangeType.DEX, volume24h: '$150M', trustScore: 9, status: 'active', logo: 'https://picsum.photos/40/40?random=8' },
  { id: 'sushi', name: 'SushiSwap', type: ExchangeType.DEX, volume24h: '$80M', trustScore: 7, status: 'active', logo: 'https://picsum.photos/40/40?random=9' },
  { id: 'balancer', name: 'Balancer', type: ExchangeType.DEX, volume24h: '$120M', trustScore: 8, status: 'active', logo: 'https://picsum.photos/40/40?random=10' },
  { id: 'custom-dex', name: 'Other (RPC)', type: ExchangeType.DEX, volume24h: 'N/A', trustScore: 5, status: 'maintenance', logo: 'https://picsum.photos/40/40?random=17' },
];

export const WALLETS: Wallet[] = [
  { id: 'metamask', name: 'MetaMask', icon: 'https://picsum.photos/30/30?random=11', connected: false },
  { id: 'phantom', name: 'Phantom', icon: 'https://picsum.photos/30/30?random=12', connected: false },
  { id: 'walletconnect', name: 'WalletConnect', icon: 'https://picsum.photos/30/30?random=13', connected: false },
  { id: 'coinbase', name: 'Coinbase Wallet', icon: 'https://picsum.photos/30/30?random=14', connected: false },
  { id: 'trust', name: 'Trust Wallet', icon: 'https://picsum.photos/30/30?random=15', connected: false },
];

export const INITIAL_ARB_OPPS: ArbitrageOpportunity[] = [
  { id: '1', pair: 'BTC/USDT', buyExchange: 'KuCoin', sellExchange: 'Binance', buyPrice: 64200, sellPrice: 64550, spread: 0.54, profitPotential: 350, timestamp: Date.now() },
  { id: '2', pair: 'ETH/USDT', buyExchange: 'Kraken', sellExchange: 'Bybit', buyPrice: 3450, sellPrice: 3480, spread: 0.87, profitPotential: 30, timestamp: Date.now() },
  { id: '3', pair: 'SOL/USDT', buyExchange: 'Coinbase', sellExchange: 'Binance', buyPrice: 145.2, sellPrice: 148.1, spread: 1.99, profitPotential: 2.9, timestamp: Date.now() },
  { id: '4', pair: 'XRP/USDT', buyExchange: 'Bybit', sellExchange: 'KuCoin', buyPrice: 0.61, sellPrice: 0.63, spread: 3.2, profitPotential: 0.02, timestamp: Date.now() },
];
