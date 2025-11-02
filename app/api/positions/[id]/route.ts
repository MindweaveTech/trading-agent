/**
 * Position Management API
 * Close or update specific position
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaperTrader } from '@/lib/paper-trader';
import { getMCPClient } from '@/lib/mcp-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * PUT /api/positions/[id]
 * Close a position
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, currentPrice } = body;

    if (action !== 'close') {
      return NextResponse.json(
        { error: 'Invalid action. Only "close" is supported' },
        { status: 400 }
      );
    }

    const paperTrader = getPaperTrader();
    const portfolio = await paperTrader.getPortfolio();

    // Find the position
    const positionIndex = portfolio.positions.findIndex(
      p => p.id === id && p.status === 'OPEN'
    );

    if (positionIndex === -1) {
      return NextResponse.json(
        { error: 'Position not found or already closed' },
        { status: 404 }
      );
    }

    const position = portfolio.positions[positionIndex];

    // Get current price if not provided
    let exitPrice = currentPrice;
    if (!exitPrice) {
      const mcpClient = getMCPClient();
      try {
        const quotes = await mcpClient.getQuotes([position.symbol]);
        exitPrice = quotes[0]?.lastPrice || position.currentPrice;
      } catch (error) {
        console.error('Failed to fetch current price:', error);
        exitPrice = position.currentPrice; // Use last known price
      }
    }

    // Calculate P&L
    const exitValue = exitPrice * position.quantity;
    const entryValue = position.entryPrice * position.quantity;
    const pnl = (exitPrice - position.entryPrice) * position.quantity * (position.type === 'LONG' ? 1 : -1);
    const pnlPercent = (pnl / entryValue) * 100;

    // Close the position
    position.status = 'CLOSED';
    position.currentPrice = exitPrice;
    position.pnl = parseFloat(pnl.toFixed(2));
    position.pnlPercent = parseFloat(pnlPercent.toFixed(2));

    // Update portfolio
    portfolio.capital += exitValue;
    portfolio.totalPnL += position.pnl;

    // Save to KV
    await paperTrader.updatePortfolio(portfolio);

    return NextResponse.json({
      success: true,
      position,
      message: `Closed ${position.type} position for ${position.symbol}`,
      pnl: position.pnl,
      pnlPercent: position.pnlPercent,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Close position error:', error);
    return NextResponse.json(
      {
        error: 'Failed to close position',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/positions/[id]
 * Delete a position (for testing/admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const paperTrader = getPaperTrader();
    const portfolio = await paperTrader.getPortfolio();

    const positionIndex = portfolio.positions.findIndex(p => p.id === id);

    if (positionIndex === -1) {
      return NextResponse.json(
        { error: 'Position not found' },
        { status: 404 }
      );
    }

    // Remove position
    const deletedPosition = portfolio.positions.splice(positionIndex, 1)[0];

    // Save to KV
    await paperTrader.updatePortfolio(portfolio);

    return NextResponse.json({
      success: true,
      message: `Deleted position ${id}`,
      position: deletedPosition,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Delete position error:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete position',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
