# PLAN.md - AI Trading Agent Development Plan

## Project Phases

### Phase 1: Core Infrastructure ✅ COMPLETED

**Objective**: Build serverless foundation with market data integration

#### Completed
- [x] Next.js 14 project setup with TypeScript
- [x] Vercel configuration with cron jobs
- [x] MCP WebSocket client for Zerodha integration
- [x] API routes (mcp, signals, risk, report)
- [x] Paper trading engine with virtual positions
- [x] AI risk manager with TensorFlow.js
- [x] Trading strategies (mean reversion, momentum)
- [x] Tailwind CSS setup for UI
- [x] Build system working end-to-end

#### Deliverables
- Working API endpoints
- Automated cron jobs
- Virtual trading system
- Risk assessment engine

---

### Phase 2: User Story 1 - Trading Overview & Insights 🔄 IN PROGRESS

**Objective**: Build dashboard with positions, history, and AI predictions

#### Tasks
- [ ] Build `/api/positions` endpoint
  - [ ] Get active positions
  - [ ] Get trade history
  - [ ] Calculate real-time P&L
- [ ] Create dashboard components
  - [ ] `<ActivePositions />` - Live position cards
  - [ ] `<TradeHistory />` - Filterable trade table
  - [ ] `<AIForecast />` - Upcoming signals
  - [ ] `<PerformanceMetrics />` - Win rate, Sharpe, drawdown
- [ ] Implement real-time updates
  - [ ] SWR for auto-refresh
  - [ ] WebSocket for live prices
- [ ] Add filtering and sorting
  - [ ] Date range filter
  - [ ] Strategy filter
  - [ ] Instrument filter

#### Acceptance Criteria
- ✅ Dashboard shows real-time P&L
- ✅ Historical trades with entry/exit points
- ✅ AI predictions with confidence scores
- ✅ One-click filtering

#### Estimated Timeline
- Week 1-2 (10-15 hours)

---

### Phase 3: User Story 2 - AI Agent Creation & Control ⏳ PENDING

**Objective**: Enable creation and management of trading agents

#### Tasks
- [ ] Design agent data model
- [ ] Build `/api/agents` endpoints
  - [ ] POST - Create agent
  - [ ] GET - List agents
  - [ ] GET /:id - Agent details
  - [ ] PATCH /:id - Update config
  - [ ] POST /:id/start - Start agent
  - [ ] POST /:id/pause - Pause agent
  - [ ] POST /:id/stop - Stop agent
- [ ] Create agent wizard UI
  - [ ] Strategy selection
  - [ ] Risk configuration
  - [ ] Instrument picker
  - [ ] Review and deploy
- [ ] Implement agent lifecycle
  - [ ] Start/pause/stop logic
  - [ ] Decision logging
  - [ ] Performance tracking
- [ ] Build agent monitoring dashboard
  - [ ] Agent status cards
  - [ ] Real-time decision log
  - [ ] Performance metrics

#### Acceptance Criteria
- ✅ Create agent with strategy selection
- ✅ Set risk parameters
- ✅ Start/pause/stop controls
- ✅ Real-time status and logs

#### Estimated Timeline
- Week 3-4 (15-20 hours)

---

### Phase 4: User Story 3 - Actionable Daily Reports ⏳ PENDING

**Objective**: Automated reports with AI recommendations and autopilot

#### Tasks
- [ ] Build `/api/reports/daily` endpoint
  - [ ] Daily P&L calculation
  - [ ] Trade summary
  - [ ] Accuracy metrics
- [ ] Generate AI recommendations
  - [ ] BUY/SELL/HOLD signals
  - [ ] Confidence scores
  - [ ] Reasoning explanations
- [ ] Implement email notifications
  - [ ] SMTP configuration
  - [ ] Email template design
  - [ ] Scheduled sending (4 PM IST)
- [ ] Build report dashboard
  - [ ] Summary cards
  - [ ] Recommendations list
  - [ ] Execute/dismiss actions
- [ ] Add autopilot mode
  - [ ] Enable/disable toggle
  - [ ] Auto-execution logic
  - [ ] Safety circuit breakers
  - [ ] Risk alerts

#### Acceptance Criteria
- ✅ Email/dashboard report at 4 PM
- ✅ Clear recommendations with reasoning
- ✅ One-click "Execute All"
- ✅ Risk alerts highlighted

#### Estimated Timeline
- Week 5-6 (10-15 hours)

---

### Phase 5: Advanced Features ⏳ FUTURE

**Objective**: Enhanced analytics and live trading preparation

#### Planned Features
- [ ] Advanced charting (candlesticks, indicators)
- [ ] Backtesting engine
- [ ] Strategy optimization
- [ ] Multi-timeframe analysis
- [ ] Portfolio rebalancing
- [ ] Social trading features
- [ ] Mobile app (React Native)
- [ ] Live trading integration (requires API keys)

#### Requirements
- Paid Zerodha API subscription
- Enhanced risk controls
- Regulatory compliance
- User authentication
- Production-grade monitoring

---

## Technology Stack

### Frontend
- Next.js 14 (App Router)
- React 18
- TypeScript 5
- Tailwind CSS 3
- SWR (data fetching)

### Backend
- Vercel Edge Functions
- Node.js 18+
- TensorFlow.js
- WebSocket (ws)

### Data & Storage
- Vercel KV (Redis)
- Vercel Postgres
- Zerodha MCP (market data)

### Deployment
- Vercel (serverless)
- GitHub (version control)
- Vercel Cron (scheduling)

---

## Risk Mitigation

### Technical Risks
- **MCP connection stability**: Implement reconnection logic ✅
- **Cron job reliability**: Monitor via Vercel dashboard
- **Data storage limits**: Track usage, upgrade if needed
- **API rate limits**: Implement caching and throttling

### Trading Risks
- **Paper trading only**: No real capital exposure ✅
- **Circuit breakers**: 2% daily loss limit ✅
- **Position limits**: Max 10% per position ✅
- **AI validation**: Confidence threshold >0.6 ✅

### Operational Risks
- **Zero-cost pilot**: Free tier constraints
- **Manual monitoring**: No 24/7 support
- **Limited backups**: Rely on Vercel infrastructure

---

## Success Criteria

### Go Criteria (Proceed to Live Trading)
- Paper trading profitable >30 days
- Win rate >55%
- Max drawdown <10%
- System uptime >95%
- Zero critical bugs

### No-Go Criteria (Stop Pilot)
- Consistent losses >2 weeks
- System reliability <90%
- Frequent AI false positives

### Pivot Criteria (Refine Strategy)
- Promising metrics but needs tuning
- Technical issues requiring architecture changes

---

## Current Status

**Phase**: Phase 1 ✅ COMPLETED, Phase 2 🔄 IN PROGRESS
**Next Milestone**: Complete User Story 1 dashboard
**Blockers**: None
**ETA**: 2 weeks to functional dashboard
