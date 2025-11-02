/**
 * Logout Endpoint
 * Clears Zerodha authentication session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKiteAuth } from '@/lib/kite-auth';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const kiteAuth = getKiteAuth();
    await kiteAuth.clearSession();

    logger.info('User logged out');

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error', { error });
    return NextResponse.json(
      {
        error: 'Failed to logout',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
