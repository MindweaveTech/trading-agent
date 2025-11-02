/**
 * Trading Dashboard
 * Real-time monitoring of positions and performance
 */

import PerformanceMetrics from '@/components/PerformanceMetrics';
import ActivePositions from '@/components/ActivePositions';
import TradeHistory from '@/components/TradeHistory';
import AuthStatus from '@/components/AuthStatus';

export default function Dashboard() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Trading Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Real-time paper trading performance
            </p>
          </div>
          <AuthStatus />
        </div>

        {/* Performance Metrics */}
        <section>
          <PerformanceMetrics />
        </section>

        {/* Active Positions */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <ActivePositions />
        </section>

        {/* Trade History */}
        <section className="bg-white rounded-lg p-6 shadow-sm">
          <TradeHistory />
        </section>
      </div>
    </main>
  );
}
