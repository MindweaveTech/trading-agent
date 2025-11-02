/**
 * Zerodha MCP Client
 * Handles HTTP connection to Zerodha MCP server for real-time market data
 * Updated to use HTTP/fetch instead of WebSocket
 * Falls back to mock data when authentication is unavailable
 * Supports Kite Connect OAuth authentication
 */

import logger from './logger';
import { generateMockQuotes, generateMockHistoricalData, isMockMode, logMockUsage } from './mock-data';
import { getKiteAuth } from './kite-auth';

export interface Quote {
  symbol: string;
  lastPrice: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class MCPClient {
  private url: string;
  private timeout: number = 10000; // 10 seconds default timeout
  private retryAttempts: number = 3;
  private retryDelay: number = 1000; // 1 second

  constructor() {
    this.url = process.env.ZERODHA_MCP_URL || 'https://mcp.kite.trade/mcp';
    logger.info('MCP Client initialized', { url: this.url });
  }

  /**
   * Make HTTP request to MCP server with retry logic
   */
  private async makeRequest<T>(
    endpoint: string,
    payload: any,
    attempt: number = 1
  ): Promise<T> {
    const requestUrl = this.url.endsWith('/') ? this.url + endpoint : this.url + '/' + endpoint;

    try {
      logger.debug('MCP Request', { endpoint, payload, attempt });

      // Get access token from Kite auth if available
      const kiteAuth = getKiteAuth();
      const accessToken = await kiteAuth.getAccessTokenForAPI();

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      // Add authorization header if we have an access token
      if (accessToken) {
        headers['Authorization'] = `token ${process.env.KITE_API_KEY}:${accessToken}`;
        headers['X-Kite-Version'] = '3';
        logger.debug('Using Kite OAuth access token for MCP request');
      }

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      logger.http(`MCP ${endpoint} - ${response.status}`, {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `MCP request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      logger.debug('MCP Response', { endpoint, data });

      return data;
    } catch (error: any) {
      logger.error('MCP Request error', { endpoint, error: error.message, attempt });

      // Retry logic for network errors (not for 4xx errors)
      if (
        attempt < this.retryAttempts &&
        (error.name === 'AbortError' || error.message.includes('fetch failed'))
      ) {
        logger.warn(`Retrying MCP request (${attempt}/${this.retryAttempts})`, { endpoint });
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
        return this.makeRequest<T>(endpoint, payload, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Get real-time quotes for given symbols
   * @param symbols Array of stock symbols (e.g., ['RELIANCE', 'TCS'])
   */
  async getQuotes(symbols: string[]): Promise<Quote[]> {
    try {
      logger.info('Fetching quotes', { symbols });

      // If in mock mode, use mock data immediately
      if (isMockMode()) {
        logMockUsage('getQuotes');
        logger.info('Using mock quotes', { symbols });
        return generateMockQuotes(symbols);
      }

      const response = await this.makeRequest<MCPResponse<Quote[]>>('quotes', {
        symbols,
        mode: 'full', // Request full quote data
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || 'Failed to fetch quotes');
      }

      // Transform response to match Quote interface
      const quotes: Quote[] = response.data.map((item: any) => ({
        symbol: item.symbol || item.tradingsymbol || item.instrument_token,
        lastPrice: item.last_price || item.ltp || 0,
        volume: item.volume || item.volume_traded || 0,
        change: item.change || item.net_change || 0,
        changePercent: item.change_percent || item.percentage_change || 0,
        timestamp: new Date(item.timestamp || item.last_trade_time || Date.now()),
      }));

      logger.info('Quotes fetched successfully', {
        count: quotes.length,
        symbols: quotes.map(q => q.symbol)
      });

      return quotes;
    } catch (error: any) {
      logger.error('Failed to fetch quotes from MCP', { symbols, error: error.message });

      // Fall back to mock data if authentication fails
      if (
        error.message.includes('Invalid session') ||
        error.message.includes('404') ||
        error.message.includes('401') ||
        error.message.includes('403')
      ) {
        logger.warn('MCP authentication failed, using mock data', { symbols, error: error.message });
        logMockUsage('getQuotes (fallback)');
        return generateMockQuotes(symbols);
      }

      throw error;
    }
  }

  /**
   * Get historical data for a symbol
   * @param symbol Stock symbol
   * @param interval Time interval (minute, day, etc.)
   * @param fromDate Start date
   * @param toDate End date
   */
  async getHistoricalData(
    symbol: string,
    interval: string,
    fromDate: Date,
    toDate: Date
  ): Promise<any[]> {
    try {
      logger.info('Fetching historical data', {
        symbol,
        interval,
        from: fromDate.toISOString(),
        to: toDate.toISOString()
      });

      // If in mock mode, use mock data immediately
      if (isMockMode()) {
        logMockUsage('getHistoricalData');
        logger.info('Using mock historical data', { symbol, interval });
        return generateMockHistoricalData(symbol, interval, fromDate, toDate);
      }

      const response = await this.makeRequest<MCPResponse<any[]>>('historical', {
        symbol,
        interval,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || response.message || 'Failed to fetch historical data');
      }

      logger.info('Historical data fetched successfully', {
        symbol,
        interval,
        dataPoints: response.data.length
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to fetch historical data from MCP', {
        symbol,
        interval,
        error: error.message
      });

      // Fall back to mock data if authentication fails
      if (
        error.message.includes('Invalid session') ||
        error.message.includes('404') ||
        error.message.includes('401') ||
        error.message.includes('403')
      ) {
        logger.warn('MCP authentication failed, using mock historical data', {
          symbol,
          interval,
          error: error.message
        });
        logMockUsage('getHistoricalData (fallback)');
        return generateMockHistoricalData(symbol, interval, fromDate, toDate);
      }

      throw error;
    }
  }

  /**
   * Health check - verify MCP server is reachable
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(this.url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      logger.info('MCP health check', {
        status: response.status,
        ok: response.ok
      });

      return response.ok;
    } catch (error: any) {
      logger.error('MCP health check failed', { error: error.message });
      return false;
    }
  }

  /**
   * No longer needed for HTTP client, kept for API compatibility
   */
  async connect(): Promise<void> {
    logger.debug('HTTP MCP Client - connect() called (no-op for HTTP)');
    // No-op for HTTP client
    return Promise.resolve();
  }

  /**
   * No longer needed for HTTP client, kept for API compatibility
   */
  disconnect(): void {
    logger.debug('HTTP MCP Client - disconnect() called (no-op for HTTP)');
    // No-op for HTTP client
  }
}

// Singleton instance
let mcpClient: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient();
  }
  return mcpClient;
}

// Export default for convenience
export default getMCPClient;
