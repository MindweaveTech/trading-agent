/**
 * Zerodha MCP Client
 * Handles WebSocket connection to Zerodha MCP server for real-time market data
 */

import WebSocket from 'ws';

export interface Quote {
  symbol: string;
  lastPrice: number;
  volume: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export class MCPClient {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.url = process.env.ZERODHA_MCP_URL || 'ws://localhost:5000';
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.on('open', () => {
          console.log('MCP Client connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.ws.on('error', (error) => {
          console.error('MCP Client error:', error);
          reject(error);
        });

        this.ws.on('close', () => {
          console.log('MCP Client disconnected');
          this.handleReconnect();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Reconnect attempt ${this.reconnectAttempts}`);
        this.connect();
      }, 5000);
    }
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const message = JSON.stringify({
        type: 'quotes',
        symbols,
      });

      this.ws!.send(message);

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      this.ws!.once('message', (data: Buffer) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          resolve(response.quotes);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  async getHistoricalData(
    symbol: string,
    interval: string,
    fromDate: Date,
    toDate: Date
  ): Promise<any[]> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const message = JSON.stringify({
        type: 'historical',
        symbol,
        interval,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      });

      this.ws!.send(message);

      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 30000);

      this.ws!.once('message', (data: Buffer) => {
        clearTimeout(timeout);
        try {
          const response = JSON.parse(data.toString());
          resolve(response.data);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
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
