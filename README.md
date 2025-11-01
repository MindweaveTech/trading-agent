# AI Trading Agent - Zerodha MCP Integration

> **Deployment**: `trading-agent.mindweave.tech`
> **Organization**: Mindweave Technologies Pvt. Ltd.

A serverless AI-powered trading analysis system built with Next.js 14 and Vercel Edge Functions. Validates trading strategies using live market data from Zerodha MCP server without executing real trades.

## Executive Summary

This pilot system enables:
- **Strategy Validation**: Test AI-driven trading algorithms with real market data
- **Risk-Free Testing**: Paper trading environment with virtual positions
- **AI Risk Management**: Automated anomaly detection and circuit breakers
- **Performance Analytics**: Comprehensive reporting and metrics tracking

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          Vercel Edge Functions                  │
├─────────────────────────────────────────────────┤
│  API Routes                                     │
│  ├── /api/mcp          (Market data fetcher)   │
│  ├── /api/signals      (Strategy engine)       │
│  ├── /api/risk         (AI risk analysis)      │
│  └── /api/report       (Performance metrics)   │
├─────────────────────────────────────────────────┤
│  Cron Jobs (Market Hours: 9-15 IST Mon-Fri)   │
│  ├── market-monitor    (*/5 min)               │
│  ├── signal-generator  (*/15 min)              │
│  └── daily-report      (16:00 IST)             │
├─────────────────────────────────────────────────┤
│  Data Layer                                     │
│  ├── Vercel KV        (Positions cache)        │
│  ├── Vercel Postgres  (Historical data)        │
│  └── MCP Client       (Live market data)       │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
trading-agent/
├── app/
│   ├── api/
│   │   ├── mcp/route.ts              # Market data fetcher
│   │   ├── signals/route.ts          # Trading signal generator
│   │   ├── risk/route.ts             # Risk analysis endpoint
│   │   ├── report/route.ts           # Performance reports
│   │   └── cron/
│   │       ├── market-monitor/       # Position updates (5 min)
│   │       ├── signal-generator/     # Signal generation (15 min)
│   │       └── daily-report/         # EOD reports
│   ├── dashboard/                    # Trading dashboard UI
│   └── layout.tsx
├── lib/
│   ├── mcp-client.ts                 # Zerodha MCP WebSocket wrapper
│   ├── strategies.ts                 # Trading algorithms
│   ├── ai-models.ts                  # Risk detection & anomaly detection
│   └── paper-trader.ts               # Virtual position management
├── vercel.json                       # Cron job configuration
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Zerodha MCP server running locally (or accessible endpoint)
- Vercel account (for deployment)

### Local Development

1. **Clone and Install**
   ```bash
   cd trading-agent
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   ZERODHA_MCP_URL=ws://localhost:5000
   PAPER_CAPITAL=100000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

   Access at `http://localhost:3000`

### Deployment to Vercel

1. **Initial Setup**
   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Login and link project
   vercel login
   vercel link
   ```

2. **Configure Storage**
   ```bash
   # Create KV store for positions
   vercel kv create trading-cache

   # Create Postgres for historical data
   vercel postgres create trading-db
   ```

3. **Set Environment Variables**
   ```bash
   vercel env add ZERODHA_MCP_URL
   vercel env add PAPER_CAPITAL
   vercel env add ADMIN_EMAIL        # Optional
   ```

4. **Deploy**
   ```bash
   vercel --prod
   ```

5. **Monitor**
   ```bash
   vercel logs --follow
   ```

## API Reference

### Market Data (`/api/mcp`)

**GET** - Fetch real-time quotes
```bash
curl "https://trading-agent.mindweave.tech/api/mcp?symbols=RELIANCE,TCS"
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "symbol": "RELIANCE",
      "lastPrice": 2450.50,
      "volume": 1250000,
      "change": 12.30,
      "changePercent": 0.50
    }
  ]
}
```

### Trading Signals (`/api/signals`)

**GET** - Generate trading signals
```bash
curl "https://trading-agent.mindweave.tech/api/signals"
```

Response:
```json
{
  "success": true,
  "signals": [
    {
      "symbol": "RELIANCE",
      "action": "BUY",
      "confidence": 0.75,
      "reason": "RSI oversold at 28.50",
      "targetPrice": 2550,
      "stopLoss": 2380
    }
  ]
}
```

### Risk Analysis (`/api/risk`)

**GET** - Get portfolio risk metrics
```bash
curl "https://trading-agent.mindweave.tech/api/risk"
```

### Performance Report (`/api/report`)

**GET** - Generate comprehensive performance report
```bash
curl "https://trading-agent.mindweave.tech/api/report"
```

## Trading Strategies

### 1. Mean Reversion Strategy
- **Buy Signal**: RSI < 30 (oversold)
- **Sell Signal**: RSI > 70 (overbought)
- **Confidence**: Based on distance from threshold

### 2. Momentum Strategy
- **Golden Cross**: SMA20 crosses above SMA50
- **Death Cross**: SMA20 crosses below SMA50
- **Confidence**: Fixed at 0.65

### 3. AI Risk Filter
All signals pass through AI risk assessment:
- Confidence threshold check (>0.6)
- Risk/reward ratio validation (>1.5)
- Anomaly detection
- Circuit breaker monitoring

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| market-monitor | */5 9-15 * * 1-5 | Update position prices, check stop-loss/targets |
| signal-generator | */15 9-15 * * 1-5 | Generate and execute trading signals |
| daily-report | 0 16 * * 1-5 | Generate EOD performance report |

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ZERODHA_MCP_URL` | WebSocket URL for MCP server | `ws://localhost:5000` |
| `PAPER_CAPITAL` | Initial virtual capital | `100000` |
| `ADMIN_EMAIL` | Email for reports (optional) | - |
| `SEND_REPORTS` | Enable email reports | `false` |

### Risk Parameters

Configured in `lib/ai-models.ts`:
- **Max Position Size**: 10% of capital
- **Max Daily Loss**: 2%
- **Anomaly Threshold**: 0.7
- **Min Confidence**: 0.6
- **Min Risk/Reward**: 1.5

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| System Uptime | >95% | Vercel Analytics |
| Signal Accuracy | >55% | Virtual P&L tracking |
| Risk Detection | <5% false positives | Anomaly logs |
| Response Time | <200ms | Vercel Edge metrics |

## Cost Structure

**Free Tier (Pilot Phase)**
- Vercel Hosting: Free (100GB bandwidth)
- Vercel KV: Free (256MB)
- Vercel Postgres: Free (256MB)
- MCP Access: Free (read-only)
- **Total**: ₹0/month

## Development Roadmap

### Phase 1: Core Infrastructure ✓
- [x] MCP client with WebSocket connection
- [x] API routes for data, signals, risk, reports
- [x] Paper trading engine
- [x] Vercel deployment configuration

### Phase 2: Trading Logic ✓
- [x] Mean reversion strategy
- [x] Momentum strategy
- [x] Technical indicator calculations
- [x] Cron jobs for automation

### Phase 3: AI Risk Layer ✓
- [x] Anomaly detection
- [x] Risk assessment
- [x] Circuit breaker logic
- [x] Emergency stop mechanism

### Phase 4: Dashboard & Reporting (Next)
- [ ] Real-time trading dashboard
- [ ] Position visualization
- [ ] Performance charts
- [ ] Email report integration

## Testing

```bash
# Run type checking
npm run type-check

# Test API endpoints locally
curl http://localhost:3000/api/mcp?symbols=RELIANCE
curl http://localhost:3000/api/signals
curl http://localhost:3000/api/risk
curl http://localhost:3000/api/report
```

## Monitoring & Debugging

### View Logs
```bash
# Real-time logs
vercel logs --follow

# Specific deployment
vercel logs [deployment-url]
```

### Check Cron Jobs
```bash
# View cron job status in Vercel dashboard
vercel --inspect
```

## Go/No-Go Criteria

### GO Signals
- Paper trading profitable over 30 days
- <10% maximum drawdown
- System reliability >90%
- Win rate >55%

### NO-GO Signals
- Consistent losses over 2 weeks
- System reliability <90%
- Frequent AI risk false positives

### PIVOT Indicators
- Promising metrics but needs strategy refinement
- Technical issues requiring architecture changes

## Security Considerations

- ✅ Read-only market data access (no trading API keys)
- ✅ Paper trading only (no real capital exposure)
- ✅ Environment variables for sensitive config
- ✅ Rate limiting via Vercel Edge
- ⚠️ Add authentication before production dashboard

## Troubleshooting

### MCP Connection Issues
```bash
# Check if MCP server is running
curl http://localhost:5000/health

# Test WebSocket connection
wscat -c ws://localhost:5000
```

### Vercel KV Issues
```bash
# Test KV connection
vercel env pull
npm run dev
```

### Cron Jobs Not Running
- Verify cron schedule in `vercel.json`
- Check Vercel dashboard for cron logs
- Ensure deployment is production (crons don't run in preview)

## Contributing

This is a pilot project for Mindweave Technologies. For questions or issues:
1. Check existing documentation
2. Review Vercel logs for errors
3. Contact project maintainer

## License

Proprietary - Mindweave Technologies Pvt. Ltd.

## Links

- **Deployment**: https://trading-agent.mindweave.tech
- **Company**: https://mindweave.tech
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs

---

**Built with**: Next.js 14 | Vercel Edge Functions | TensorFlow.js | Zerodha MCP
**Maintained by**: Mindweave Technologies Pvt. Ltd.
