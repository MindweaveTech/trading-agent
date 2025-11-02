'use client';

import { useState } from 'react';
import useSWR from 'swr';

interface Position {
  id: string;
  symbol: string;
  type: 'LONG' | 'SHORT';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  entryTime: string;
  status: 'OPEN' | 'CLOSED';
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TradeHistory() {
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterResult, setFilterResult] = useState<'ALL' | 'WIN' | 'LOSS'>('ALL');

  const { data, error, isLoading } = useSWR('/api/positions?status=CLOSED', fetcher, {
    refreshInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load trade history</p>
      </div>
    );
  }

  let positions: Position[] = data?.positions || [];

  // Apply filters
  if (filterSymbol) {
    positions = positions.filter((p) =>
      p.symbol.toLowerCase().includes(filterSymbol.toLowerCase())
    );
  }

  if (filterResult !== 'ALL') {
    positions = positions.filter((p) =>
      filterResult === 'WIN' ? p.pnl > 0 : p.pnl < 0
    );
  }

  // Sort by entry time (most recent first)
  positions.sort(
    (a, b) =>
      new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime()
  );

  const winCount = positions.filter((p) => p.pnl > 0).length;
  const lossCount = positions.filter((p) => p.pnl < 0).length;
  const totalPnL = positions.reduce((sum, p) => sum + p.pnl, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Trade History</h2>
        <div className="flex gap-2 text-sm">
          <span className="text-green-600 font-semibold">{winCount} Wins</span>
          <span className="text-gray-400">|</span>
          <span className="text-red-600 font-semibold">{lossCount} Losses</span>
          <span className="text-gray-400">|</span>
          <span
            className={`font-semibold ${
              totalPnL >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {totalPnL >= 0 ? '+' : ''}₹{totalPnL.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Filter by symbol..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterSymbol}
          onChange={(e) => setFilterSymbol(e.target.value)}
        />
        <select
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={filterResult}
          onChange={(e) =>
            setFilterResult(e.target.value as 'ALL' | 'WIN' | 'LOSS')
          }
        >
          <option value="ALL">All Trades</option>
          <option value="WIN">Wins Only</option>
          <option value="LOSS">Losses Only</option>
        </select>
      </div>

      {/* Trade List */}
      {positions.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500">No closed trades</p>
          <p className="text-sm text-gray-400 mt-2">
            {filterSymbol || filterResult !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Complete your first trade to see history'}
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-sm text-gray-600">
                <th className="px-4 py-3 font-medium">Symbol</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Quantity</th>
                <th className="px-4 py-3 font-medium">Entry</th>
                <th className="px-4 py-3 font-medium">Exit</th>
                <th className="px-4 py-3 font-medium">P&L</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {positions.map((position) => (
                <TradeRow key={position.id} position={position} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TradeRow({ position }: { position: Position }) {
  const isProfitable = position.pnl >= 0;
  const pnlColor = isProfitable ? 'text-green-600' : 'text-red-600';
  const bgColor = isProfitable ? 'bg-green-50' : 'bg-red-50';

  const entryDate = new Date(position.entryTime).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });

  return (
    <tr className={`text-sm ${bgColor}`}>
      <td className="px-4 py-3 font-semibold">{position.symbol}</td>
      <td className="px-4 py-3">
        <span
          className={`px-2 py-1 rounded text-xs ${
            position.type === 'LONG'
              ? 'bg-blue-100 text-blue-700'
              : 'bg-purple-100 text-purple-700'
          }`}
        >
          {position.type}
        </span>
      </td>
      <td className="px-4 py-3">{position.quantity}</td>
      <td className="px-4 py-3">₹{position.entryPrice.toFixed(2)}</td>
      <td className="px-4 py-3">₹{position.currentPrice.toFixed(2)}</td>
      <td className={`px-4 py-3 font-semibold ${pnlColor}`}>
        {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)}
        <span className="text-xs ml-1">
          ({position.pnlPercent >= 0 ? '+' : ''}
          {position.pnlPercent.toFixed(2)}%)
        </span>
      </td>
      <td className="px-4 py-3 text-gray-600">{entryDate}</td>
    </tr>
  );
}
