'use client';

import { useState } from 'react';
import { CurrentRoundResponse, PlaceBetRequest } from '@/lib/types';

interface BettingFormProps {
  round: CurrentRoundResponse;
  onBetPlaced: () => void;
}

export default function BettingForm({ round, onBetPlaced }: BettingFormProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedSide, setSelectedSide] = useState<'GREEN' | 'RED' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSide) {
      setMessage({ type: 'error', text: 'Please select GREEN or RED' });
      return;
    }
    
    if (!walletAddress.trim()) {
      setMessage({ type: 'error', text: 'Please enter a wallet address' });
      return;
    }
    
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setMessage(null);
      
      const requestBody: PlaceBetRequest = {
        symbol: round.symbol,
        roundId: round.id,
        side: selectedSide,
        amount: amountNum,
        walletAddress: walletAddress.trim(),
      };
      
      const response = await fetch('/api/bets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place bet');
      }
      
      const data = await response.json();
      
      setMessage({ 
        type: 'success', 
        text: `Bet placed successfully! ${data.bet.amount} on ${data.bet.side}` 
      });
      
      // Reset form
      setAmount('');
      setSelectedSide(null);
      
      // Refresh round data
      onBetPlaced();
      
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: err instanceof Error ? err.message : 'Failed to place bet' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Wallet Address
        </label>
        <input
          type="text"
          value={walletAddress}
          onChange={(e) => setWalletAddress(e.target.value)}
          placeholder="Enter your wallet address"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Amount
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter bet amount"
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Prediction
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSelectedSide('GREEN')}
            disabled={isSubmitting}
            className={`
              py-4 rounded-lg font-bold text-lg transition-all
              ${selectedSide === 'GREEN'
                ? 'bg-green-600 text-white shadow-lg scale-105 ring-2 ring-green-400'
                : 'bg-gray-700 text-gray-300 hover:bg-green-600/20'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            🟢 GREEN
          </button>
          
          <button
            type="button"
            onClick={() => setSelectedSide('RED')}
            disabled={isSubmitting}
            className={`
              py-4 rounded-lg font-bold text-lg transition-all
              ${selectedSide === 'RED'
                ? 'bg-red-600 text-white shadow-lg scale-105 ring-2 ring-red-400'
                : 'bg-gray-700 text-gray-300 hover:bg-red-600/20'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            🔴 RED
          </button>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isSubmitting || !selectedSide}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-bold text-lg transition-all"
      >
        {isSubmitting ? 'Placing Bet...' : 'Place Bet'}
      </button>
      
      {message && (
        <div className={`
          p-4 rounded-lg
          ${message.type === 'success' ? 'bg-green-900/20 border border-green-500 text-green-400' : 'bg-red-900/20 border border-red-500 text-red-400'}
        `}>
          {message.text}
        </div>
      )}
    </form>
  );
}

