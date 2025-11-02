'use client';

import useSWR from 'swr';

interface RiskData {
  success: boolean;
  risk: {
    score: number;
    level: 'LOW' | 'MEDIUM' | 'HIGH';
    metrics: {
      totalPnL: number;
      winRate: number;
      openPositions: number;
      portfolioValue: number;
    };
  };
}

interface ReportData {
  success: boolean;
  report: {
    summary: {
      totalTrades: number;
      winRate: number;
      totalPnL: number;
      currentValue: number;
      initialCapital: number;
    };
    recentTrades: Array<{
      pnl: number;
      symbol: string;
    }>;
  };
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PerformanceMetrics() {
  const { data: riskData } = useSWR<RiskData>('/api/risk', fetcher, {
    refreshInterval: 10000,
  });

  const { data: reportData } = useSWR<ReportData>('/api/report', fetcher, {
    refreshInterval: 10000,
  });

  const metrics = riskData?.risk?.metrics;
  const report = reportData?.report?.summary;
  const recentTrades = reportData?.report?.recentTrades || [];
  const riskLevel = riskData?.risk?.level || 'LOW';

  // Calculate best and worst trades from recent trades
  const bestTrade = recentTrades.length > 0
    ? recentTrades.reduce((max, trade) => trade.pnl > max.pnl ? trade : max, recentTrades[0])
    : { pnl: 0 };
  const worstTrade = recentTrades.length > 0
    ? recentTrades.reduce((min, trade) => trade.pnl < min.pnl ? trade : min, recentTrades[0])
    : { pnl: 0 };
  const avgPnL = recentTrades.length > 0
    ? recentTrades.reduce((sum, trade) => sum + trade.pnl, 0) / recentTrades.length
    : 0;

  const riskColors = {
    LOW: 'bg-green-100 text-green-700 border-green-200',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    HIGH: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total P&L */}
      <MetricCard
        title="Total P&L"
        value={
          metrics
            ? `${metrics.totalPnL >= 0 ? '+' : ''}₹${metrics.totalPnL.toFixed(2)}`
            : 'Loading...'
        }
        subtitle="Paper trading"
        valueColor={
          metrics
            ? metrics.totalPnL >= 0
              ? 'text-green-600'
              : 'text-red-600'
            : 'text-gray-600'
        }
      />

      {/* Win Rate */}
      <MetricCard
        title="Win Rate"
        value={
          metrics ? `${metrics.winRate.toFixed(1)}%` : 'Loading...'
        }
        subtitle={`${report?.totalTrades || 0} total trades`}
        valueColor="text-blue-600"
      />

      {/* Open Positions */}
      <MetricCard
        title="Open Positions"
        value={metrics?.openPositions.toString() || '0'}
        subtitle="Active trades"
        valueColor="text-purple-600"
      />

      {/* Risk Score */}
      <div className="border rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">
          Risk Level
        </h3>
        <div
          className={`inline-flex px-3 py-1 rounded-lg border text-lg font-bold ${riskColors[riskLevel]}`}
        >
          {riskLevel}
        </div>
        <p className="text-xs text-gray-400 mt-2">Portfolio risk</p>
      </div>

      {/* Portfolio Value */}
      <MetricCard
        title="Portfolio Value"
        value={
          metrics
            ? `₹${metrics.portfolioValue.toLocaleString('en-IN')}`
            : 'Loading...'
        }
        subtitle="Total capital"
        valueColor="text-gray-900"
      />

      {/* Best Trade */}
      <MetricCard
        title="Best Trade"
        value={
          report && recentTrades.length > 0
            ? `+₹${bestTrade.pnl.toFixed(2)}`
            : recentTrades.length === 0
            ? 'No trades'
            : 'Loading...'
        }
        subtitle="Highest profit"
        valueColor="text-green-600"
      />

      {/* Worst Trade */}
      <MetricCard
        title="Worst Trade"
        value={
          report && recentTrades.length > 0
            ? `₹${worstTrade.pnl.toFixed(2)}`
            : recentTrades.length === 0
            ? 'No trades'
            : 'Loading...'
        }
        subtitle="Highest loss"
        valueColor="text-red-600"
      />

      {/* Average P&L */}
      <MetricCard
        title="Avg P&L"
        value={
          report && recentTrades.length > 0
            ? `${avgPnL >= 0 ? '+' : ''}₹${avgPnL.toFixed(2)}`
            : recentTrades.length === 0
            ? 'No trades'
            : 'Loading...'
        }
        subtitle="Per trade"
        valueColor={
          recentTrades.length > 0
            ? avgPnL >= 0
              ? 'text-green-600'
              : 'text-red-600'
            : 'text-gray-600'
        }
      />
    </div>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  valueColor = 'text-gray-900',
}: {
  title: string;
  value: string;
  subtitle: string;
  valueColor?: string;
}) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className={`text-2xl font-bold mb-1 ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}
