/**
 * Daily Report Cron Job
 * Runs at end of day (4 PM IST)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPaperTrader } from '@/lib/paper-trader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('Daily report cron started');

    const paperTrader = getPaperTrader();
    const portfolio = await paperTrader.getPortfolio();
    const metrics = await paperTrader.calculateMetrics();

    // Generate report
    const report = {
      date: new Date().toISOString().split('T')[0],
      summary: {
        totalPnL: metrics.totalPnL,
        winRate: metrics.winRate,
        totalTrades: metrics.totalTrades,
        openPositions: metrics.openPositions,
      },
      positions: portfolio.positions.filter((p) => p.status === 'OPEN'),
      recentTrades: portfolio.trades.slice(-10),
    };

    // Send email if configured
    if (process.env.ADMIN_EMAIL && process.env.SEND_REPORTS === 'true') {
      await sendDailyEmail(report);
    }

    console.log('Daily report completed');

    return NextResponse.json({
      success: true,
      message: 'Daily report generated',
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json(
      {
        error: 'Daily report failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

async function sendDailyEmail(report: any): Promise<void> {
  // Implement email sending with report summary
  console.log('Daily email would be sent with:', report.summary);
}
