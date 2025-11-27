'use client';

import { useState, useEffect } from 'react';

interface WalletStatus {
  solBalance: string;
  usdcBalance: string;
  needsRefill: boolean;
  canRefill: boolean;
  refillThreshold?: number;
  estimatedRefills: number;
}

export default function WalletStatusCard() {
  const [status, setStatus] = useState<WalletStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refilling, setRefilling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/wallet-status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data.wallet);
      }
    } catch (error) {
      console.error('Error fetching wallet status:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefill = async () => {
    try {
      setRefilling(true);
      setMessage(null);
      
      const response = await fetch('/api/admin/wallet-status', {
        method: 'POST',
      });
      
      const data = await response.json();
      setMessage(data.message);
      
      // Refresh status
      await fetchStatus();
    } catch (error) {
      setMessage('Failed to trigger refill');
    } finally {
      setRefilling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-gray-400">Loading wallet status...</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-900/20 border border-red-500 rounded-lg p-6">
        <p className="text-red-400">Failed to load wallet status</p>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-6 border ${
      status.needsRefill 
        ? 'bg-yellow-900/20 border-yellow-500' 
        : 'bg-green-900/20 border-green-500'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold">Platform Wallet</h3>
          <p className="text-xs text-gray-400 mt-1">Auto-refill system active</p>
        </div>
        
        {status.needsRefill && (
          <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded">
            ⚠️ Low SOL
          </span>
        )}
      </div>

      {/* Balances */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-900/50 rounded p-3">
          <p className="text-xs text-gray-400">SOL Balance</p>
          <p className={`text-xl font-bold ${
            status.needsRefill ? 'text-yellow-400' : 'text-green-400'
          }`}>
            ◎{status.solBalance}
          </p>
          {status.refillThreshold && (
            <p className="text-xs text-gray-500 mt-1">
              Threshold: {status.refillThreshold} SOL
            </p>
          )}
        </div>

        <div className="bg-gray-900/50 rounded p-3">
          <p className="text-xs text-gray-400">USDC Fees</p>
          <p className="text-xl font-bold text-blue-400">
            ${status.usdcBalance}
          </p>
          {status.estimatedRefills > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              ~{status.estimatedRefills} refills available
            </p>
          )}
        </div>
      </div>

      {/* Auto-Refill Info */}
      <div className="bg-blue-900/20 border border-blue-500 rounded p-3 mb-4">
        <p className="text-xs text-blue-300">
          🔄 <strong>Auto-Refill:</strong> When SOL drops below {status.refillThreshold}, 
          system automatically swaps 20 USDC → SOL
        </p>
      </div>

      {/* Manual Refill Button */}
      {status.needsRefill && status.canRefill && (
        <button
          onClick={handleManualRefill}
          disabled={refilling}
          className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded font-semibold transition-colors"
        >
          {refilling ? '⏳ Refilling...' : '🔧 Manual Refill Now'}
        </button>
      )}

      {status.needsRefill && !status.canRefill && (
        <div className="bg-red-900/20 border border-red-500 rounded p-3">
          <p className="text-sm text-red-400">
            ⚠️ Insufficient USDC for refill. Need at least $25 USDC.
          </p>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`mt-4 p-3 rounded ${
          message.includes('success') || message.includes('✅')
            ? 'bg-green-900/20 border border-green-500 text-green-400'
            : 'bg-gray-900/50 text-gray-300'
        }`}>
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
}

