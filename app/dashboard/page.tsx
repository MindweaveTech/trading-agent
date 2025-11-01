/**
 * Trading Dashboard
 * Real-time monitoring of positions and performance
 */

export default function Dashboard() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Trading Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Total P&L"
            value="Coming Soon"
            subtitle="Virtual trading"
          />
          <MetricCard
            title="Win Rate"
            value="Coming Soon"
            subtitle="All trades"
          />
          <MetricCard
            title="Open Positions"
            value="Coming Soon"
            subtitle="Active"
          />
          <MetricCard
            title="Risk Score"
            value="Coming Soon"
            subtitle="Portfolio risk"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Signals</h2>
            <p className="text-gray-500">
              Connect to MCP server to view trading signals
            </p>
          </section>

          <section className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Active Positions</h2>
            <p className="text-gray-500">No active positions</p>
          </section>
        </div>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
      <p className="text-2xl font-bold mb-1">{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}
