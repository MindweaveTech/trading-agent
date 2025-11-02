'use client';

import useSWR from 'swr';

interface Forecast {
  symbol: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  targetPrice: number;
  currentPrice: number;
  potentialReturn: number;
  timeframe: '24h';
  timestamp: string;
}

interface ForecastData {
  success: boolean;
  forecasts: Forecast[];
  generated: string;
  timeframe: string;
  count: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AIForecast() {
  const { data, error, isLoading } = useSWR<ForecastData>(
    '/api/forecast',
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load AI forecasts</p>
      </div>
    );
  }

  const forecasts = data?.forecasts || [];

  if (forecasts.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No trading signals at this time</p>
        <p className="text-sm text-gray-400 mt-2">
          AI is monitoring market conditions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Forecast</h2>
          <p className="text-sm text-gray-500">
            Next 24-hour predictions • {forecasts.length} signals
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Last updated</p>
          <p className="text-sm font-medium text-gray-600">
            {new Date(data?.generated!).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forecasts.map((forecast) => (
          <ForecastCard key={forecast.symbol} forecast={forecast} />
        ))}
      </div>
    </div>
  );
}

function ForecastCard({ forecast }: { forecast: Forecast }) {
  const actionColors = {
    BUY: 'bg-green-100 text-green-700 border-green-300',
    SELL: 'bg-red-100 text-red-700 border-red-300',
    HOLD: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  const actionIcons = {
    BUY: '↑',
    SELL: '↓',
    HOLD: '→',
  };

  const confidenceColor =
    forecast.confidence >= 0.7
      ? 'text-green-600'
      : forecast.confidence >= 0.5
      ? 'text-yellow-600'
      : 'text-gray-600';

  const returnColor =
    forecast.potentialReturn >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold">{forecast.symbol}</h3>
        <div
          className={`px-3 py-1 rounded-full text-sm font-bold border ${
            actionColors[forecast.action]
          }`}
        >
          {actionIcons[forecast.action]} {forecast.action}
        </div>
      </div>

      {/* Confidence Score */}
      <div className="mb-3">
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-gray-500">Confidence</span>
          <span className={`font-bold ${confidenceColor}`}>
            {(forecast.confidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              forecast.confidence >= 0.7
                ? 'bg-green-500'
                : forecast.confidence >= 0.5
                ? 'bg-yellow-500'
                : 'bg-gray-500'
            }`}
            style={{ width: `${forecast.confidence * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Price Info */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-500">Current</p>
          <p className="font-semibold">₹{forecast.currentPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500">Target</p>
          <p className="font-semibold">₹{forecast.targetPrice.toFixed(2)}</p>
        </div>
      </div>

      {/* Potential Return */}
      <div className="mb-3 p-2 bg-gray-50 rounded">
        <p className="text-xs text-gray-500">Potential Return</p>
        <p className={`text-lg font-bold ${returnColor}`}>
          {forecast.potentialReturn >= 0 ? '+' : ''}
          {forecast.potentialReturn.toFixed(2)}%
        </p>
      </div>

      {/* Reasoning */}
      <div className="pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-1">AI Reasoning</p>
        <p className="text-sm text-gray-700">{forecast.reasoning}</p>
      </div>

      {/* Timeframe */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-400">
          📅 Timeframe: {forecast.timeframe}
        </p>
      </div>
    </div>
  );
}
