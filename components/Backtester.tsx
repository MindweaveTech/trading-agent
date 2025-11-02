'use client';

import { useState } from 'react';
import { BacktestResult, BacktestConfig } from '@/lib/backtester';

const AVAILABLE_SYMBOLS = [
  'RELIANCE',
  'TCS',
  'INFY',
  'HDFCBANK',
  'ICICIBANK',
  'WIPRO',
  'ITC',
  'HDFC',
  'SBIN',
  'BAJFINANCE',
];

const STRATEGY_OPTIONS = [
  { value: 'mean_reversion', label: 'Mean Reversion (RSI-based)' },
  { value: 'momentum', label: 'Momentum (SMA crossover)' },
  { value: 'both', label: 'Both Strategies' },
];

const DATE_PRESETS = [
  { value: '1week', label: 'Last 1 Week' },
  { value: '1month', label: 'Last 1 Month' },
  { value: '3months', label: 'Last 3 Months' },
  { value: '6months', label: 'Last 6 Months' },
  { value: '1year', label: 'Last 1 Year' },
  { value: 'custom', label: 'Custom Range' },
];

export default function Backtester() {
  const [config, setConfig] = useState<Partial<BacktestConfig>>({
    symbols: ['RELIANCE', 'TCS', 'INFY'],
    strategy: 'both',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    initialCapital: 100000,
    positionSize: 10,
    commission: 0.1,
    slippage: 0.05,
  });

  const [result, setResult] = useState<BacktestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoadingSuggestion, setIsLoadingSuggestion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [progress, setProgress] = useState<string>('');

  const handleSymbolToggle = (symbol: string) => {
    const current = config.symbols || [];
    const updated = current.includes(symbol)
      ? current.filter((s) => s !== symbol)
      : [...current, symbol];
    setConfig({ ...config, symbols: updated });
  };

  const handleDatePreset = (preset: string) => {
    if (preset === 'custom') {
      // User will manually set dates
      return;
    }

    const now = Date.now();
    const presetDays: Record<string, number> = {
      '1week': 7,
      '1month': 30,
      '3months': 90,
      '6months': 180,
      '1year': 365,
    };

    const days = presetDays[preset] || 7;
    setConfig({
      ...config,
      startDate: new Date(now - days * 24 * 60 * 60 * 1000),
      endDate: new Date(),
    });
  };

  const runAISmartBacktest = async () => {
    setIsLoadingSuggestion(true);
    setError(null);
    setResult(null);
    setAiSuggestion(null);
    setProgress('Analyzing market conditions...');

    try {
      // Step 1: Get AI suggestion
      const suggestResponse = await fetch('/api/backtest/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ riskProfile: 'moderate' }),
      });

      const suggestData = await suggestResponse.json();

      if (!suggestData.success) {
        throw new Error(suggestData.error || 'Failed to get AI suggestion');
      }

      setAiSuggestion(suggestData.suggestion);
      setProgress('AI strategy selected! Running backtest...');
      setIsLoadingSuggestion(false);
      setIsRunning(true);

      // Step 2: Apply AI suggestion to config
      const aiConfig = {
        symbols: suggestData.suggestion.symbols,
        strategy: suggestData.suggestion.strategy,
        startDate: suggestData.suggestion.startDate,
        endDate: suggestData.suggestion.endDate,
        initialCapital: suggestData.suggestion.initialCapital,
        positionSize: suggestData.suggestion.positionSize,
        commission: suggestData.suggestion.commission,
        slippage: suggestData.suggestion.slippage,
      };

      setConfig({
        ...aiConfig,
        startDate: new Date(aiConfig.startDate),
        endDate: new Date(aiConfig.endDate),
      });

      // Step 3: Run backtest with AI parameters
      setProgress('Fetching historical data...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress('Calculating indicators...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress('Simulating trades...');
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Backtest failed');
      }

      setProgress('Analysis complete!');
      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'Failed to run AI backtest');
    } finally {
      setIsRunning(false);
      setIsLoadingSuggestion(false);
      setProgress('');
    }
  };

  const runBacktest = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);
    setProgress('Running backtest...');

    try {
      setProgress('Fetching historical data...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress('Calculating indicators...');
      await new Promise(resolve => setTimeout(resolve, 300));

      setProgress('Simulating trades...');
      const response = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          startDate: config.startDate?.toISOString(),
          endDate: config.endDate?.toISOString(),
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || data.message || 'Backtest failed');
      }

      setProgress('Analysis complete!');
      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'Failed to run backtest');
    } finally {
      setIsRunning(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Smart Backtest Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900">AI-Powered Smart Backtest</h3>
              <span className="px-2 py-1 text-xs font-semibold bg-blue-600 text-white rounded-full">NEW</span>
            </div>
            <p className="text-sm text-gray-700 mb-4">
              Let AI analyze current market conditions and automatically suggest the best strategy, symbols, and parameters for optimal backtesting results.
            </p>
            {aiSuggestion && (
              <div className="bg-white rounded-lg p-4 mb-4 border border-blue-300">
                <h4 className="font-semibold text-gray-900 mb-2">AI Analysis Complete</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Strategy: </span>
                    <span className="font-medium text-gray-900 capitalize">
                      {aiSuggestion.analysis?.strategyReason?.split('.')[0]}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Confidence: </span>
                    <span className="font-medium text-green-600">{aiSuggestion.analysis?.strategyConfidence}%</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Market: </span>
                    <span className="font-medium text-gray-900">{aiSuggestion.analysis?.marketCondition}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Symbols: </span>
                    <span className="font-medium text-gray-900">{aiSuggestion.symbols?.join(', ')}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2 italic">{aiSuggestion.analysis?.strategyReason}</p>
              </div>
            )}
            {progress && (
              <div className="bg-white rounded-lg p-3 mb-4 border border-blue-300">
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">{progress}</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={runAISmartBacktest}
            disabled={isRunning || isLoadingSuggestion}
            className="ml-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            {(isRunning || isLoadingSuggestion) ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Running...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Smart Backtest</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-4 bg-gray-50 text-gray-500">or configure manually</span>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-bold mb-4">Manual Configuration</h2>

        {/* Symbol Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Symbols
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {AVAILABLE_SYMBOLS.map((symbol) => (
              <button
                key={symbol}
                onClick={() => handleSymbolToggle(symbol)}
                className={`px-3 py-2 rounded border text-sm font-medium transition-colors ${
                  config.symbols?.includes(symbol)
                    ? 'bg-blue-100 border-blue-500 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Strategy Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Trading Strategy
          </label>
          <select
            value={config.strategy}
            onChange={(e) =>
              setConfig({ ...config, strategy: e.target.value as any })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {STRATEGY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
            {DATE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                onClick={() => handleDatePreset(preset.value)}
                className="px-3 py-2 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={config.startDate?.toISOString().split('T')[0]}
                onChange={(e) =>
                  setConfig({ ...config, startDate: new Date(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={config.endDate?.toISOString().split('T')[0]}
                onChange={(e) =>
                  setConfig({ ...config, endDate: new Date(e.target.value) })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Capital & Position Size */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Initial Capital (₹)
            </label>
            <input
              type="number"
              value={config.initialCapital}
              onChange={(e) =>
                setConfig({
                  ...config,
                  initialCapital: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="10000"
              step="10000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position Size (%)
            </label>
            <input
              type="number"
              value={config.positionSize}
              onChange={(e) =>
                setConfig({
                  ...config,
                  positionSize: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              min="1"
              max="100"
              step="1"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showAdvanced ? '− Hide' : '+ Show'} Advanced Settings
          </button>

          {showAdvanced && (
            <div className="mt-3 grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Commission (%)
                </label>
                <input
                  type="number"
                  value={config.commission}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      commission: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                  max="5"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">
                  Slippage (%)
                </label>
                <input
                  type="number"
                  value={config.slippage}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      slippage: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  min="0"
                  max="5"
                  step="0.01"
                />
              </div>
            </div>
          )}
        </div>

        {/* Run Button */}
        <button
          onClick={runBacktest}
          disabled={isRunning || !config.symbols || config.symbols.length === 0}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isRunning ? 'Running Backtest...' : 'Run Backtest'}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Results Display */}
      {result && (
        <div className="space-y-6">
          {/* Summary Metrics */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Backtest Results</h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                title="Total P&L"
                value={`₹${result.summary.totalPnL.toFixed(2)}`}
                subtitle={`${result.summary.returnPercent.toFixed(2)}% return`}
                valueColor={
                  result.summary.totalPnL >= 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              />
              <MetricCard
                title="Win Rate"
                value={`${result.summary.winRate.toFixed(1)}%`}
                subtitle={`${result.summary.winningTrades}W / ${result.summary.losingTrades}L`}
                valueColor="text-blue-600"
              />
              <MetricCard
                title="Total Trades"
                value={result.summary.totalTrades.toString()}
                subtitle={`${result.config.symbols.join(', ')}`}
                valueColor="text-gray-900"
              />
              <MetricCard
                title="Sharpe Ratio"
                value={result.summary.sharpeRatio.toFixed(2)}
                subtitle="Risk-adjusted return"
                valueColor={
                  result.summary.sharpeRatio > 1
                    ? 'text-green-600'
                    : 'text-gray-600'
                }
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <MetricCard
                title="Max Drawdown"
                value={`₹${result.summary.maxDrawdown.toFixed(2)}`}
                subtitle={`${result.summary.maxDrawdownPercent.toFixed(2)}%`}
                valueColor="text-red-600"
              />
              <MetricCard
                title="Profit Factor"
                value={result.summary.profitFactor.toFixed(2)}
                subtitle="Gross profit / loss"
                valueColor="text-blue-600"
              />
              <MetricCard
                title="Avg Win"
                value={`₹${result.summary.averageWin.toFixed(2)}`}
                subtitle="Per winning trade"
                valueColor="text-green-600"
              />
              <MetricCard
                title="Avg Loss"
                value={`₹${result.summary.averageLoss.toFixed(2)}`}
                subtitle="Per losing trade"
                valueColor="text-red-600"
              />
            </div>
          </div>

          {/* Equity Curve (Placeholder) */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Equity Curve</h3>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">
                Chart visualization (requires charting library)
              </p>
            </div>
          </div>

          {/* Trade List */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">
              Trade History ({result.trades.filter((t) => t.action === 'SELL').length} completed)
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Date
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Symbol
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Action
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">
                      Price
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">
                      Qty
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">
                      P&L
                    </th>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {result.trades
                    .filter((t) => t.action === 'SELL')
                    .map((trade, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-600">
                          {new Date(trade.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2 font-medium">{trade.symbol}</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              trade.action === 'BUY'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {trade.action}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">
                          ₹{trade.price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">{trade.quantity}</td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${
                            (trade.pnl || 0) >= 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {trade.pnl !== undefined
                            ? `${trade.pnl >= 0 ? '+' : ''}₹${trade.pnl.toFixed(2)}`
                            : '-'}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">
                          {trade.reason}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
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
    <div className="border rounded-lg p-4">
      <h4 className="text-xs font-medium text-gray-500 mb-1">{title}</h4>
      <p className={`text-xl font-bold mb-1 ${valueColor}`}>{value}</p>
      <p className="text-xs text-gray-400">{subtitle}</p>
    </div>
  );
}
