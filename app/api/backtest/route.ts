/**
 * Backtesting API
 * Runs strategy simulations on historical data
 */

import { NextRequest, NextResponse } from 'next/server';
import { Backtester, BacktestConfig } from '@/lib/backtester';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for backtests

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate and parse config
    const config: BacktestConfig = {
      symbols: body.symbols || ['RELIANCE', 'TCS', 'INFY'],
      strategy: body.strategy || 'both',
      startDate: new Date(body.startDate || Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(body.endDate || Date.now()),
      initialCapital: body.initialCapital || 100000,
      positionSize: body.positionSize || 10,
      commission: body.commission || 0.1,
      slippage: body.slippage || 0.05,
    };

    // Validate dates
    if (config.startDate >= config.endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date range: startDate must be before endDate',
        },
        { status: 400 }
      );
    }

    // Validate symbols
    if (!config.symbols || config.symbols.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'At least one symbol is required',
        },
        { status: 400 }
      );
    }

    // Validate strategy
    if (!['mean_reversion', 'momentum', 'both'].includes(config.strategy)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid strategy: must be mean_reversion, momentum, or both',
        },
        { status: 400 }
      );
    }

    logger.info('Running backtest', {
      symbols: config.symbols,
      strategy: config.strategy,
      startDate: config.startDate.toISOString(),
      endDate: config.endDate.toISOString(),
    });

    // Run backtest
    const backtester = new Backtester(config);
    const result = await backtester.run();

    logger.info('Backtest completed', {
      totalTrades: result.summary.totalTrades,
      winRate: result.summary.winRate,
      totalPnL: result.summary.totalPnL,
    });

    return NextResponse.json({
      success: true,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error('Backtest API error', { error: error.message, stack: error.stack });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run backtest',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for retrieving preset backtest configurations
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const preset = searchParams.get('preset');

  // Define preset configurations
  const presets: Record<string, Partial<BacktestConfig>> = {
    '1week': {
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    '1month': {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    '3months': {
      startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    '6months': {
      startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
    '1year': {
      startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    },
  };

  if (preset && presets[preset]) {
    return NextResponse.json({
      success: true,
      preset,
      config: {
        ...presets[preset],
        symbols: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'],
        strategy: 'both',
        initialCapital: 100000,
        positionSize: 10,
        commission: 0.1,
        slippage: 0.05,
      },
    });
  }

  // Return all available presets
  return NextResponse.json({
    success: true,
    presets: Object.keys(presets),
    defaultConfig: {
      symbols: ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK'],
      strategy: 'both',
      initialCapital: 100000,
      positionSize: 10,
      commission: 0.1,
      slippage: 0.05,
    },
  });
}
