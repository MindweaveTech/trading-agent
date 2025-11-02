/**
 * OAuth Callback Endpoint
 * Handles redirect from Zerodha after user authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getKiteAuth } from '@/lib/kite-auth';
import logger from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const requestToken = searchParams.get('request_token');
    const status = searchParams.get('status');

    // Check if user denied access
    if (status === 'error' || !requestToken) {
      logger.warn('OAuth callback error', { status, hasToken: !!requestToken });
      return NextResponse.redirect(
        new URL('/dashboard?auth=failed', request.url)
      );
    }

    // Exchange request token for access token
    const kiteAuth = getKiteAuth();
    const session = await kiteAuth.getAccessToken(requestToken);

    logger.info('OAuth callback successful', {
      userId: session.userId,
      userName: session.userName,
    });

    // Redirect to dashboard with success message
    return NextResponse.redirect(
      new URL('/dashboard?auth=success', request.url)
    );
  } catch (error) {
    logger.error('OAuth callback error', { error });
    return NextResponse.redirect(
      new URL('/dashboard?auth=error', request.url)
    );
  }
}
