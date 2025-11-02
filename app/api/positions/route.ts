/**
 * Positions API
 * Manages trading positions (open, close, list)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaperTrader } from '@/lib/paper-trader';
import { getMCPClient } from '@/lib/mcp-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/positions
 * Returns all positions (open and closed)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status'); // 'OPEN', 'CLOSED', or null (all)

    const paperTrader = getPaperTrader();
    const portfolio = await paperTrader.getPortfolio();

    // Filter positions by status if specified
    let positions = portfolio.positions;
    if (status) {
      positions = positions.filter(p => p.status === status.toUpperCase());
    }

    // Get current prices for open positions
    if (status === 'OPEN' || !status) {
      const openPositions = positions.filter(p => p.status === 'OPEN');
      if (openPositions.length > 0) {
        const symbols = Array.from(new Set(openPositions.map(p => p.symbol)));
        const mcpClient = getMCPClient();

        try {
          const quotes = await mcpClient.getQuotes(symbols);
          const priceMap = new Map(quotes.map(q => [q.symbol, q.lastPrice]));

          // Update current prices
          positions = positions.map(p => {
            if (p.status === 'OPEN' && priceMap.has(p.symbol)) {
              const currentPrice = priceMap.get(p.symbol)!;
              const pnl = (currentPrice - p.entryPrice) * p.quantity * (p.type === 'LONG' ? 1 : -1);
              const pnlPercent = (pnl / (p.entryPrice * p.quantity)) * 100;

              return {
                ...p,
                currentPrice,
                pnl: parseFloat(pnl.toFixed(2)),
                pnlPercent: parseFloat(pnlPercent.toFixed(2)),
              };
            }
            return p;
          });
        } catch (error) {
          console.error('Failed to fetch current prices:', error);
          // Continue with existing prices
        }
      }
    }

    return NextResponse.json({
      success: true,
      positions,
      count: positions.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Positions API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch positions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/positions
 * Opens a new position
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, type, quantity, currentPrice, stopLoss, targetPrice } = body;

    // Validate required fields
    if (!symbol || !type || !quantity || !currentPrice) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, type, quantity, currentPrice' },
        { status: 400 }
      );
    }

    if (!['LONG', 'SHORT'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be LONG or SHORT' },
        { status: 400 }
      );
    }

    const paperTrader = getPaperTrader();
    const portfolio = await paperTrader.getPortfolio();

    // Check if we have sufficient capital
    const positionValue = currentPrice * quantity;
    if (positionValue > portfolio.capital) {
      return NextResponse.json(
        { error: 'Insufficient capital for this position' },
        { status: 400 }
      );
    }

    // Create new position
    const position = {
      id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      symbol: symbol.toUpperCase(),
      type,
      entryPrice: currentPrice,
      currentPrice,
      quantity,
      entryTime: new Date(),
      stopLoss: stopLoss || currentPrice * (type === 'LONG' ? 0.97 : 1.03),
      targetPrice: targetPrice || currentPrice * (type === 'LONG' ? 1.05 : 0.95),
      pnl: 0,
      pnlPercent: 0,
      status: 'OPEN' as const,
    };

    // Update portfolio
    portfolio.positions.push(position);
    portfolio.capital -= positionValue;
    portfolio.lastUpdated = new Date();

    // Save to KV
    await paperTrader.updatePortfolio(portfolio);

    return NextResponse.json({
      success: true,
      position,
      message: `Opened ${type} position for ${symbol}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Open position error:', error);
    return NextResponse.json(
      {
        error: 'Failed to open position',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
