/**
 * Backtesting Engine
 * Simulates trading strategies on historical data to evaluate performance
 */

import { getMCPClient } from './mcp-client';
import { TradingStrategy, TradingSignal, MarketData } from './strategies';
import { getRiskManager } from './ai-models';
import { calculateRSI, calculateSMA, calculateAllIndicators } from './indicators';
import logger from './logger';

export interface BacktestConfig {
  symbols: string[];
  strategy: 'mean_reversion' | 'momentum' | 'both';
  startDate: Date;
  endDate: Date;
  initialCapital: number;
  positionSize: number; // percentage of capital per trade (e.g., 10 = 10%)
  commission?: number; // percentage (e.g., 0.1 = 0.1%)
  slippage?: number; // percentage (e.g., 0.05 = 0.05%)
}

export interface BacktestTrade {
  id: string;
  date: Date;
  symbol: string;
  action: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  commission: number;
  pnl?: number;
  pnlPercent?: number;
  reason?: string;
}

export interface BacktestSignal {
  date: Date;
  symbol: string;
  signal: TradingSignal;
  executed: boolean;
  reason?: string;
}

export interface BacktestResult {
  config: BacktestConfig;
  summary: {
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    winRate: number;
    totalPnL: number;
    returnPercent: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    sharpeRatio: number;
    profitFactor: number;
    averageWin: number;
    averageLoss: number;
    largestWin: number;
    largestLoss: number;
    finalCapital: number;
  };
  trades: BacktestTrade[];
  equity: Array<{
    date: Date;
    value: number;
    drawdown: number;
  }>;
  signals: BacktestSignal[];
  dailyReturns: number[];
}

interface Position {
  symbol: string;
  quantity: number;
  entryPrice: number;
  entryDate: Date;
  entryId: string;
}

export class Backtester {
  private config: BacktestConfig;
  private client = getMCPClient();
  private strategy: TradingStrategy;
  private riskManager: any;

  constructor(config: BacktestConfig) {
    this.config = {
      commission: 0.1, // Default 0.1%
      slippage: 0.05, // Default 0.05%
      ...config,
    };
    this.riskManager = getRiskManager();
    this.strategy = new TradingStrategy(this.riskManager);
  }

  /**
   * Run backtest simulation
   */
  async run(): Promise<BacktestResult> {
    logger.info('Starting backtest', {
      symbols: this.config.symbols,
      strategy: this.config.strategy,
      startDate: this.config.startDate.toISOString(),
      endDate: this.config.endDate.toISOString(),
    });

    // 1. Fetch historical data for all symbols
    const historicalData = await this.fetchHistoricalData();

    // 2. Run day-by-day simulation
    const simulationResult = await this.simulateTrading(historicalData);

    // 3. Calculate performance metrics
    const summary = this.calculateMetrics(simulationResult);

    logger.info('Backtest completed', {
      totalTrades: summary.totalTrades,
      winRate: summary.winRate,
      totalPnL: summary.totalPnL,
    });

    return {
      config: this.config,
      summary,
      trades: simulationResult.trades,
      equity: simulationResult.equity,
      signals: simulationResult.signals,
      dailyReturns: simulationResult.dailyReturns,
    };
  }

  /**
   * Fetch historical data for all symbols
   */
  private async fetchHistoricalData(): Promise<Map<string, any[]>> {
    const dataMap = new Map<string, any[]>();

    for (const symbol of this.config.symbols) {
      try {
        const data = await this.client.getHistoricalData(
          symbol,
          'day',
          this.config.startDate,
          this.config.endDate
        );
        dataMap.set(symbol, data);
      } catch (error) {
        logger.error('Failed to fetch historical data', { symbol, error });
        throw error;
      }
    }

    return dataMap;
  }

  /**
   * Simulate trading day by day
   */
  private async simulateTrading(
    historicalData: Map<string, any[]>
  ): Promise<{
    trades: BacktestTrade[];
    equity: Array<{ date: Date; value: number; drawdown: number }>;
    signals: BacktestSignal[];
    dailyReturns: number[];
  }> {
    const trades: BacktestTrade[] = [];
    const equity: Array<{ date: Date; value: number; drawdown: number }> = [];
    const signals: BacktestSignal[] = [];
    const dailyReturns: number[] = [];

    let capital = this.config.initialCapital;
    const openPositions: Map<string, Position> = new Map();
    let peakCapital = capital;

    // Get all unique dates across all symbols
    const allDates = this.getAllTradingDates(historicalData);

    for (const date of allDates) {
      const dayStartCapital = capital;

      // Generate market data for this date
      const marketDataForDay: MarketData[] = [];

      for (const symbol of this.config.symbols) {
        const symbolData = historicalData.get(symbol);
        if (!symbolData) continue;

        // Find data for this specific date
        const dataPoint = symbolData.find(
          (d) => new Date(d.date).toDateString() === date.toDateString()
        );
        if (!dataPoint) continue;

        // Get historical prices up to this date for indicator calculation
        const pricesUpToDate = symbolData
          .filter((d) => new Date(d.date) <= date)
          .map((d) => d.close);

        if (pricesUpToDate.length < 20) continue; // Need minimum data for indicators

        // Calculate technical indicators
        const rsi = calculateRSI(pricesUpToDate, 14);
        const sma20 = calculateSMA(pricesUpToDate, 20);
        const sma50 = calculateSMA(pricesUpToDate, 50);

        marketDataForDay.push({
          symbol,
          price: dataPoint.close,
          volume: dataPoint.volume,
          rsi,
          sma20,
          sma50,
        });
      }

      // Generate signals for this day
      const daySignals = await this.strategy.generateSignals(marketDataForDay);

      // Process signals
      for (const signal of daySignals) {
        const signalRecord: BacktestSignal = {
          date,
          symbol: signal.symbol,
          signal,
          executed: false,
        };

        // Check if we can execute this signal
        const canExecute = this.canExecuteSignal(signal, capital, openPositions);

        if (canExecute.can) {
          // Execute trade
          const trade = this.executeTrade(
            signal,
            date,
            capital,
            openPositions,
            trades
          );

          if (trade) {
            trades.push(trade);
            signalRecord.executed = true;

            // Update capital based on trade
            if (trade.action === 'BUY') {
              capital -= trade.price * trade.quantity + trade.commission;
            } else if (trade.action === 'SELL' && trade.pnl !== undefined) {
              capital += trade.price * trade.quantity - trade.commission + trade.pnl;
            }
          }
        } else {
          signalRecord.reason = canExecute.reason;
        }

        signals.push(signalRecord);
      }

      // Update open positions with current market prices
      for (const [symbol, position] of openPositions.entries()) {
        const marketData = marketDataForDay.find((md) => md.symbol === symbol);
        if (marketData) {
          // Position value updated (for equity curve calculation)
          const positionValue = position.quantity * marketData.price;
          capital += positionValue - position.quantity * position.entryPrice;
        }
      }

      // Track equity curve
      peakCapital = Math.max(peakCapital, capital);
      const drawdown = peakCapital - capital;

      equity.push({
        date,
        value: capital,
        drawdown,
      });

      // Calculate daily return
      const dailyReturn = ((capital - dayStartCapital) / dayStartCapital) * 100;
      dailyReturns.push(dailyReturn);
    }

    return { trades, equity, signals, dailyReturns };
  }

  /**
   * Get all unique trading dates across all symbols
   */
  private getAllTradingDates(historicalData: Map<string, any[]>): Date[] {
    const datesSet = new Set<string>();

    for (const data of historicalData.values()) {
      for (const point of data) {
        datesSet.add(new Date(point.date).toDateString());
      }
    }

    return Array.from(datesSet)
      .map((dateStr) => new Date(dateStr))
      .sort((a, b) => a.getTime() - b.getTime());
  }

  /**
   * Check if we can execute a signal
   */
  private canExecuteSignal(
    signal: TradingSignal,
    capital: number,
    openPositions: Map<string, Position>
  ): { can: boolean; reason?: string } {
    if (signal.action === 'HOLD') {
      return { can: false, reason: 'HOLD signal' };
    }

    if (signal.action === 'BUY') {
      // Check if we already have a position
      if (openPositions.has(signal.symbol)) {
        return { can: false, reason: 'Already have position' };
      }

      // Check if we have enough capital
      const positionValue = (capital * this.config.positionSize) / 100;
      if (positionValue > capital) {
        return { can: false, reason: 'Insufficient capital' };
      }

      return { can: true };
    }

    if (signal.action === 'SELL') {
      // Check if we have a position to sell
      if (!openPositions.has(signal.symbol)) {
        return { can: false, reason: 'No position to sell' };
      }

      return { can: true };
    }

    return { can: false, reason: 'Invalid action' };
  }

  /**
   * Execute a trade
   */
  private executeTrade(
    signal: TradingSignal,
    date: Date,
    capital: number,
    openPositions: Map<string, Position>,
    existingTrades: BacktestTrade[]
  ): BacktestTrade | null {
    const tradeId = `${signal.symbol}-${date.getTime()}`;

    if (signal.action === 'BUY') {
      // Calculate position size
      const positionValue = (capital * this.config.positionSize) / 100;
      const priceWithSlippage = signal.targetPrice
        ? signal.targetPrice * (1 + (this.config.slippage || 0) / 100)
        : 0;
      const quantity = Math.floor(positionValue / priceWithSlippage);

      if (quantity === 0) {
        return null;
      }

      const commission = (priceWithSlippage * quantity * (this.config.commission || 0)) / 100;

      // Open position
      openPositions.set(signal.symbol, {
        symbol: signal.symbol,
        quantity,
        entryPrice: priceWithSlippage,
        entryDate: date,
        entryId: tradeId,
      });

      return {
        id: tradeId,
        date,
        symbol: signal.symbol,
        action: 'BUY',
        price: priceWithSlippage,
        quantity,
        commission,
        reason: signal.reason,
      };
    }

    if (signal.action === 'SELL') {
      const position = openPositions.get(signal.symbol);
      if (!position) {
        return null;
      }

      const exitPrice = signal.targetPrice
        ? signal.targetPrice * (1 - (this.config.slippage || 0) / 100)
        : 0;
      const commission = (exitPrice * position.quantity * (this.config.commission || 0)) / 100;

      // Calculate P&L
      const pnl = (exitPrice - position.entryPrice) * position.quantity;
      const pnlPercent = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;

      // Close position
      openPositions.delete(signal.symbol);

      return {
        id: `${tradeId}-exit`,
        date,
        symbol: signal.symbol,
        action: 'SELL',
        price: exitPrice,
        quantity: position.quantity,
        commission,
        pnl: pnl - commission * 2, // Subtract entry and exit commissions
        pnlPercent,
        reason: signal.reason,
      };
    }

    return null;
  }

  /**
   * Calculate performance metrics
   */
  private calculateMetrics(simulationResult: {
    trades: BacktestTrade[];
    equity: Array<{ date: Date; value: number; drawdown: number }>;
    dailyReturns: number[];
  }) {
    const { trades, equity, dailyReturns } = simulationResult;

    // Filter only SELL trades (completed trades)
    const completedTrades = trades.filter(
      (t) => t.action === 'SELL' && t.pnl !== undefined
    );

    const winningTrades = completedTrades.filter((t) => (t.pnl || 0) > 0);
    const losingTrades = completedTrades.filter((t) => (t.pnl || 0) < 0);

    const totalPnL = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(
      losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0)
    );

    const finalCapital =
      equity.length > 0 ? equity[equity.length - 1].value : this.config.initialCapital;
    const returnPercent =
      ((finalCapital - this.config.initialCapital) / this.config.initialCapital) * 100;

    // Max drawdown
    const maxDrawdown = Math.max(...equity.map((e) => e.drawdown), 0);
    const maxDrawdownPercent = (maxDrawdown / this.config.initialCapital) * 100;

    // Sharpe ratio (assuming risk-free rate of 0)
    const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const stdDev = Math.sqrt(
      dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
        dailyReturns.length
    );
    const sharpeRatio = stdDev !== 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    return {
      totalTrades: completedTrades.length,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: completedTrades.length > 0
        ? (winningTrades.length / completedTrades.length) * 100
        : 0,
      totalPnL,
      returnPercent,
      maxDrawdown,
      maxDrawdownPercent,
      sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
      profitFactor: grossLoss !== 0 ? grossProfit / grossLoss : 0,
      averageWin:
        winningTrades.length > 0
          ? winningTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / winningTrades.length
          : 0,
      averageLoss:
        losingTrades.length > 0
          ? losingTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) / losingTrades.length
          : 0,
      largestWin: winningTrades.length > 0
        ? Math.max(...winningTrades.map((t) => t.pnl || 0))
        : 0,
      largestLoss: losingTrades.length > 0
        ? Math.min(...losingTrades.map((t) => t.pnl || 0))
        : 0,
      finalCapital,
    };
  }
}
