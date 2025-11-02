/**
 * OAuth Login Endpoint
 * Redirects to Zerodha Kite Connect for authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKiteAuth } from '@/lib/kite-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const kiteAuth = getKiteAuth();
    const loginUrl = kiteAuth.getLoginUrl();

    // Redirect to Zerodha login page
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate login',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
