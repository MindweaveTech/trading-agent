/**
 * Risk Analysis API
 * Provides risk metrics and anomaly detection
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRiskManager } from '@/lib/ai-models';
import { getPaperTrader } from '@/lib/paper-trader';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const riskManager = getRiskManager();
    const paperTrader = getPaperTrader();

    // Get portfolio metrics
    const metrics = await paperTrader.calculateMetrics();
    const portfolio = await paperTrader.getPortfolio();

    // Calculate risk scores
    const portfolioValue =
      portfolio.capital +
      portfolio.positions
        .filter((p) => p.status === 'OPEN')
        .reduce((sum, p) => sum + p.currentPrice * p.quantity, 0);

    const riskScore = Math.abs(metrics.totalPnL / portfolioValue);

    return NextResponse.json({
      success: true,
      risk: {
        score: riskScore,
        level: riskScore < 0.02 ? 'LOW' : riskScore < 0.05 ? 'MEDIUM' : 'HIGH',
        metrics: {
          totalPnL: metrics.totalPnL,
          winRate: metrics.winRate,
          openPositions: metrics.openPositions,
          portfolioValue,
        },
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Risk API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to calculate risk',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
