
/**
 * Simulated CEX API Service
 * Mocking a high-frequency trading API for multi-leg arbitrage execution.
 */

export interface TradeLegResult {
  exchange: string;
  orderId: string;
  status: 'filled' | 'failed';
  executionPrice: number;
  fee: number;
}

export interface ArbExecutionResponse {
  success: boolean;
  txId: string;
  buyLeg: TradeLegResult;
  sellLeg: TradeLegResult;
  netProfit: number;
  message: string;
}

class MockCexApi {
  private generateId() {
    return Math.random().toString(36).substring(2, 15);
  }

  /**
   * Fetches global average prices from CoinGecko.
   * Comparing this to Binance allows for "Real" arbitrage detection.
   */
  async getGlobalAveragePrices(symbols: string[]): Promise<Record<string, number>> {
    try {
      const ids: Record<string, string> = {
        'BTC': 'bitcoin',
        'ETH': 'ethereum',
        'SOL': 'solana',
        'BNB': 'binancecoin',
        'XRP': 'ripple',
        'ADA': 'cardano'
      };
      
      const targetIds = symbols.map(s => ids[s]).filter(Boolean).join(',');
      const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${targetIds}&vs_currencies=usd`);
      if (!response.ok) throw new Error('Global feed unavailable');
      const data = await response.json();
      
      const prices: Record<string, number> = {};
      Object.entries(ids).forEach(([symbol, id]) => {
        if (data[id]) {
          prices[symbol] = data[id].usd;
        }
      });
      return prices;
    } catch (error) {
      console.warn('[Nexus Neural Uplink] Global fallback active:', error);
      return {};
    }
  }

  /**
   * Fetches real-time prices and 24h stats from public Binance API.
   * Includes volume for liquidity analysis.
   */
  async getLivePrices(symbols: string[]): Promise<Record<string, { price: number, volChange: number }>> {
    try {
      // Fetch 24hr ticker data for more context (price + volume change)
      const response = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      if (!response.ok) throw new Error('Market feed unavailable');
      const data = await response.json();
      
      const stats: Record<string, { price: number, volChange: number }> = {};
      symbols.forEach(s => {
        const pairing = `${s}USDT`;
        const ticker = data.find((t: any) => t.symbol === pairing);
        if (ticker) {
          stats[s] = {
            price: parseFloat(ticker.lastPrice),
            volChange: parseFloat(ticker.priceChangePercent)
          };
        }
      });
      return stats;
    } catch (error) {
      console.warn('[Nexus Neural Uplink] Falling back to simulated prices:', error);
      return {};
    }
  }

  /**
   * Simulates executing a two-leg arbitrage order.
   * In reality, this would involve concurrent API calls to two different exchanges.
   */
  async executeArbitrageOrder(
    pair: string,
    buyEx: string,
    sellEx: string,
    buyPrice: number,
    sellPrice: number,
    volume: number
  ): Promise<ArbExecutionResponse> {
    // 1. Simulate Network Latency
    const latency = Math.floor(Math.random() * 800) + 400;
    await new Promise(resolve => setTimeout(resolve, latency));

    // 2. Chance of Execution Failure (e.g., Price Slippage or API Timeout)
    const failureChance = Math.random();
    if (failureChance > 0.95) {
      return {
        success: false,
        txId: this.generateId(),
        buyLeg: { exchange: buyEx, orderId: '', status: 'failed', executionPrice: 0, fee: 0 },
        sellLeg: { exchange: sellEx, orderId: '', status: 'failed', executionPrice: 0, fee: 0 },
        netProfit: 0,
        message: 'API Timeout: Sell leg execution failed due to exchange latency.'
      };
    }

    // 3. Simulate minor slippage (0.01% - 0.05%)
    const slippage = 1 - (Math.random() * 0.0005);
    const effectiveBuyPrice = buyPrice * (1 + (1 - slippage));
    const effectiveSellPrice = sellPrice * slippage;

    // 4. Calculate Fees (Simulating standard 0.1% spot fee)
    const buyFee = (volume * effectiveBuyPrice) * 0.001;
    const sellFee = (volume * effectiveSellPrice) * 0.001;
    
    const grossProfit = (effectiveSellPrice - effectiveBuyPrice) * volume;
    const netProfit = grossProfit - (buyFee + sellFee);

    return {
      success: true,
      txId: `NEX-${this.generateId().toUpperCase()}`,
      buyLeg: {
        exchange: buyEx,
        orderId: `ORD-${this.generateId().toUpperCase()}`,
        status: 'filled',
        executionPrice: effectiveBuyPrice,
        fee: buyFee
      },
      sellLeg: {
        exchange: sellEx,
        orderId: `ORD-${this.generateId().toUpperCase()}`,
        status: 'filled',
        executionPrice: effectiveSellPrice,
        fee: sellFee
      },
      netProfit: netProfit,
      message: 'Arbitrage strategy executed successfully across both legs.'
    };
  }
}

export const cexApi = new MockCexApi();
