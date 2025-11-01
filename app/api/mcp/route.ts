/**
 * MCP Data Fetcher API
 * Fetches real-time market data from Zerodha MCP server
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMCPClient } from '@/lib/mcp-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');

    if (!symbolsParam) {
      return NextResponse.json(
        { error: 'Symbols parameter is required' },
        { status: 400 }
      );
    }

    const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase());

    const client = getMCPClient();
    const quotes = await client.getQuotes(symbols);

    return NextResponse.json({
      success: true,
      data: quotes,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('MCP API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch market data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbol, interval, fromDate, toDate } = body;

    if (!symbol || !interval || !fromDate || !toDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const client = getMCPClient();
    const data = await client.getHistoricalData(
      symbol,
      interval,
      new Date(fromDate),
      new Date(toDate)
    );

    return NextResponse.json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('MCP API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch historical data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
