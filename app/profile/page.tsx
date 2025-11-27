'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import UserProfileSetup from '@/components/UserProfileSetup';

interface UserStats {
  username: string | null;
  avatar: string | null;
  isAnonymous: boolean;
  stats: {
    totalBets: number;
    totalWins: number;
    totalLosses: number;
    winRate: number;
  };
}

interface RecentBet {
  id: string;
  side: string;
  amount: string;
  payout: string;
  status: string;
  createdAt: string;
  round: {
    symbol: string;
    winnerSide: string | null;
  };
}

export default function ProfilePage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [profile, setProfile] = useState<UserStats | null>(null);
  const [recentBets, setRecentBets] = useState<RecentBet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!connected) {
      router.push('/');
      return;
    }

    if (publicKey) {
      fetchProfile();
      fetchRecentBets();
    }
  }, [connected, publicKey]);

  const fetchProfile = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`/api/user/profile?wallet=${publicKey.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentBets = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(`/api/user/bets?wallet=${publicKey.toString()}&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setRecentBets(data);
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
    }
  };

  if (!connected) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
        <div className="container mx-auto">
          <p className="text-center text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6">
              <UserProfileSetup />
              
              {profile && (
                <div className="mt-6 space-y-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">{profile.avatar || '🎯'}</div>
                    <h2 className="text-2xl font-bold">
                      {profile.username || 'Anonymous User'}
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-6)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats Grid */}
            {profile && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Total Bets</p>
                  <p className="text-3xl font-bold mt-1">{profile.stats.totalBets}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Wins</p>
                  <p className="text-3xl font-bold mt-1 text-green-400">{profile.stats.totalWins}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Losses</p>
                  <p className="text-3xl font-bold mt-1 text-red-400">{profile.stats.totalLosses}</p>
                </div>
                <div className="bg-gray-800 rounded-lg p-4">
                  <p className="text-gray-400 text-sm">Win Rate</p>
                  <p className="text-3xl font-bold mt-1">{profile.stats.winRate.toFixed(0)}%</p>
                </div>
              </div>
            )}

            {/* Recent Bets */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Recent Bets</h3>
              
              {recentBets.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No bets yet. Start betting!</p>
              ) : (
                <div className="space-y-3">
                  {recentBets.map((bet) => (
                    <div
                      key={bet.id}
                      className="bg-gray-700 rounded-lg p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">{bet.round.symbol}</p>
                        <p className="text-sm text-gray-400">
                          {new Date(bet.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          bet.side === 'GREEN' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {bet.side} • {bet.amount} SOL
                        </p>
                        <p className={`text-sm ${
                          bet.status === 'WON' ? 'text-green-400' :
                          bet.status === 'LOST' ? 'text-red-400' :
                          'text-yellow-400'
                        }`}>
                          {bet.status}
                          {bet.status === 'WON' && ` (+${bet.payout})`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

