/**
 * Auth Status Endpoint
 * Returns current authentication status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKiteAuth } from '@/lib/kite-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const kiteAuth = getKiteAuth();
    const session = await kiteAuth.getSession();

    if (!session) {
      return NextResponse.json({
        authenticated: false,
        session: null,
      });
    }

    return NextResponse.json({
      authenticated: true,
      session: {
        userId: session.userId,
        userName: session.userName,
        email: session.email,
        broker: session.broker,
        exchanges: session.exchanges,
        createdAt: session.createdAt,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check auth status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
