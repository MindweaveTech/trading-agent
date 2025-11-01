# User Stories for AI Trading Agent

This document outlines the three high-value user stories that guide the development of the AI Trading Agent dashboard and features.

---

## Story 1: Trading Overview & Insights

**As a** trader
**I want to** view my active positions, historical performance, and AI predictions
**So that** I can understand my portfolio status at a glance

### Acceptance Criteria
- ✅ Dashboard shows real-time virtual positions with current P&L
- ✅ Historical trades display with entry/exit points and returns
- ✅ AI predictions show next 24-hour signals with confidence scores
- ✅ One-click filtering by date range, strategy, or instrument

### Implementation

```typescript
// app/dashboard/page.tsx
export default function TradingDashboard() {
  return (
    <>
      <ActivePositions />      // Real-time P&L updates
      <TradeHistory />         // Past 30 days with filters
      <AIForecast />           // Upcoming signals & confidence
      <PerformanceMetrics />   // Win rate, Sharpe, drawdown
    </>
  );
}

// app/api/positions/route.ts
export async function GET() {
  const positions = await kv.get('active_positions');
  const enhanced = await enrichWithMarketData(positions);
  const predictions = await generatePredictions(enhanced);

  return Response.json({
    active: enhanced,
    history: await getTradeHistory(),
    forecast: predictions
  });
}
```

### API Endpoints
- `GET /api/positions` - Get all positions (active + historical)
- `GET /api/positions/active` - Get only active positions
- `GET /api/positions/history` - Get trade history with filters

### UI Components
- `<ActivePositions />` - Real-time position cards with live P&L
- `<TradeHistory />` - Filterable table of historical trades
- `<AIForecast />` - Upcoming signals with confidence visualization
- `<PerformanceMetrics />` - Key metrics dashboard (win rate, Sharpe ratio, drawdown)

---

## Story 2: AI Agent Creation & Control

**As a** trader
**I want to** create and configure AI trading agents with specific strategies
**So that** I can deploy personalized trading algorithms

### Acceptance Criteria
- ✅ Create new agent with strategy selection (momentum/mean-reversion/arbitrage)
- ✅ Set risk parameters (max position size, stop-loss, daily limits)
- ✅ Start/pause/stop agent with single click
- ✅ Real-time agent status and decision log

### Implementation

```typescript
// app/agents/create/page.tsx
export function CreateAgent() {
  const [config, setConfig] = useState({
    strategy: 'mean_reversion',
    risk: { maxLoss: 5000, positionLimit: 20 },
    instruments: ['NIFTY50', 'BANKNIFTY'],
    mode: 'paper' // or 'live' when ready
  });

  return (
    <AgentWizard>
      <StrategySelector />
      <RiskConfiguration />
      <InstrumentPicker />
      <ReviewAndDeploy />
    </AgentWizard>
  );
}

// app/api/agents/route.ts
export async function POST(request: Request) {
  const config = await request.json();

  const agent = {
    id: generateId(),
    ...config,
    status: 'active',
    created: new Date()
  };

  await kv.set(`agent:${agent.id}`, agent);
  await startAgentCron(agent.id);

  return Response.json({ agentId: agent.id });
}
```

### API Endpoints
- `POST /api/agents` - Create new trading agent
- `GET /api/agents` - List all agents
- `GET /api/agents/:id` - Get agent details
- `PATCH /api/agents/:id` - Update agent configuration
- `POST /api/agents/:id/start` - Start agent
- `POST /api/agents/:id/pause` - Pause agent
- `POST /api/agents/:id/stop` - Stop agent
- `GET /api/agents/:id/logs` - Get agent decision logs

### UI Components
- `<AgentWizard />` - Multi-step agent creation wizard
- `<StrategySelector />` - Strategy selection (momentum, mean-reversion, arbitrage)
- `<RiskConfiguration />` - Risk parameter configuration form
- `<InstrumentPicker />` - Multi-select instrument picker
- `<AgentCard />` - Agent status card with controls
- `<DecisionLog />` - Real-time agent decision log viewer

---

## Story 3: Actionable Daily Reports

**As a** trader
**I want to** receive concise daily reports with AI recommendations
**So that** I can review and optionally delegate decisions to autopilot

### Acceptance Criteria
- ✅ Email/dashboard report at 4 PM with today's performance
- ✅ Clear BUY/SELL/HOLD recommendations with reasoning
- ✅ One-click "Execute All" for autopilot mode
- ✅ Risk alerts highlighted in red with manual intervention required

### Implementation

```typescript
// app/api/reports/daily/route.ts
export async function generateDailyReport() {
  const report = {
    date: new Date(),
    summary: {
      pnl: calculateDailyPnL(),
      trades: getTodaysTrades(),
      accuracy: calculateHitRate()
    },
    recommendations: [
      {
        symbol: 'RELIANCE',
        action: 'BUY',
        confidence: 0.82,
        reasoning: 'RSI oversold + support level',
        suggestedQty: 10,
        stopLoss: 2450
      },
      {
        symbol: 'TCS',
        action: 'HOLD',
        confidence: 0.65,
        reasoning: 'Consolidating, wait for breakout'
      }
    ],
    risks: detectRisks(),
    autopilotEnabled: await kv.get('autopilot:enabled')
  };

  if (report.autopilotEnabled) {
    await executeRecommendations(report.recommendations);
  }

  await sendEmail(report);
  return report;
}

// app/reports/page.tsx
export function DailyReportView() {
  return (
    <Card>
      <ReportSummary />
      <RecommendationsList>
        {recommendations.map(rec => (
          <RecommendationCard
            {...rec}
            onExecute={() => executeTrade(rec)}
            onDismiss={() => dismissSignal(rec.id)}
          />
        ))}
      </RecommendationsList>

      <AutopilotToggle
        enabled={autopilot}
        onToggle={toggleAutopilot}
      />
    </Card>
  );
}
```

### API Endpoints
- `GET /api/reports/daily` - Get today's daily report
- `GET /api/reports/daily/:date` - Get historical daily report
- `POST /api/reports/daily/send` - Manually trigger report email
- `POST /api/recommendations/:id/execute` - Execute single recommendation
- `POST /api/recommendations/execute-all` - Execute all recommendations
- `GET /api/autopilot` - Get autopilot status
- `POST /api/autopilot` - Enable/disable autopilot

### UI Components
- `<DailyReportView />` - Main report view page
- `<ReportSummary />` - Daily performance summary card
- `<RecommendationsList />` - List of AI recommendations
- `<RecommendationCard />` - Individual recommendation with action buttons
- `<AutopilotToggle />` - Autopilot enable/disable toggle
- `<RiskAlerts />` - Critical risk alerts section

---

## Data Models

### Position
```typescript
interface Position {
  id: string;
  symbol: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  strategy: string;
  timestamp: Date;
  status: 'OPEN' | 'CLOSED';
  stopLoss?: number;
  targetPrice?: number;
}
```

### Agent
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

### Recommendation
```typescript
interface Recommendation {
  id: string;
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  suggestedQty?: number;
  targetPrice?: number;
  stopLoss?: number;
  timestamp: Date;
  executed: boolean;
}
```

### Daily Report
```typescript
interface DailyReport {
  date: string;
  summary: {
    pnl: number;
    trades: number;
    accuracy: number;
    winRate: number;
  };
  recommendations: Recommendation[];
  risks: RiskAlert[];
  autopilotEnabled: boolean;
  timestamp: Date;
}
```

---

## Navigation Flow

```
Landing → Dashboard (Story 1)
           ├── Positions
           │   ├── Active Positions
           │   └── Trade History
           ├── AI Forecast
           └── Performance Metrics

Dashboard → Agents (Story 2)
             ├── Create New Agent
             ├── Manage Agents
             └── Agent Logs

Dashboard → Reports (Story 3)
             ├── Daily Reports
             ├── Recommendations
             └── Autopilot Settings
```

---

## Implementation Priority

### Phase 1: Story 1 - Trading Overview (Week 1-2)
1. Build position management API
2. Create active positions component
3. Implement trade history with filters
4. Add AI forecast component
5. Build performance metrics dashboard

### Phase 2: Story 2 - Agent Creation (Week 3-4)
1. Design agent configuration schema
2. Build agent creation wizard
3. Implement agent lifecycle management
4. Create agent decision logging
5. Build agent monitoring dashboard

### Phase 3: Story 3 - Daily Reports (Week 5-6)
1. Build daily report generation system
2. Implement email notification service
3. Create recommendation execution system
4. Build autopilot toggle and safety checks
5. Add risk alert highlighting

---

## Success Metrics

| Story | Metric | Target |
|-------|--------|--------|
| Story 1 | Dashboard load time | <1s |
| Story 1 | Data refresh rate | <5s |
| Story 2 | Agent creation time | <2 min |
| Story 2 | Agent uptime | >99% |
| Story 3 | Report delivery time | 4:00 PM ± 5 min |
| Story 3 | Recommendation accuracy | >60% |

---

## Notes

- All features use paper trading initially
- Live trading requires additional authentication and Zerodha API keys
- Autopilot includes safety circuit breakers and daily loss limits
- Email notifications require SMTP configuration (optional)
- All timestamps in IST (Indian Standard Time)

---

**Ready to implement**: Start with Story 1 - Trading Overview & Insights
