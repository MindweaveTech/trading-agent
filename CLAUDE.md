# CLAUDE.md - AI Trading Agent

## Project Overview

**Organization**: Mindweave Technologies Pvt. Ltd.
**Deployment**: `trading-agent.mindweave.tech`
**Stack**: Next.js 14, Vercel Edge Functions, TypeScript, TensorFlow.js
**Purpose**: AI-powered trading analysis system with Zerodha MCP integration

## Development Guidelines

### Commands

```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run type-check       # TypeScript type checking
npm run deploy           # Deploy to Vercel
```

### Architecture

- **Serverless**: Vercel Edge Functions
- **Data Storage**: Vercel KV (positions), Vercel Postgres (historical)
- **Market Data**: Zerodha MCP WebSocket connection
- **AI/ML**: TensorFlow.js for risk analysis and anomaly detection

### Directory Structure

```
trading-agent/
├── app/                 # Next.js App Router
│   ├── api/            # API Routes
│   │   ├── mcp/        # Market data fetcher
│   │   ├── signals/    # Signal generator
│   │   ├── risk/       # Risk analysis
│   │   ├── report/     # Performance reports
│   │   └── cron/       # Scheduled jobs
│   ├── dashboard/      # Dashboard UI
│   └── page.tsx        # Landing page
├── lib/                # Core libraries
│   ├── mcp-client.ts   # Zerodha MCP client
│   ├── strategies.ts   # Trading strategies
│   ├── ai-models.ts    # AI risk management
│   └── paper-trader.ts # Virtual trading engine
└── public/             # Static assets
```

### Environment Variables

```env
ZERODHA_MCP_URL          # WebSocket URL for MCP server
PAPER_CAPITAL            # Initial virtual capital (default: 100000)
ADMIN_EMAIL              # Email for reports (optional)
SEND_REPORTS             # Enable email reports (default: false)
KV_URL                   # Vercel KV connection
POSTGRES_URL             # Vercel Postgres connection
```

### Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| market-monitor | */5 9-15 * * 1-5 | Update positions every 5 min |
| signal-generator | */15 9-15 * * 1-5 | Generate signals every 15 min |
| daily-report | 0 16 * * 1-5 | EOD report at 4 PM IST |

### Trading Strategies

1. **Mean Reversion**: RSI-based (buy <30, sell >70)
2. **Momentum**: SMA crossover (golden/death cross)
3. **AI Risk Filter**: Confidence + anomaly detection

### API Endpoints

- `GET /api/mcp?symbols=RELIANCE,TCS` - Market data
- `GET /api/signals` - Trading signals
- `GET /api/risk` - Risk metrics
- `GET /api/report` - Performance report

### Development Workflow

1. **Always run tests before deployment**
2. **Use TypeScript strict mode**
3. **Follow existing code patterns**
4. **Update documentation when adding features**
5. **Test locally before deploying to Vercel**

### Deployment

```bash
# One-time setup
vercel login
vercel link

# Configure storage
vercel kv create trading-cache
vercel postgres create trading-db

# Set environment variables
vercel env add ZERODHA_MCP_URL
vercel env add PAPER_CAPITAL

# Deploy
vercel --prod
```

### Constraints

- **Read-only market data** (no real trading)
- **Paper trading only** (no capital exposure)
- **No API keys required** for pilot phase
- **Vercel free tier** limits apply

### Success Metrics

- System uptime: >95%
- Signal accuracy: >55%
- Response time: <200ms
- Win rate: >55%
- Max drawdown: <10%

### Next Steps

Implement User Stories (see USER_STORIES.md):
1. Trading Overview & Insights
2. AI Agent Creation & Control
3. Actionable Daily Reports
