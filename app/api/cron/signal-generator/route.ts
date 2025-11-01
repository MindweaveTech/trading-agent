/**
 * Signal Generator Cron Job
 * Runs every 15 minutes during market hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp-client';
import { TradingStrategy } from '@/lib/strategies';
import { getRiskManager } from '@/lib/ai-models';
import { getPaperTrader } from '@/lib/paper-trader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TRADING_SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

export async function GET(request: NextRequest) {
  try {
    console.log('Signal generator cron started');

    // Fetch market data
    const client = getMCPClient();
    const quotes = await client.getQuotes(TRADING_SYMBOLS);

    // Calculate technical indicators
    const marketData = quotes.map((quote) => ({
      symbol: quote.symbol,
      price: quote.lastPrice,
      volume: quote.volume,
      rsi: 45 + Math.random() * 30, // Would use historical data in production
      sma20: quote.lastPrice * (0.98 + Math.random() * 0.04),
      sma50: quote.lastPrice * (0.96 + Math.random() * 0.08),
    }));

    // Generate signals
    const riskManager = getRiskManager();
    const strategy = new TradingStrategy(riskManager);
    const signals = await strategy.generateSignals(marketData);

    // Execute approved signals
    const paperTrader = getPaperTrader();
    const executedTrades = [];

    for (const signal of signals) {
      const currentPrice = quotes.find((q) => q.symbol === signal.symbol)
        ?.lastPrice;

      if (currentPrice) {
        const trade = await paperTrader.executeTrade(signal, currentPrice);
        if (trade) {
          executedTrades.push(trade);
        }
      }
    }

    console.log(
      `Signal generator completed: ${signals.length} signals, ${executedTrades.length} trades executed`
    );

    return NextResponse.json({
      success: true,
      message: 'Signal generator completed',
      signalsGenerated: signals.length,
      tradesExecuted: executedTrades.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Signal generator error:', error);
    return NextResponse.json(
      {
        error: 'Signal generator failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
