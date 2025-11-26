'use client';

import { useEffect, useState } from 'react';
import { SupportedSymbol, HistoryRoundResponse } from '@/lib/types';

interface RoundHistoryProps {
  symbol: SupportedSymbol;
}

export default function RoundHistory({ symbol }: RoundHistoryProps) {
  const [rounds, setRounds] = useState<HistoryRoundResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/rounds/history?symbol=${symbol}&limit=10`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch history');
        }
        
        const data: HistoryRoundResponse[] = await response.json();
        setRounds(data);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setRounds([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchHistory, 30000);
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  const getWinnerBadge = (winner: string | null) => {
    if (winner === 'GREEN') {
      return <span className="px-2 py-1 bg-green-600 rounded text-xs font-semibold">🟢 GREEN</span>;
    }
    if (winner === 'RED') {
      return <span className="px-2 py-1 bg-red-600 rounded text-xs font-semibold">🔴 RED</span>;
    }
    if (winner === 'DRAW') {
      return <span className="px-2 py-1 bg-gray-600 rounded text-xs font-semibold">⚪ DRAW</span>;
    }
    return <span className="px-2 py-1 bg-gray-700 rounded text-xs">Unknown</span>;
  };
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold">Round History</h2>
        <p className="text-sm text-gray-400 mt-1">Last 10 settled rounds for {symbol}</p>
      </div>
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-400">
            Loading history...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-400">
            {error}
          </div>
        ) : rounds.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No settled rounds yet
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-900 text-sm">
              <tr>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-left">Winner</th>
                <th className="px-6 py-3 text-right">Green Pool</th>
                <th className="px-6 py-3 text-right">Red Pool</th>
                <th className="px-6 py-3 text-right">Green Mult.</th>
                <th className="px-6 py-3 text-right">Red Mult.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {rounds.map((round) => (
                <tr key={round.id} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-4 text-sm">
                    {new Date(round.startTime).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4">
                    {getWinnerBadge(round.winnerSide)}
                  </td>
                  <td className="px-6 py-4 text-right text-green-400 font-mono">
                    {parseFloat(round.totalGreen).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-red-400 font-mono">
                    {parseFloat(round.totalRed).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-300 font-mono">
                    {round.multiplierGreen ? `${parseFloat(round.multiplierGreen).toFixed(2)}x` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-300 font-mono">
                    {round.multiplierRed ? `${parseFloat(round.multiplierRed).toFixed(2)}x` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

