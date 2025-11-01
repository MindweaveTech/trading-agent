/**
 * Performance Report API
 * Generates comprehensive trading performance reports
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaperTrader } from '@/lib/paper-trader';
import { getRiskManager } from '@/lib/ai-models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const paperTrader = getPaperTrader();
    const portfolio = await paperTrader.getPortfolio();
    const metrics = await paperTrader.calculateMetrics();

    // Calculate portfolio value
    const openPositionsValue = portfolio.positions
      .filter((p) => p.status === 'OPEN')
      .reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);

    const totalValue = portfolio.capital + openPositionsValue;
    const initialCapital = Number(process.env.PAPER_CAPITAL) || 100000;
    const returnPercent = ((totalValue - initialCapital) / initialCapital) * 100;

    // Get recent signals (last 10)
    const recentTrades = portfolio.trades.slice(-10).reverse();

    // Calculate drawdown
    const closedPositions = portfolio.positions.filter(
      (p) => p.status === 'CLOSED'
    );
    const maxDrawdown =
      closedPositions.length > 0
        ? Math.min(...closedPositions.map((p) => p.pnlPercent))
        : 0;

    const report = {
      summary: {
        initialCapital,
        currentValue: totalValue,
        totalPnL: metrics.totalPnL,
        returnPercent: Number(returnPercent.toFixed(2)),
        winRate: Number(metrics.winRate.toFixed(2)),
        totalTrades: metrics.totalTrades,
        openPositions: metrics.openPositions,
        maxDrawdown: Number(maxDrawdown.toFixed(2)),
      },
      positions: {
        open: portfolio.positions.filter((p) => p.status === 'OPEN'),
        closed: closedPositions.slice(-5), // Last 5 closed positions
      },
      recentTrades,
      timestamp: new Date().toISOString(),
    };

    // Send email if configured (implement separately)
    if (process.env.ADMIN_EMAIL && process.env.SEND_REPORTS === 'true') {
      await sendEmailReport(report);
    }

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function sendEmailReport(report: any): Promise<void> {
  // Implement email sending logic here
  // Could use Resend, SendGrid, or other email service
  console.log('Email report would be sent:', report.summary);
}
