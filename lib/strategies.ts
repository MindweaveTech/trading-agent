/**
 * Trading Strategies
 * Implements various trading algorithms and signal generation
 */

export interface MarketData {
  symbol: string;
  price: number;
  volume: number;
  rsi?: number;
  sma20?: number;
  sma50?: number;
  bollinger?: {
    upper: number;
    middle: number;
    lower: number;
  };
}

export interface TradingSignal {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reason: string;
  timestamp: Date;
  targetPrice?: number;
  stopLoss?: number;
}

export class TradingStrategy {
  private riskManager: any;

  constructor(riskManager?: any) {
    this.riskManager = riskManager;
  }

  /**
   * Generate trading signals based on market data
   */
  async generateSignals(marketData: MarketData[]): Promise<TradingSignal[]> {
    const signals: TradingSignal[] = [];

    for (const data of marketData) {
      // Mean reversion strategy
      const meanReversionSignal = this.meanReversionStrategy(data);
      if (meanReversionSignal) {
        signals.push(meanReversionSignal);
      }

      // Momentum strategy
      const momentumSignal = this.momentumStrategy(data);
      if (momentumSignal) {
        signals.push(momentumSignal);
      }
    }

    // Apply risk checks if risk manager is available
    if (this.riskManager) {
      const approvedSignals = await this.riskManager.assessRisk(signals);
      return approvedSignals;
    }

    return signals;
  }

  /**
   * Mean Reversion Strategy
   * Buy when RSI < 30 (oversold), Sell when RSI > 70 (overbought)
   */
  private meanReversionStrategy(data: MarketData): TradingSignal | null {
    if (!data.rsi) return null;

    if (data.rsi < 30) {
      return {
        symbol: data.symbol,
        action: 'BUY',
        confidence: this.calculateConfidence(data.rsi, 30, true),
        reason: `RSI oversold at ${data.rsi.toFixed(2)}`,
        timestamp: new Date(),
        targetPrice: data.price * 1.05,
        stopLoss: data.price * 0.97,
      };
    }

    if (data.rsi > 70) {
      return {
        symbol: data.symbol,
        action: 'SELL',
        confidence: this.calculateConfidence(data.rsi, 70, false),
        reason: `RSI overbought at ${data.rsi.toFixed(2)}`,
        timestamp: new Date(),
        targetPrice: data.price * 0.95,
        stopLoss: data.price * 1.03,
      };
    }

    return null;
  }

  /**
   * Momentum Strategy
   * Buy when price crosses above SMA, Sell when crosses below
   */
  private momentumStrategy(data: MarketData): TradingSignal | null {
    if (!data.sma20 || !data.sma50) return null;

    // Golden cross - SMA20 crosses above SMA50
    if (data.sma20 > data.sma50 && data.price > data.sma20) {
      return {
        symbol: data.symbol,
        action: 'BUY',
        confidence: 0.65,
        reason: 'Golden cross detected',
        timestamp: new Date(),
        targetPrice: data.price * 1.08,
        stopLoss: data.price * 0.95,
      };
    }

    // Death cross - SMA20 crosses below SMA50
    if (data.sma20 < data.sma50 && data.price < data.sma20) {
      return {
        symbol: data.symbol,
        action: 'SELL',
        confidence: 0.65,
        reason: 'Death cross detected',
        timestamp: new Date(),
        targetPrice: data.price * 0.92,
        stopLoss: data.price * 1.05,
      };
    }

    return null;
  }

  /**
   * Calculate confidence score based on indicator distance from threshold
   */
  private calculateConfidence(
    value: number,
    threshold: number,
    below: boolean
  ): number {
    const distance = Math.abs(value - threshold);
    const maxDistance = 20; // Maximum distance for full confidence
    const confidence = Math.min(distance / maxDistance, 1);
    return Number((below ? confidence : confidence).toFixed(2));
  }

  /**
   * Calculate technical indicators
   */
  calculateRSI(prices: number[], period: number = 14): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    const rsi = 100 - 100 / (1 + rs);

    return Number(rsi.toFixed(2));
  }

  calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];

    const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
    return Number((sum / period).toFixed(2));
  }
}
