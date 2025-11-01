/**
 * Market Monitor Cron Job
 * Runs every 5 minutes during market hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp-client';
import { getPaperTrader } from '@/lib/paper-trader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MONITORED_SYMBOLS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'];

export async function GET(request: NextRequest) {
  try {
    console.log('Market monitor cron started');

    // Fetch latest quotes
    const client = getMCPClient();
    const quotes = await client.getQuotes(MONITORED_SYMBOLS);

    // Update paper trading positions
    const paperTrader = getPaperTrader();
    const quotesMap = quotes.reduce(
      (acc, q) => {
        acc[q.symbol] = q.lastPrice;
        return acc;
      },
      {} as Record<string, number>
    );

    await paperTrader.updatePositions(quotesMap);

    console.log('Market monitor completed');

    return NextResponse.json({
      success: true,
      message: 'Market monitor completed',
      quotes: quotes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Market monitor error:', error);
    return NextResponse.json(
      {
        error: 'Market monitor failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
