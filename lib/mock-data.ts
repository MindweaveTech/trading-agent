/**
 * Mock Market Data
 * Provides realistic sample data for local development and testing
 * Used when Zerodha MCP authentication is not available
 */

import { Quote } from './mcp-client';

/**
 * Generate mock real-time quotes for given symbols
 */
export function generateMockQuotes(symbols: string[]): Quote[] {
  const baseData: Record<string, { basePrice: number; volatility: number }> = {
    RELIANCE: { basePrice: 2450, volatility: 20 },
    TCS: { basePrice: 3580, volatility: 30 },
    INFY: { basePrice: 1520, volatility: 15 },
    HDFC: { basePrice: 1650, volatility: 18 },
    HDFCBANK: { basePrice: 1590, volatility: 22 },
    SBIN: { basePrice: 605, volatility: 12 },
    ICICIBANK: { basePrice: 975, volatility: 15 },
    WIPRO: { basePrice: 465, volatility: 8 },
    ITC: { basePrice: 445, volatility: 7 },
    BAJFINANCE: { basePrice: 6850, volatility: 80 },
    HCLTECH: { basePrice: 1285, volatility: 20 },
    TECHM: { basePrice: 1165, volatility: 18 },
    TATAMOTORS: { basePrice: 785, volatility: 25 },
    TITAN: { basePrice: 3280, volatility: 40 },
    ASIANPAINT: { basePrice: 2890, volatility: 35 },
  };

  return symbols.map((symbol) => {
    const data = baseData[symbol] || { basePrice: 1000, volatility: 10 };

    // Generate realistic price movement
    const randomChange = (Math.random() - 0.5) * data.volatility;
    const lastPrice = data.basePrice + randomChange;
    const change = randomChange;
    const changePercent = (change / data.basePrice) * 100;

    // Generate realistic volume
    const baseVolume = Math.floor(Math.random() * 1000000) + 500000;

    return {
      symbol,
      lastPrice: parseFloat(lastPrice.toFixed(2)),
      volume: baseVolume,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      timestamp: new Date(),
    };
  });
}

/**
 * Generate mock historical data for a symbol
 */
export function generateMockHistoricalData(
  symbol: string,
  interval: string,
  fromDate: Date,
  toDate: Date
): any[] {
  const data: any[] = [];
  const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));

  // Base price for the symbol
  const basePrice = 2000 + Math.random() * 1000;

  for (let i = 0; i < Math.min(daysDiff, 100); i++) {
    const date = new Date(fromDate.getTime() + i * 24 * 60 * 60 * 1000);
    const open = basePrice + (Math.random() - 0.5) * 100;
    const close = open + (Math.random() - 0.5) * 50;
    const high = Math.max(open, close) + Math.random() * 20;
    const low = Math.min(open, close) - Math.random() * 20;
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      date: date.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
    });
  }

  return data;
}

/**
 * Mock trading positions for testing
 */
export const mockPositions = [
  {
    id: '1',
    symbol: 'RELIANCE',
    quantity: 10,
    entryPrice: 2420.50,
    currentPrice: 2450.75,
    pnl: 302.50,
    pnlPercent: 1.25,
    strategy: 'mean_reversion',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: 'OPEN',
    stopLoss: 2380,
    targetPrice: 2550,
  },
  {
    id: '2',
    symbol: 'TCS',
    quantity: 5,
    entryPrice: 3600.00,
    currentPrice: 3580.00,
    pnl: -100.00,
    pnlPercent: -0.56,
    strategy: 'momentum',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: 'OPEN',
    stopLoss: 3520,
    targetPrice: 3720,
  },
];

/**
 * Mock closed trades for history
 */
export const mockClosedTrades = [
  {
    id: '101',
    symbol: 'INFY',
    quantity: 15,
    entryPrice: 1500.00,
    exitPrice: 1525.00,
    pnl: 375.00,
    pnlPercent: 1.67,
    strategy: 'mean_reversion',
    entryTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    exitTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    status: 'CLOSED',
    result: 'WIN',
  },
  {
    id: '102',
    symbol: 'HDFC',
    quantity: 20,
    entryPrice: 1680.00,
    exitPrice: 1650.00,
    pnl: -600.00,
    pnlPercent: -1.79,
    strategy: 'momentum',
    entryTime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    exitTime: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    status: 'CLOSED',
    result: 'LOSS',
  },
  {
    id: '103',
    symbol: 'SBIN',
    quantity: 50,
    entryPrice: 590.00,
    exitPrice: 608.00,
    pnl: 900.00,
    pnlPercent: 3.05,
    strategy: 'mean_reversion',
    entryTime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    exitTime: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    status: 'CLOSED',
    result: 'WIN',
  },
];

/**
 * Check if we're in mock mode (no authentication available)
 */
export function isMockMode(): boolean {
  return (
    process.env.NODE_ENV === 'development' &&
    !process.env.KITE_API_KEY &&
    !process.env.KITE_ACCESS_TOKEN
  );
}

/**
 * Log mock data usage
 */
export function logMockUsage(feature: string): void {
  if (isMockMode()) {
    console.log(`[MOCK DATA] Using mock data for: ${feature}`);
  }
}
