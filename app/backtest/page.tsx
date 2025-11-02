import Backtester from '@/components/Backtester';

export default function BacktestPage() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Strategy Backtesting
          </h1>
          <p className="text-gray-600 mt-2">
            Test your trading strategies on historical data to validate performance
            before deploying them live
          </p>
        </div>

        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-600 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                How Backtesting Works
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Select symbols and date range to simulate past trading</li>
                  <li>Choose a strategy (mean reversion, momentum, or both)</li>
                  <li>System replays historical data and executes signals</li>
                  <li>Review performance metrics, win rate, and trade history</li>
                  <li>Use results to optimize strategy parameters</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Backtester />

        <div className="mt-8 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-3">Understanding Metrics</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Performance Metrics</h3>
              <dl className="space-y-2">
                <div>
                  <dt className="font-medium text-gray-700">Win Rate</dt>
                  <dd className="text-gray-600">
                    Percentage of profitable trades. Higher is better (target: &gt;55%)
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Sharpe Ratio</dt>
                  <dd className="text-gray-600">
                    Risk-adjusted returns. &gt;1 is good, &gt;2 is excellent
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Max Drawdown</dt>
                  <dd className="text-gray-600">
                    Largest peak-to-trough decline. Lower is better (target: &lt;10%)
                  </dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Strategy Tips</h3>
              <ul className="space-y-2 text-gray-600">
                <li>Start with 1-week backtests to quickly validate ideas</li>
                <li>Compare multiple strategies on the same date range</li>
                <li>Avoid over-optimization (curve fitting)</li>
                <li>Test on different market conditions (bull, bear, sideways)</li>
                <li>Consider transaction costs (commission + slippage)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
