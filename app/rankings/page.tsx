'use client';

import { useState, useEffect } from 'react';

interface LeaderboardUser {
  rank: number;
  walletAddress: string;
  username: string | null;
  avatar: string | null;
  totalBets: number;
  totalWins: number;
  winRate: number;
  totalProfit: string;
}

export default function RankingsPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'profit' | 'winRate' | 'wins'>('profit');

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/rankings?sortBy=${sortBy}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrophyEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🏆 Rankings</h1>
          <p className="text-gray-400">Top performers on PolyCandle</p>
        </div>

        {/* Sort Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSortBy('profit')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'profit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            💰 Top Profit
          </button>
          <button
            onClick={() => setSortBy('winRate')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'winRate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🎯 Best Win Rate
          </button>
          <button
            onClick={() => setSortBy('wins')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              sortBy === 'wins'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            🔥 Most Wins
          </button>
        </div>

        {/* Leaderboard */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {loading ? (
            <p className="text-center py-12 text-gray-400">Loading rankings...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-center py-12 text-gray-400">No rankings yet. Be the first!</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Rank</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Player</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Bets</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Wins</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Win Rate</th>
                    <th className="px-6 py-4 text-right text-sm font-semibold">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {leaderboard.map((user) => (
                    <tr
                      key={user.walletAddress}
                      className="hover:bg-gray-700/50 transition"
                    >
                      <td className="px-6 py-4">
                        <span className="text-2xl font-bold">
                          {getTrophyEmoji(user.rank)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{user.avatar || '🎯'}</span>
                          <div>
                            <p className="font-semibold">
                              {user.username || 'Anonymous'}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.walletAddress.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {user.totalBets}
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-green-400">
                        {user.totalWins}
                      </td>
                      <td className="px-6 py-4 text-right font-mono">
                        {user.winRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`font-bold font-mono ${
                          parseFloat(user.totalProfit) >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                        }`}>
                          {parseFloat(user.totalProfit) >= 0 ? '+' : ''}
                          {parseFloat(user.totalProfit).toFixed(4)} SOL
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-900/20 border border-blue-500 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            💡 <strong>Rankings update in real-time.</strong> Keep betting and climb to the top!
          </p>
        </div>
      </div>
    </div>
  );
}

