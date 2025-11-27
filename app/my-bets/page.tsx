'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Bet {
  id: string;
  side: string;
  amount: string;
  payout: string;
  status: string;
  createdAt: string;
  round: {
    symbol: string;
    winnerSide: string | null;
    startTime: string;
    endTime: string;
  };
}

export default function MyBetsPage() {
  const { connected, publicKey } = useWallet();
  const router = useRouter();
  const [bets, setBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'won' | 'lost' | 'pending'>('all');

  useEffect(() => {
    if (!connected) {
      router.push('/');
      return;
    }

    if (publicKey) {
      fetchBets();
    }
  }, [connected, publicKey]);

  const fetchBets = async () => {
    if (!publicKey) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/user/bets?wallet=${publicKey.toString()}&limit=100`);
      if (response.ok) {
        const data = await response.json();
        setBets(data);
      }
    } catch (error) {
      console.error('Error fetching bets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredBets = bets.filter(bet => {
    if (filter === 'all') return true;
    if (filter === 'won') return bet.status === 'WON';
    if (filter === 'lost') return bet.status === 'LOST';
    if (filter === 'pending') return bet.status === 'PENDING';
    return true;
  });

  if (!connected) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="container mx-auto max-w-6xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">📜 My Bets</h1>
            <p className="text-gray-400">Your complete betting history</p>
          </div>
          <Link
            href="/profile"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
          >
            View Profile
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'won', 'lost', 'pending'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-medium capitalize transition ${
                filter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Bets List */}
        {loading ? (
          <p className="text-center py-12 text-gray-400">Loading bets...</p>
        ) : filteredBets.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-12 text-center">
            <p className="text-gray-400 mb-4">No bets found</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Start Betting
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBets.map((bet) => (
              <div
                key={bet.id}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xl font-bold">{bet.round.symbol}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        bet.side === 'GREEN'
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {bet.side}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        bet.status === 'WON' ? 'bg-green-900/50 text-green-300' :
                        bet.status === 'LOST' ? 'bg-red-900/50 text-red-300' :
                        'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {bet.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(bet.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-gray-400 text-sm">Bet Amount</p>
                    <p className="font-mono font-bold">{parseFloat(bet.amount).toFixed(4)} SOL</p>
                    {bet.status === 'WON' && (
                      <>
                        <p className="text-green-400 text-sm mt-1">Payout</p>
                        <p className="font-mono font-bold text-green-400">
                          +{parseFloat(bet.payout).toFixed(4)} SOL
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

