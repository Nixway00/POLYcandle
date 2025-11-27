'use client';

import { useState, useEffect } from 'react';

interface GlobalStats {
  totalBets: number;
  totalUsers: number;
  totalVolume: string;
  totalPaidOut: string;
  platformFees: string;
  mostPopularAsset: string;
}

export default function StatsPage() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats/global');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">📊 Platform Statistics</h1>
          <p className="text-gray-400">Real-time stats from PolyCandle</p>
        </div>

        {loading ? (
          <p className="text-center py-12 text-gray-400">Loading statistics...</p>
        ) : !stats ? (
          <p className="text-center py-12 text-gray-400">No statistics available yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Total Bets */}
            <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-6">
              <p className="text-blue-200 text-sm mb-2">Total Bets Placed</p>
              <p className="text-4xl font-bold">{stats.totalBets.toLocaleString()}</p>
            </div>

            {/* Total Users */}
            <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-6">
              <p className="text-purple-200 text-sm mb-2">Active Users</p>
              <p className="text-4xl font-bold">{stats.totalUsers.toLocaleString()}</p>
            </div>

            {/* Total Volume */}
            <div className="bg-gradient-to-br from-green-900 to-green-800 rounded-lg p-6">
              <p className="text-green-200 text-sm mb-2">Total Volume</p>
              <p className="text-4xl font-bold">{parseFloat(stats.totalVolume).toFixed(2)} SOL</p>
            </div>

            {/* Total Paid Out */}
            <div className="bg-gradient-to-br from-yellow-900 to-yellow-800 rounded-lg p-6">
              <p className="text-yellow-200 text-sm mb-2">Total Paid Out</p>
              <p className="text-4xl font-bold">{parseFloat(stats.totalPaidOut).toFixed(2)} SOL</p>
            </div>

            {/* Platform Fees */}
            <div className="bg-gradient-to-br from-red-900 to-red-800 rounded-lg p-6">
              <p className="text-red-200 text-sm mb-2">Platform Fees (5%)</p>
              <p className="text-4xl font-bold">{parseFloat(stats.platformFees).toFixed(2)} SOL</p>
            </div>

            {/* Most Popular */}
            <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-lg p-6">
              <p className="text-indigo-200 text-sm mb-2">Most Popular Asset</p>
              <p className="text-4xl font-bold">{stats.mostPopularAsset || 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-4">About PolyCandle</h2>
          <p className="text-gray-300 mb-4">
            PolyCandle is a real-time crypto prediction platform where users bet on whether 
            5-minute candles will close green or red. Using a fair pari-mutuel betting model, 
            winners are paid from the losers' pool, minus a 5% platform fee.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-300">
            <li>✅ Fair pari-mutuel odds</li>
            <li>✅ Real-time Binance price data</li>
            <li>✅ Instant automatic payouts</li>
            <li>✅ Multi-asset support (BTC, ETH, SOL, ZEC)</li>
            <li>✅ Transparent on-chain transactions</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

