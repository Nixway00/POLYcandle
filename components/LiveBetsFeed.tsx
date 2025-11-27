'use client';

import { useEffect, useState } from 'react';
import { SupportedSymbol } from '@/lib/types';

interface LiveBet {
  id: string;
  username: string | null;
  avatar: string | null;
  isAnonymous: boolean;
  walletAddress: string | null;
  side: 'GREEN' | 'RED';
  amount: string; // Net USDC amount in pool
  paidToken: string | null;
  paidAmount: string | null; // Original amount paid
  createdAt: string;
}

interface LiveBetsFeedProps {
  symbol: SupportedSymbol;
  roundId?: string;
}

export default function LiveBetsFeed({ symbol, roundId }: LiveBetsFeedProps) {
  const [bets, setBets] = useState<LiveBet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLiveBets = async () => {
    try {
      const url = roundId 
        ? `/api/bets/live?roundId=${roundId}`
        : `/api/bets/live?symbol=${symbol}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setBets(data);
      }
    } catch (error) {
      console.error('Error fetching live bets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBets();
    
    // Refresh every 3 seconds
    const interval = setInterval(fetchLiveBets, 3000);
    
    return () => clearInterval(interval);
  }, [symbol, roundId]);

  const getDisplayInfo = (bet: LiveBet) => {
    if (bet.isAnonymous) {
      return {
        avatar: '🕶️',
        name: 'Anonymous',
      };
    }
    
    const avatar = bet.avatar || '🎯';
    const name = bet.username || (bet.walletAddress
      ? bet.walletAddress.slice(0, 6) + '...' + bet.walletAddress.slice(-4)
      : 'User');
    
    return { avatar, name };
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
  };

  const formatAmount = (bet: LiveBet) => {
    const usdcValue = parseFloat(bet.amount);
    
    // If paid with USDC or no token info, just show USDC
    if (!bet.paidToken || bet.paidToken === 'USDC' || !bet.paidAmount) {
      return `${usdcValue.toFixed(2)} USDC`;
    }
    
    // Show original token paid + USDC value
    const paidAmount = parseFloat(bet.paidAmount);
    const tokenIcon = bet.paidToken === 'SOL' ? '◎' : 
                      bet.paidToken === 'BONK' ? '🐕' : '';
    
    return (
      <div className="space-y-1">
        <div className="text-white">
          {tokenIcon} {paidAmount.toFixed(4)} {bet.paidToken}
        </div>
        <div className="text-xs text-gray-400">
          ≈ ${usdcValue.toFixed(2)} USDC
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-xl h-full flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-bold">🔴 Live Bets</h3>
        <p className="text-xs text-gray-400 mt-1">Real-time betting activity</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading bets...</div>
        ) : bets.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No bets yet. Be the first! 🚀
          </div>
        ) : (
          bets.map((bet) => {
            const displayInfo = getDisplayInfo(bet);
            return (
              <div
                key={bet.id}
                className={`p-3 rounded-lg border-l-4 ${
                  bet.side === 'GREEN'
                    ? 'bg-green-900/20 border-green-500'
                    : 'bg-red-900/20 border-red-500'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 truncate max-w-[150px]">
                    <span className="text-lg">{displayInfo.avatar}</span>
                    <span className="text-sm font-semibold truncate">
                      {displayInfo.name}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      bet.side === 'GREEN'
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}
                  >
                    {bet.side}
                  </span>
                </div>
              
              <div className="text-sm font-mono">
                {formatAmount(bet)}
              </div>
              
                <div className="text-xs text-gray-400 mt-1">
                  {formatTime(bet.createdAt)}
                </div>
              </div>
            );
          })
        )}
      </div>

      {bets.length > 0 && (
        <div className="p-3 border-t border-gray-700 bg-gray-900/50">
          <div className="text-xs text-gray-400 text-center">
            {bets.length} bet{bets.length !== 1 ? 's' : ''} placed
          </div>
        </div>
      )}
    </div>
  );
}

