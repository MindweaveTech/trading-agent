/**
 * Trading Signals API
 * Generates and returns trading signals based on strategies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp-client';
import { TradingStrategy } from '@/lib/strategies';
import { getRiskManager } from '@/lib/ai-models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');
    const symbols = symbolsParam
      ? symbolsParam.split(',').map((s) => s.trim().toUpperCase())
      : DEFAULT_SYMBOLS;

    // Fetch market data
    const client = getMCPClient();
    const quotes = await client.getQuotes(symbols);

    // Calculate technical indicators (simplified for demo)
    const marketData = quotes.map((quote) => ({
      symbol: quote.symbol,
      price: quote.lastPrice,
      volume: quote.volume,
      rsi: 45 + Math.random() * 30, // Placeholder - would calculate from historical data
      sma20: quote.lastPrice * (0.98 + Math.random() * 0.04),
      sma50: quote.lastPrice * (0.96 + Math.random() * 0.08),
    }));

    // Generate signals
    const riskManager = getRiskManager();
    const strategy = new TradingStrategy(riskManager);
    const signals = await strategy.generateSignals(marketData);

    return NextResponse.json({
      success: true,
      signals,
      timestamp: new Date().toISOString(),
      count: signals.length,
    });
  } catch (error) {
    console.error('Signals API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate signals',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
