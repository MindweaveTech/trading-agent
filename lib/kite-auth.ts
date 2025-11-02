/**
 * Zerodha Kite Connect Authentication Helper
 * Handles OAuth flow and token management
 */

import { kv } from '@vercel/kv';
import crypto from 'crypto';
import logger from './logger';

export interface KiteSession {
  accessToken: string;
  userId: string;
  userName: string;
  email: string;
  broker: string;
  exchanges: string[];
  orderTypes: string[];
  products: string[];
  createdAt: Date;
  expiresAt: Date;
}

export class KiteAuth {
  private apiKey: string;
  private apiSecret: string;
  private redirectUrl: string;

  constructor() {
    this.apiKey = process.env.KITE_API_KEY || '';
    this.apiSecret = process.env.KITE_API_SECRET || '';
    this.redirectUrl = process.env.KITE_REDIRECT_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://trading-agent.mindweave.tech/auth/callback'
        : 'http://localhost:3456/auth/callback');
  }

  /**
   * Generate login URL for Zerodha OAuth
   */
  getLoginUrl(): string {
    const baseUrl = 'https://kite.zerodha.com/connect/login';
    const params = new URLSearchParams({
      api_key: this.apiKey,
      v: '3',
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Generate checksum for validating request token
   */
  private generateChecksum(requestToken: string): string {
    const data = `${this.apiKey}${requestToken}${this.apiSecret}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Exchange request token for access token
   */
  async getAccessToken(requestToken: string): Promise<KiteSession> {
    try {
      const checksum = this.generateChecksum(requestToken);

      const response = await fetch('https://api.kite.trade/session/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Kite-Version': '3',
        },
        body: new URLSearchParams({
          api_key: this.apiKey,
          request_token: requestToken,
          checksum: checksum,
        }).toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Kite auth failed: ${response.status} - ${error}`);
      }

      const data = await response.json();

      if (data.status !== 'success' || !data.data.access_token) {
        throw new Error('Invalid response from Kite API');
      }

      const session: KiteSession = {
        accessToken: data.data.access_token,
        userId: data.data.user_id,
        userName: data.data.user_name,
        email: data.data.email,
        broker: data.data.broker,
        exchanges: data.data.exchanges || [],
        orderTypes: data.data.order_types || [],
        products: data.data.products || [],
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      // Store in KV
      await this.saveSession(session);

      logger.info('Kite session created', {
        userId: session.userId,
        userName: session.userName,
      });

      return session;
    } catch (error) {
      logger.error('Failed to get access token', { error });
      throw error;
    }
  }

  /**
   * Save session to KV storage
   */
  async saveSession(session: KiteSession): Promise<void> {
    try {
      await kv.set('kite:session', session, {
        ex: 24 * 60 * 60, // Expire in 24 hours
      });
      await kv.set(`kite:session:${session.userId}`, session.accessToken, {
        ex: 24 * 60 * 60,
      });
    } catch (error) {
      logger.error('Failed to save session to KV', { error });
      // Continue even if KV fails (session still in memory)
    }
  }

  /**
   * Get current session from KV
   */
  async getSession(): Promise<KiteSession | null> {
    try {
      const session = await kv.get<KiteSession>('kite:session');

      if (!session) {
        return null;
      }

      // Check if session is expired
      if (new Date() > new Date(session.expiresAt)) {
        await this.clearSession();
        return null;
      }

      return session;
    } catch (error) {
      logger.error('Failed to get session from KV', { error });
      return null;
    }
  }

  /**
   * Clear session from KV
   */
  async clearSession(): Promise<void> {
    try {
      const session = await kv.get<KiteSession>('kite:session');
      if (session) {
        await kv.del('kite:session');
        await kv.del(`kite:session:${session.userId}`);
      }
    } catch (error) {
      logger.error('Failed to clear session from KV', { error });
    }
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  /**
   * Get access token for API requests
   */
  async getAccessTokenForAPI(): Promise<string | null> {
    const session = await this.getSession();
    return session?.accessToken || null;
  }
}

// Singleton instance
let kiteAuth: KiteAuth | null = null;

export function getKiteAuth(): KiteAuth {
  if (!kiteAuth) {
    kiteAuth = new KiteAuth();
  }
  return kiteAuth;
}

export default getKiteAuth;
