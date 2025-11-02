'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

interface AuthSession {
  authenticated: boolean;
  session: {
    userId: string;
    userName: string;
    email: string;
    broker: string;
    exchanges: string[];
    createdAt: string;
    expiresAt: string;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AuthStatus() {
  const { data, error, mutate } = useSWR<AuthSession>('/api/auth/status', fetcher, {
    refreshInterval: 60000, // Check every minute
  });

  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      mutate(); // Refresh auth status
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  if (!data) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded w-32"></div>
      </div>
    );
  }

  if (!data.authenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          <span>Using Mock Data</span>
        </div>
        <a
          href="/auth/login"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Connect Zerodha
        </a>
      </div>
    );
  }

  const session = data.session!;
  const expiresAt = new Date(session.expiresAt);
  const hoursLeft = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60));

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500"></div>
        <div className="text-sm">
          <p className="font-medium text-gray-900">{session.userName}</p>
          <p className="text-xs text-gray-500">
            Expires in {hoursLeft}h
          </p>
        </div>
      </div>
      <button
        onClick={handleLogout}
        disabled={loggingOut}
        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
      >
        {loggingOut ? 'Logging out...' : 'Logout'}
      </button>
    </div>
  );
}
