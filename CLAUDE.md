# CLAUDE.md - AI Trading Agent

## Project Overview

**Organization**: Mindweave Technologies Pvt. Ltd.
**Deployment**: `trading-agent.mindweave.tech`
**Stack**: Next.js 14, Vercel Edge Functions, TypeScript, TensorFlow.js
**Purpose**: AI-powered trading analysis system with Zerodha MCP integration

## Development Guidelines

### Commands

#### Development Server (Port 3456)
```bash
# Using control scripts (recommended)
./scripts/start_server.sh    # Start server with logging
./scripts/stop_server.sh     # Gracefully stop server
./scripts/restart_server.sh  # Restart server

# Using npm scripts
npm run server:start         # Start server
npm run server:stop          # Stop server
npm run server:restart       # Restart server

# Direct npm commands
npm run dev                  # Start dev server (port 3456)
npm run dev:verbose          # Start with verbose logging
```

#### Build & Deploy
```bash
npm run build                # Build for production
npm run start                # Start production server (port 3456)
npm run lint                 # Run ESLint
npm run type-check           # TypeScript type checking
npm run deploy               # Deploy to Vercel
```

#### Logging
```bash
npm run logs:view            # View combined logs (real-time)
npm run logs:errors          # View error logs only
tail -f logs/combined-YYYY-MM-DD.log  # Manual log viewing
tail -f logs/error-YYYY-MM-DD.log     # Manual error log viewing
```

### Architecture

- **Serverless**: Vercel Edge Functions
- **Data Storage**: Vercel KV (positions), Vercel Postgres (historical)
- **Market Data**: Zerodha MCP WebSocket connection
- **AI/ML**: TensorFlow.js for risk analysis and anomaly detection
- **Logging**: Winston with daily rotation (5000 lines/file, 30 days retention)
- **Local Server**: Port 3456 with PID-based process management

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
│   ├── paper-trader.ts # Virtual trading engine
│   └── logger.ts       # Winston logging configuration
├── scripts/            # Server control scripts
│   ├── start_server.sh # Start development server
│   ├── stop_server.sh  # Stop server gracefully
│   └── restart_server.sh # Restart server
├── logs/               # Daily rotating logs (gitignored)
│   ├── combined-*.log  # All log levels
│   ├── error-*.log     # Error logs only
│   ├── exceptions-*.log # Uncaught exceptions
│   └── rejections-*.log # Unhandled promises
└── public/             # Static assets
```

### Environment Variables

```env
# Server Configuration
PORT=3456                # Local development server port
NODE_ENV=development     # Environment mode

# Zerodha MCP Connection
ZERODHA_MCP_URL          # WebSocket URL for MCP server

# Paper Trading
PAPER_CAPITAL=100000     # Initial virtual capital

# Vercel Storage
KV_URL                   # Vercel KV connection
POSTGRES_URL             # Vercel Postgres connection

# Email Notifications (optional)
ADMIN_EMAIL              # Email for reports
SEND_REPORTS=false       # Enable email reports
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

### Server Management & Logging

#### Local Development Server
- **Port**: 3456 (custom non-standard port)
- **Process Management**: PID-based with `.server.pid` file
- **Graceful Shutdown**: SIGTERM with 10s timeout, SIGKILL fallback
- **Auto-restart**: Detects and handles port conflicts

#### Winston Logging System
- **Log Levels**: error, warn, info, http, debug
- **Daily Rotation**: Automatic log rotation at midnight
- **Line Limit**: Max 5000 lines per file before rotation
- **Retention**: 30 days of log history
- **Log Files**:
  - `logs/combined-YYYY-MM-DD.log` - All log levels
  - `logs/error-YYYY-MM-DD.log` - Errors only
  - `logs/exceptions-YYYY-MM-DD.log` - Uncaught exceptions
  - `logs/rejections-YYYY-MM-DD.log` - Unhandled promise rejections
- **Console Output**: Color-coded for development
- **Format**: Structured JSON for production

#### Using the Logger in Code
```typescript
import logger, { log } from '@/lib/logger';

// Simple logging
log.info('Server started successfully');
log.error('Failed to connect to MCP', { error });
log.debug('Processing trade signal', { symbol, action });

// With context
import { createLogger } from '@/lib/logger';
const apiLogger = createLogger('API');
apiLogger.http('GET /api/signals 200 45ms');
```

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
