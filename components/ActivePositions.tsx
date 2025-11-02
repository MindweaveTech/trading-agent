'use client';

import { useEffect, useState } from 'react';
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
  stopLoss: number;
  targetPrice: number;
  entryTime: string;
  status: 'OPEN' | 'CLOSED';
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ActivePositions() {
  const { data, error, isLoading } = useSWR('/api/positions?status=OPEN', fetcher, {
    refreshInterval: 5000, // Refresh every 5 seconds
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load positions</p>
      </div>
    );
  }

  const positions: Position[] = data?.positions || [];

  if (positions.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No active positions</p>
        <p className="text-sm text-gray-400 mt-2">
          Open a position to start trading
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Active Positions</h2>
        <span className="text-sm text-gray-500">{positions.length} open</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {positions.map((position) => (
          <PositionCard key={position.id} position={position} />
        ))}
      </div>
    </div>
  );
}

function PositionCard({ position }: { position: Position }) {
  const isProfitable = position.pnl >= 0;
  const pnlColor = isProfitable ? 'text-green-600' : 'text-red-600';
  const bgColor = isProfitable ? 'bg-green-50' : 'bg-red-50';
  const borderColor = isProfitable ? 'border-green-200' : 'border-red-200';

  const entryDate = new Date(position.entryTime).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className={`border ${borderColor} rounded-lg p-4 ${bgColor}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold">{position.symbol}</h3>
          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
            {position.type}
          </span>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${pnlColor}`}>
            {position.pnl >= 0 ? '+' : ''}₹{position.pnl.toFixed(2)}
          </div>
          <div className={`text-sm ${pnlColor}`}>
            {position.pnlPercent >= 0 ? '+' : ''}
            {position.pnlPercent.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* Price Info */}
      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-500">Entry Price</p>
          <p className="font-semibold">₹{position.entryPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500">Current Price</p>
          <p className="font-semibold">₹{position.currentPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-500">Quantity</p>
          <p className="font-semibold">{position.quantity} shares</p>
        </div>
        <div>
          <p className="text-gray-500">Entry Time</p>
          <p className="font-semibold">{entryDate}</p>
        </div>
      </div>

      {/* Stop Loss & Target */}
      <div className="pt-3 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-500">Stop Loss</p>
            <p className="font-semibold text-red-600">
              ₹{position.stopLoss.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Target</p>
            <p className="font-semibold text-green-600">
              ₹{position.targetPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
