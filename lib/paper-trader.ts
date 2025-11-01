/**
 * Paper Trading System
 * Simulates trades without real capital
 */

import { kv } from '@vercel/kv';
import { TradingSignal } from './strategies';

export interface Position {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  currentPrice: number;
  quantity: number;
  entryTime: Date;
  stopLoss: number;
  targetPrice: number;
  pnl: number;
  pnlPercent: number;
  status: 'OPEN' | 'CLOSED';
}

export interface Trade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  timestamp: Date;
  positionId?: string;
}

export interface Portfolio {
  capital: number;
  positions: Position[];
  trades: Trade[];
  totalPnL: number;
  winRate: number;
  lastUpdated: Date;
}

export class PaperTrader {
  private initialCapital: number;

  constructor(initialCapital: number = 100000) {
    this.initialCapital = initialCapital;
  }

  /**
   * Initialize portfolio
   */
  async initializePortfolio(): Promise<Portfolio> {
    const portfolio: Portfolio = {
      capital: this.initialCapital,
      positions: [],
      trades: [],
      totalPnL: 0,
      winRate: 0,
      lastUpdated: new Date(),
    };

    await kv.set('portfolio', portfolio);
    return portfolio;
  }

  /**
   * Get current portfolio
   */
  async getPortfolio(): Promise<Portfolio> {
    const portfolio = await kv.get<Portfolio>('portfolio');
    if (!portfolio) {
      return this.initializePortfolio();
    }
    return portfolio;
  }

  /**
   * Execute trade based on signal
   */
  async executeTrade(
    signal: TradingSignal,
    currentPrice: number
  ): Promise<Trade | null> {
    const portfolio = await this.getPortfolio();

    // Skip HOLD signals
    if (signal.action === 'HOLD') {
      return null;
    }

    // Calculate position size (10% of capital)
    const positionValue = portfolio.capital * 0.1;
    const quantity = Math.floor(positionValue / currentPrice);

    if (quantity === 0) {
      console.warn('Insufficient capital for trade');
      return null;
    }

    const trade: Trade = {
      id: this.generateId(),
      symbol: signal.symbol,
      type: signal.action,
      price: currentPrice,
      quantity,
      timestamp: new Date(),
    };

    if (signal.action === 'BUY') {
      const position = await this.openPosition(signal, currentPrice, quantity);
      trade.positionId = position.id;
    } else if (signal.action === 'SELL') {
      await this.closePosition(signal.symbol, currentPrice);
    }

    portfolio.trades.push(trade);
    portfolio.lastUpdated = new Date();
    await kv.set('portfolio', portfolio);

    return trade;
  }

  /**
   * Open new position
   */
  private async openPosition(
    signal: TradingSignal,
    price: number,
    quantity: number
  ): Promise<Position> {
    const portfolio = await this.getPortfolio();

    const position: Position = {
      id: this.generateId(),
      symbol: signal.symbol,
      type: 'LONG',
      entryPrice: price,
      currentPrice: price,
      quantity,
      entryTime: new Date(),
      stopLoss: signal.stopLoss || price * 0.95,
      targetPrice: signal.targetPrice || price * 1.05,
      pnl: 0,
      pnlPercent: 0,
      status: 'OPEN',
    };

    portfolio.positions.push(position);
    portfolio.capital -= price * quantity;
    await kv.set('portfolio', portfolio);

    return position;
  }

  /**
   * Close position
   */
  private async closePosition(
    symbol: string,
    currentPrice: number
  ): Promise<void> {
    const portfolio = await this.getPortfolio();

    const positionIndex = portfolio.positions.findIndex(
      (p) => p.symbol === symbol && p.status === 'OPEN'
    );

    if (positionIndex === -1) {
      console.warn(`No open position found for ${symbol}`);
      return;
    }

    const position = portfolio.positions[positionIndex];
    position.status = 'CLOSED';
    position.currentPrice = currentPrice;

    const exitValue = currentPrice * position.quantity;
    const entryValue = position.entryPrice * position.quantity;
    position.pnl = exitValue - entryValue;
    position.pnlPercent = (position.pnl / entryValue) * 100;

    portfolio.capital += exitValue;
    portfolio.totalPnL += position.pnl;

    await kv.set('portfolio', portfolio);
  }

  /**
   * Update position prices
   */
  async updatePositions(quotes: Record<string, number>): Promise<void> {
    const portfolio = await this.getPortfolio();
    let updated = false;

    for (const position of portfolio.positions) {
      if (position.status === 'OPEN' && quotes[position.symbol]) {
        position.currentPrice = quotes[position.symbol];

        const currentValue = position.currentPrice * position.quantity;
        const entryValue = position.entryPrice * position.quantity;
        position.pnl = currentValue - entryValue;
        position.pnlPercent = (position.pnl / entryValue) * 100;

        // Check stop loss
        if (position.currentPrice <= position.stopLoss) {
          await this.closePosition(position.symbol, position.currentPrice);
        }

        // Check target price
        if (position.currentPrice >= position.targetPrice) {
          await this.closePosition(position.symbol, position.currentPrice);
        }

        updated = true;
      }
    }

    if (updated) {
      portfolio.lastUpdated = new Date();
      await kv.set('portfolio', portfolio);
    }
  }

  /**
   * Calculate performance metrics
   */
  async calculateMetrics(): Promise<{
    totalPnL: number;
    winRate: number;
    totalTrades: number;
    openPositions: number;
  }> {
    const portfolio = await this.getPortfolio();

    const closedPositions = portfolio.positions.filter(
      (p) => p.status === 'CLOSED'
    );
    const winningTrades = closedPositions.filter((p) => p.pnl > 0).length;

    return {
      totalPnL: portfolio.totalPnL,
      winRate:
        closedPositions.length > 0
          ? (winningTrades / closedPositions.length) * 100
          : 0,
      totalTrades: portfolio.trades.length,
      openPositions: portfolio.positions.filter((p) => p.status === 'OPEN')
        .length,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
let paperTrader: PaperTrader | null = null;

export function getPaperTrader(): PaperTrader {
  if (!paperTrader) {
    const capital = Number(process.env.PAPER_CAPITAL) || 100000;
    paperTrader = new PaperTrader(capital);
  }
  return paperTrader;
}
