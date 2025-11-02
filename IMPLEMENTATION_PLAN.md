# IMPLEMENTATION PLAN - Trading Agent User Stories

**Date**: 2025-11-01
**Status**: Planning Phase
**Current Phase**: Phase 1 Complete (Deployment) → Starting Phase 2

---

## Overview

This document outlines the implementation plan for the 3 core user stories of the AI Trading Agent. The deployment infrastructure is complete, and we're ready to build the feature layers.

### Current Status
- ✅ Phase 1: Core Infrastructure + Deployment (100%)
- 🔄 Phase 2: Fix MCP Issue + User Story 1 (0%)
- ⏳ Phase 3: User Story 2 (0%)
- ⏳ Phase 4: User Story 3 (0%)

---

## PRIORITY 1: Fix MCP WebSocket/HTTP Mismatch

**Timeline**: 1-2 hours
**Status**: CRITICAL - Blocking signal generation

### Problem
- `lib/mcp-client.ts` uses WebSocket (`ws://`) for MCP connection
- Zerodha hosted MCP is HTTPS endpoint: `https://mcp.kite.trade/mcp`
- Result: `/api/mcp` and `/api/signals` returning 500 errors

### Solution Options

#### Option A: HTTP-Based MCP Client (Recommended)
Update `lib/mcp-client.ts` to use `fetch()` instead of WebSocket:

```typescript
// lib/mcp-client.ts - New HTTP implementation
export class MCPClient {
  private url: string;

  constructor() {
    this.url = process.env.ZERODHA_MCP_URL || 'https://mcp.kite.trade/mcp';
  }

  async getQuotes(symbols: string[]): Promise<Quote[]> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_quotes',
        symbols
      })
    });

    if (!response.ok) {
      throw new Error(`MCP request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.quotes;
  }
}
```

**Pros**:
- Works with hosted Zerodha MCP
- No WebSocket complexity
- Better for serverless (no persistent connections)

**Cons**:
- No real-time streaming (polling required)

#### Option B: Mock Data for Testing
Create mock market data generator for immediate testing:

```typescript
// lib/mock-mcp.ts
export function generateMockQuotes(symbols: string[]): Quote[] {
  return symbols.map(symbol => ({
    symbol,
    lastPrice: 2000 + Math.random() * 500,
    volume: Math.floor(Math.random() * 1000000),
    change: Math.random() * 50 - 25,
    changePercent: Math.random() * 5 - 2.5,
    timestamp: new Date()
  }));
}
```

**Pros**:
- Immediate testing without MCP dependency
- Predictable data for development

**Cons**:
- Not real market data
- Temporary solution only

### Recommended Approach
1. Implement Option A (HTTP-based client) - 1 hour
2. Test with real Zerodha MCP - 30 min
3. Deploy and verify - 30 min
4. Keep Option B as fallback for testing

---

## USER STORY 1: Trading Overview & Insights

**Timeline**: Week 1-2 (15-20 hours)
**Priority**: HIGH
**Dependencies**: MCP fix complete

### Goal
Build a dashboard showing active positions, trade history, AI predictions, and performance metrics.

### Phase 2.1: Backend API (5-7 hours)

#### Task 1.1: Positions Management API
**File**: `app/api/positions/route.ts`

```typescript
// GET /api/positions - Get all positions
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get('filter'); // 'active', 'closed', 'all'

  // Fetch from Vercel KV
  const positions = await kv.get('positions:all') || [];

  // Filter based on query
  const filtered = filterPositions(positions, filter);

  return Response.json({
    success: true,
    positions: filtered,
    count: filtered.length
  });
}
```

**Endpoints to create**:
- `GET /api/positions` - All positions with filters
- `GET /api/positions/active` - Active positions only
- `GET /api/positions/history` - Historical trades with date filters
- `GET /api/positions/[id]` - Single position details

**Estimated**: 3 hours

#### Task 1.2: Trade History with Filters
**File**: `app/api/positions/history/route.ts`

```typescript
// GET /api/positions/history?from=2025-10-01&to=2025-11-01&strategy=mean_reversion
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const strategy = searchParams.get('strategy');
  const symbol = searchParams.get('symbol');

  // Query Postgres for historical data
  const trades = await postgres.query(`
    SELECT * FROM trades
    WHERE timestamp BETWEEN $1 AND $2
    AND ($3::text IS NULL OR strategy = $3)
    AND ($4::text IS NULL OR symbol = $4)
    ORDER BY timestamp DESC
  `, [from, to, strategy, symbol]);

  return Response.json({
    success: true,
    trades: trades.rows,
    summary: calculateSummary(trades.rows)
  });
}
```

**Estimated**: 2 hours

#### Task 1.3: AI Forecast API
**File**: `app/api/forecast/route.ts`

```typescript
// GET /api/forecast - Get next 24h predictions
export async function GET() {
  const symbols = ['RELIANCE', 'TCS', 'INFY', 'HDFC'];

  // Get current market data
  const quotes = await mcpClient.getQuotes(symbols);

  // Generate predictions for each symbol
  const predictions = await Promise.all(
    quotes.map(async (quote) => {
      const signals = await generateSignal(quote);
      return {
        symbol: quote.symbol,
        currentPrice: quote.lastPrice,
        predictedAction: signals.action,
        confidence: signals.confidence,
        reasoning: signals.reason,
        targetPrice: signals.targetPrice,
        stopLoss: signals.stopLoss,
        timeframe: '24h'
      };
    })
  );

  return Response.json({
    success: true,
    forecast: predictions,
    timestamp: new Date()
  });
}
```

**Estimated**: 2 hours

### Phase 2.2: Frontend Components (8-10 hours)

#### Task 2.1: Active Positions Component
**File**: `app/dashboard/components/ActivePositions.tsx`

```typescript
'use client';

import useSWR from 'swr';

export function ActivePositions() {
  const { data, error, isLoading } = useSWR(
    '/api/positions/active',
    fetcher,
    { refreshInterval: 5000 } // Update every 5 seconds
  );

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {data?.positions.map((position: Position) => (
        <PositionCard key={position.id} position={position} />
      ))}
    </div>
  );
}
```

**Features**:
- Real-time P&L updates (5s refresh)
- Color-coded profit/loss
- Click to view details
- Quick actions (close, edit stop-loss)

**Estimated**: 3 hours

#### Task 2.2: Trade History Table
**File**: `app/dashboard/components/TradeHistory.tsx`

```typescript
'use client';

export function TradeHistory() {
  const [filters, setFilters] = useState({
    from: '2025-10-01',
    to: '2025-11-01',
    strategy: 'all',
    symbol: 'all'
  });

  const { data } = useSWR(
    `/api/positions/history?${new URLSearchParams(filters)}`,
    fetcher
  );

  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} />
      <DataTable
        columns={tradeColumns}
        data={data?.trades || []}
        pagination
        sortable
      />
    </div>
  );
}
```

**Features**:
- Date range picker
- Strategy filter dropdown
- Symbol filter
- Sortable columns (P&L, date, etc.)
- Pagination
- Export to CSV

**Estimated**: 3 hours

#### Task 2.3: AI Forecast Component
**File**: `app/dashboard/components/AIForecast.tsx`

```typescript
'use client';

export function AIForecast() {
  const { data } = useSWR('/api/forecast', fetcher, {
    refreshInterval: 900000 // 15 minutes
  });

  return (
    <div className="space-y-4">
      <h2>AI Predictions - Next 24 Hours</h2>
      {data?.forecast.map((prediction: Prediction) => (
        <PredictionCard
          key={prediction.symbol}
          prediction={prediction}
          onExecute={() => handleExecute(prediction)}
        />
      ))}
    </div>
  );
}

function PredictionCard({ prediction, onExecute }) {
  const actionColor = {
    BUY: 'text-green-600',
    SELL: 'text-red-600',
    HOLD: 'text-gray-600'
  }[prediction.predictedAction];

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold">{prediction.symbol}</h3>
          <p className={actionColor}>{prediction.predictedAction}</p>
          <p className="text-sm text-gray-600">{prediction.reasoning}</p>
        </div>
        <div className="text-right">
          <ConfidenceBadge confidence={prediction.confidence} />
          <button onClick={onExecute} className="mt-2 btn-primary">
            Execute
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Features**:
- Confidence visualization (progress bar)
- Action color coding (green=BUY, red=SELL)
- Reasoning explanation
- One-click execute
- Auto-refresh every 15 min

**Estimated**: 2 hours

#### Task 2.4: Performance Metrics Dashboard
**File**: `app/dashboard/components/PerformanceMetrics.tsx`

```typescript
'use client';

export function PerformanceMetrics() {
  const { data } = useSWR('/api/report', fetcher, {
    refreshInterval: 60000 // 1 minute
  });

  const metrics = data?.report.summary;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <MetricCard
        label="Total P&L"
        value={`₹${metrics?.totalPnL.toFixed(2)}`}
        change={metrics?.returnPercent}
        positive={metrics?.totalPnL >= 0}
      />
      <MetricCard
        label="Win Rate"
        value={`${(metrics?.winRate * 100).toFixed(1)}%`}
        target={55}
      />
      <MetricCard
        label="Total Trades"
        value={metrics?.totalTrades}
      />
      <MetricCard
        label="Max Drawdown"
        value={`${metrics?.maxDrawdown.toFixed(2)}%`}
        warning={metrics?.maxDrawdown > 10}
      />
    </div>
  );
}
```

**Features**:
- Key metrics cards
- Color-coded performance (green/red)
- Target comparison (e.g., win rate vs 55% target)
- Warning badges for concerning metrics

**Estimated**: 2 hours

### Phase 2.3: Dashboard Integration (2-3 hours)

#### Task 3.1: Update Dashboard Page
**File**: `app/dashboard/page.tsx`

```typescript
import { ActivePositions } from './components/ActivePositions';
import { TradeHistory } from './components/TradeHistory';
import { AIForecast } from './components/AIForecast';
import { PerformanceMetrics } from './components/PerformanceMetrics';

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">Trading Dashboard</h1>

      {/* Performance Overview */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Performance Overview</h2>
        <PerformanceMetrics />
      </section>

      {/* Active Positions */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Active Positions</h2>
        <ActivePositions />
      </section>

      {/* AI Forecast */}
      <section>
        <h2 className="text-xl font-semibold mb-4">AI Predictions</h2>
        <AIForecast />
      </section>

      {/* Trade History */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Trade History</h2>
        <TradeHistory />
      </section>
    </div>
  );
}
```

**Estimated**: 2 hours

### Testing & Refinement (3-5 hours)
- API endpoint testing
- Component testing
- Integration testing
- Performance optimization
- Bug fixes

---

## USER STORY 2: AI Agent Creation & Control

**Timeline**: Week 3-4 (12-15 hours)
**Priority**: MEDIUM
**Dependencies**: User Story 1 complete

### Phase 3.1: Backend (6-8 hours)

#### Agent Data Model
```typescript
interface Agent {
  id: string;
  name: string;
  strategy: 'momentum' | 'mean_reversion' | 'arbitrage';
  status: 'active' | 'paused' | 'stopped';
  riskLimits: {
    maxPositionSize: number;
    maxDailyLoss: number;
    stopLossPercent: number;
  };
  instruments: string[];
  performance: {
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    sharpeRatio: number;
  };
  created: Date;
  lastActive: Date;
}
```

#### API Endpoints
- `POST /api/agents` - Create agent (2h)
- `GET /api/agents` - List agents (1h)
- `GET /api/agents/:id` - Get agent (1h)
- `PATCH /api/agents/:id` - Update agent (1h)
- `POST /api/agents/:id/start` - Start agent (1h)
- `POST /api/agents/:id/pause` - Pause agent (1h)
- `POST /api/agents/:id/stop` - Stop agent (1h)
- `GET /api/agents/:id/logs` - Decision logs (2h)

### Phase 3.2: Frontend (6-7 hours)

#### Components
- `<AgentWizard />` - Multi-step creation (3h)
- `<AgentCard />` - Agent status card (1h)
- `<AgentList />` - List view (1h)
- `<DecisionLog />` - Log viewer (2h)

---

## USER STORY 3: Daily Reports & Autopilot

**Timeline**: Week 5-6 (10-12 hours)
**Priority**: MEDIUM
**Dependencies**: User Story 1 & 2 complete

### Phase 4.1: Backend (5-6 hours)

#### API Endpoints
- `GET /api/reports/daily` - Today's report (2h)
- `GET /api/reports/daily/:date` - Historical (1h)
- `POST /api/recommendations/:id/execute` - Execute (1h)
- `POST /api/recommendations/execute-all` - Batch execute (1h)
- `GET /api/autopilot` - Get status (0.5h)
- `POST /api/autopilot` - Toggle (1h)

### Phase 4.2: Frontend (5-6 hours)

#### Components
- `<DailyReportView />` - Report page (2h)
- `<RecommendationsList />` - Recommendations (2h)
- `<AutopilotToggle />` - Control panel (1h)
- `<RiskAlerts />` - Alert section (1h)

---

## Success Metrics

### User Story 1
- [ ] Dashboard loads in <1s
- [ ] Data refreshes every 5s
- [ ] All filters work correctly
- [ ] Performance metrics accurate

### User Story 2
- [ ] Agent creation takes <2 min
- [ ] Agents start/pause/stop successfully
- [ ] Decision logs captured
- [ ] Risk limits enforced

### User Story 3
- [ ] Reports generated at 4 PM daily
- [ ] Recommendations display correctly
- [ ] Autopilot executes safely
- [ ] Risk alerts trigger properly

---

## Risk Mitigation

### Technical Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| MCP connection failures | High | Retry logic + fallback mock data |
| Database connection issues | Medium | Connection pooling + error handling |
| Real-time update delays | Low | SWR caching + optimistic updates |
| Autopilot errors | High | Circuit breakers + manual approval |

### Business Risks
| Risk | Impact | Mitigation |
|------|--------|------------|
| Poor signal accuracy | High | Continuous monitoring + strategy tuning |
| User confusion | Medium | Comprehensive tooltips + onboarding |
| Data loss | Medium | Regular backups + audit logs |

---

## Next Session Action Items

### Immediate (Today)
1. ✅ Fix MCP WebSocket/HTTP mismatch
2. ✅ Test `/api/mcp` and `/api/signals` endpoints
3. ✅ Deploy fix to production

### Tomorrow
1. Start User Story 1 - Backend APIs
2. Create `/api/positions` endpoint
3. Create `/api/positions/active` endpoint
4. Create `/api/forecast` endpoint

### This Week
1. Complete User Story 1 backend (all APIs)
2. Begin User Story 1 frontend (components)
3. Deploy and test on production

---

**Ready to Start**: Fix MCP issue → Build User Story 1
