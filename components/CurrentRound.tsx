'use client';

import { useEffect, useState } from 'react';
import { SupportedSymbol, CurrentRoundResponse } from '@/lib/types';
import BettingFormWithWallet from './BettingFormWithWallet';

interface CurrentRoundProps {
  symbol: SupportedSymbol;
}

export default function CurrentRound({ symbol }: CurrentRoundProps) {
  const [round, setRound] = useState<CurrentRoundResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  
  // Fetch current round
  const fetchCurrentRound = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      const response = await fetch(`/api/rounds/current?symbol=${symbol}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch round');
      }
      
      const data: CurrentRoundResponse = await response.json();
      setRound(data);
      setTimeRemaining(data.timeRemaining);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setRound(null);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };
  
  // Fetch on mount and when symbol changes
  useEffect(() => {
    fetchCurrentRound(true); // Show loading on first fetch
    
    // Refresh every 5 seconds (without loading indicator)
    const interval = setInterval(() => fetchCurrentRound(false), 5000);
    
    return () => clearInterval(interval);
  }, [symbol]);
  
  // Update countdown timer
  useEffect(() => {
    if (!round) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [round]);
  
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">Loading current round...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-8 text-center">
        <p className="text-red-400">{error}</p>
        <button
          onClick={() => fetchCurrentRound()}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!round) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-400">No active round found</p>
        <p className="text-sm text-gray-500 mt-2">
          Try running the scheduler: POST /api/admin/run-scheduler
        </p>
      </div>
    );
  }
  
  const totalPool = parseFloat(round.totalGreen) + parseFloat(round.totalRed);
  const greenPercentage = totalPool > 0 ? (parseFloat(round.totalGreen) / totalPool) * 100 : 50;
  const redPercentage = totalPool > 0 ? (parseFloat(round.totalRed) / totalPool) * 100 : 50;
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Current Round</h2>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(round.startTime).toLocaleTimeString()} - {new Date(round.endTime).toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Betting closes in</p>
            <p className="text-3xl font-bold text-yellow-400">
              {formatTime(timeRemaining)}
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-green-900/20 border border-green-500 rounded-lg p-4">
            <p className="text-sm text-gray-400">GREEN Pool</p>
            <p className="text-2xl font-bold text-green-400">
              ${parseFloat(round.totalGreen).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {round.multiplierGreen ? `${round.multiplierGreen}x payout` : 'USDC value'}
            </p>
          </div>
          
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
            <p className="text-sm text-gray-400">RED Pool</p>
            <p className="text-2xl font-bold text-red-400">
              ${parseFloat(round.totalRed).toFixed(2)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {round.multiplierRed ? `${round.multiplierRed}x payout` : 'USDC value'}
            </p>
          </div>
        </div>
        
        {/* Pool Distribution Bar */}
        <div className="mb-6">
          <div className="flex h-8 rounded overflow-hidden">
            <div
              className="bg-green-500 flex items-center justify-center text-xs font-semibold"
              style={{ width: `${greenPercentage}%` }}
            >
              {greenPercentage > 15 && `${greenPercentage.toFixed(0)}%`}
            </div>
            <div
              className="bg-red-500 flex items-center justify-center text-xs font-semibold"
              style={{ width: `${redPercentage}%` }}
            >
              {redPercentage > 15 && `${redPercentage.toFixed(0)}%`}
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>GREEN: {greenPercentage.toFixed(1)}%</span>
            <span>RED: {redPercentage.toFixed(1)}%</span>
          </div>
          
          {/* Warning for unilateral betting */}
          {(parseFloat(round.totalGreen) === 0 || parseFloat(round.totalRed) === 0) && totalPool > 0 && (
            <div className="mt-3 bg-yellow-900/20 border border-yellow-600 rounded p-2">
              <p className="text-xs text-yellow-400">
                ⚠️ <strong>One-sided betting:</strong> If no one bets on the other side, all bets will be refunded at 98%.
              </p>
            </div>
          )}
        </div>
        
        {/* Betting Form */}
        <BettingFormWithWallet 
          round={round}
          onBetPlaced={fetchCurrentRound}
        />
      </div>
    </div>
  );
}

