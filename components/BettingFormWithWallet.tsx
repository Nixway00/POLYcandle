'use client';

import { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getAssociatedTokenAddress, createTransferInstruction, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { CurrentRoundResponse } from '@/lib/types';
import UserProfileSetup from './UserProfileSetup';
import TokenSelector from './TokenSelector';
import { getTokenInfo, getAllAvailableTokens } from '@/lib/tokens';

interface BettingFormProps {
  round: CurrentRoundResponse;
  onBetPlaced: () => void;
}

// Platform escrow wallet address
const PLATFORM_WALLET = process.env.NEXT_PUBLIC_PLATFORM_WALLET_PUBLIC_KEY || 'YOUR_PLATFORM_WALLET_HERE';

export default function BettingFormWithWallet({ round, onBetPlaced }: BettingFormProps) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction, connected } = useWallet();
  
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [amount, setAmount] = useState('');
  const [estimatedUsdc, setEstimatedUsdc] = useState<number | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [selectedSide, setSelectedSide] = useState<'GREEN' | 'RED' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserProfile();
    }
  }, [connected, publicKey]);

  // Estimate USDC value when token or amount changes
  useEffect(() => {
    const estimateValue = async () => {
      const amountNum = parseFloat(amount);
      
      // Reset if invalid
      if (!amount || isNaN(amountNum) || amountNum <= 0) {
        setEstimatedUsdc(null);
        setEstimateError(null);
        return;
      }
      
      // If already USDC, no conversion needed
      if (selectedToken === 'USDC') {
        setEstimatedUsdc(amountNum);
        setEstimateError(null);
        return;
      }
      
      try {
        setIsLoadingQuote(true);
        setEstimateError(null);
        const response = await fetch(
          `/api/swap/estimate?token=${selectedToken}&amount=${amountNum}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.error) {
            setEstimatedUsdc(null);
            setEstimateError(data.error + (data.details ? `: ${data.details}` : ''));
          } else {
            setEstimatedUsdc(data.estimatedUsdc);
            setEstimateError(null);
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          setEstimatedUsdc(null);
          setEstimateError(errorData.error || `HTTP ${response.status}`);
        }
      } catch (error) {
        console.error('Error estimating USDC value:', error);
        setEstimatedUsdc(null);
        setEstimateError(error instanceof Error ? error.message : 'Network error');
      } finally {
        setIsLoadingQuote(false);
      }
    };
    
    // Debounce the API call
    const timeoutId = setTimeout(estimateValue, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedToken, amount]);

  const fetchUserProfile = async () => {
    if (!publicKey) return;
    try {
      const response = await fetch(`/api/user/profile?wallet=${publicKey.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!connected || !publicKey) {
      setMessage({ type: 'error', text: 'Please connect your wallet first' });
      return;
    }
    
    if (!selectedSide) {
      setMessage({ type: 'error', text: 'Please select GREEN or RED' });
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
      
      const tokenInfo = getTokenInfo(selectedToken);
      if (!tokenInfo) {
        throw new Error(`Token ${selectedToken} not supported`);
      }
      
      // Validate platform wallet
      if (!PLATFORM_WALLET || PLATFORM_WALLET === 'YOUR_PLATFORM_WALLET_HERE') {
        throw new Error('Platform wallet not configured. Please contact support.');
      }
      
      let platformWalletPubkey: PublicKey;
      try {
        platformWalletPubkey = new PublicKey(PLATFORM_WALLET);
      } catch (error) {
        throw new Error(`Invalid platform wallet address: ${PLATFORM_WALLET}`);
      }
      
      const transaction = new Transaction();
      
      // Handle SOL (native) vs SPL tokens
      if (selectedToken === 'SOL') {
        // Native SOL transfer
        const lamports = Math.floor(amountNum * LAMPORTS_PER_SOL);
        console.log(`[Bet] Transferring ${amountNum} SOL = ${lamports} lamports`);
        
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: platformWalletPubkey,
            lamports,
          })
        );
      } else {
        // SPL Token transfer (USDC, BONK, etc.)
        const tokenMint = new PublicKey(tokenInfo.mint);
        
        // Get associated token accounts
        const fromTokenAccount = await getAssociatedTokenAddress(
          tokenMint,
          publicKey
        );
        
        const toTokenAccount = await getAssociatedTokenAddress(
          tokenMint,
          platformWalletPubkey
        );
        
        // Convert amount to smallest unit
        // Example: 100 BONK with 5 decimals = 100 * 10^5 = 10,000,000
        const amountInSmallestUnit = BigInt(
          Math.floor(amountNum * Math.pow(10, tokenInfo.decimals))
        );
        
        console.log(`[Bet] Transferring ${amountNum} ${selectedToken}`);
        console.log(`[Bet] Token decimals: ${tokenInfo.decimals}`);
        console.log(`[Bet] Amount in smallest unit: ${amountInSmallestUnit.toString()}`);
        console.log(`[Bet] Calculation: ${amountNum} * 10^${tokenInfo.decimals} = ${amountInSmallestUnit.toString()}`);
        
        // Create transfer instruction
        transaction.add(
          createTransferInstruction(
            fromTokenAccount,
            toTokenAccount,
            publicKey,
            amountInSmallestUnit,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      setMessage({ 
        type: 'success', 
        text: `Payment sent! ${selectedToken !== 'USDC' ? 'Processing swap and ' : ''}placing bet...` 
      });
      
      await connection.confirmTransaction(signature, 'confirmed');
      
      // Record bet in database (backend will handle swap)
      const requestBody = {
        symbol: round.symbol,
        roundId: round.id,
        side: selectedSide,
        walletAddress: publicKey.toString(),
        transactionSignature: signature,
        paidToken: selectedToken,
        paidAmount: amountNum,
        estimatedUsdc: estimatedUsdc,
        username: userProfile?.username || null,
        isAnonymous: userProfile?.isAnonymous || false,
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
        text: `Bet placed! ${data.bet.amount} USDC on ${data.bet.side} 🎉` 
      });
      
      // Reset form
      setAmount('');
      setSelectedSide(null);
      setEstimatedUsdc(null);
      
      // Refresh round data
      onBetPlaced();
      
    } catch (err: any) {
      console.error('Error placing bet:', err);
      setMessage({ 
        type: 'error', 
        text: err.message || 'Failed to place bet. Please try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!connected) {
    return (
      <div className="bg-gray-700 rounded-lg p-6 text-center">
        <p className="text-gray-300 mb-4">
          Connect your wallet to start betting
        </p>
        <p className="text-sm text-gray-400">
          Click "Select Wallet" in the header to connect Phantom
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* User Profile Setup */}
      <UserProfileSetup />
      
      <form onSubmit={handleSubmit} className="space-y-4">
      
      {/* Token Selector */}
      <TokenSelector
        selectedToken={selectedToken}
        onTokenChange={setSelectedToken}
        disabled={isSubmitting}
      />
      
      {/* Amount Input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Amount ({selectedToken})
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`Enter bet amount in ${selectedToken}`}
          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isSubmitting}
        />
        
        {/* USDC Value Display */}
        {amount && parseFloat(amount) > 0 && (
          <div className={`mt-2 p-3 rounded border ${
            estimateError 
              ? 'bg-red-900/20 border-red-500' 
              : 'bg-blue-900/20 border-blue-500'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${estimateError ? 'text-red-300' : 'text-blue-300'}`}>
                Bet Value:
              </span>
              <span className={`text-lg font-bold ${
                estimateError ? 'text-red-200' : 'text-blue-200'
              }`}>
                {isLoadingQuote ? (
                  '⏳ Loading...'
                ) : estimatedUsdc !== null ? (
                  `~${estimatedUsdc.toFixed(2)} USDC`
                ) : estimateError ? (
                  '❌ Error'
                ) : (
                  'Unable to estimate'
                )}
              </span>
            </div>
            {estimateError && (
              <p className="text-xs text-red-400 mt-1">
                {estimateError}
              </p>
            )}
            {selectedToken !== 'USDC' && estimatedUsdc !== null && !estimateError && (
              <p className="text-xs text-blue-400 mt-1">
                Your {amount} {selectedToken} will be automatically swapped to USDC
              </p>
            )}
          </div>
        )}
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
        {isSubmitting ? 'Processing...' : 'Place Bet'}
      </button>
      
      {message && (
        <div className={`
          p-4 rounded-lg
          ${message.type === 'success' ? 'bg-green-900/20 border border-green-500 text-green-400' : 'bg-red-900/20 border border-red-500 text-red-400'}
        `}>
          {message.text}
        </div>
      )}
      
      <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-3">
        <p className="text-xs text-blue-300 mb-2">
          💎 <strong>Multi-Token Betting:</strong> Bet with 8+ tokens!
        </p>
        <p className="text-xs text-blue-400 mb-2">
          All bets converted to USDC. Winners receive automatic USDC payouts.
        </p>
        <div className="flex gap-2 text-xs">
          <div className="flex-1 bg-green-900/30 border border-green-600 rounded px-2 py-1">
            <span className="text-green-400 font-bold">USDC/USDT: 3% fee</span>
          </div>
          <div className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1">
            <span className="text-gray-300">Others: 6% fee</span>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-900/20 border border-yellow-500 rounded-lg p-3">
        <p className="text-xs text-yellow-300">
          ⚠️ <strong>Fair Play Rule:</strong> If only one side has bets by round end, all bets are refunded at 98% (2% covers gas fees).
        </p>
      </div>
      </form>
    </div>
  );
}

