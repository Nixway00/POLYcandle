'use client';

import { useState } from 'react';
import { getAllAvailableTokens, TokenInfo } from '@/lib/tokens';

interface TokenSelectorProps {
  selectedToken: string;
  onTokenChange: (token: string) => void;
  disabled?: boolean;
}

export default function TokenSelector({
  selectedToken,
  onTokenChange,
  disabled = false,
}: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const allTokens = getAllAvailableTokens();
  const tokens = Object.values(allTokens);
  const selected = allTokens[selectedToken];

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Select Token
      </label>
      
      {/* Selected Token Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{selected.icon}</span>
          <div className="text-left">
            <div className="font-semibold text-white">{selected.symbol}</div>
            <div className="text-xs text-gray-400">{selected.name}</div>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Token List */}
          <div className="absolute z-20 w-full mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            {tokens.map((token) => {
              const isStablecoin = ['USDC', 'USDT'].includes(token.symbol);
              const feeRate = isStablecoin ? 3 : 6;
              
              return (
                <button
                  key={token.symbol}
                  type="button"
                  onClick={() => {
                    onTokenChange(token.symbol);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                    token.symbol === selectedToken ? 'bg-gray-700' : ''
                  }`}
                >
                  <span className="text-2xl">{token.icon}</span>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{token.symbol}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        isStablecoin 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-600 text-gray-300'
                      }`}>
                        {feeRate}% fee
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{token.name}</div>
                  </div>
                  {token.symbol === selectedToken && (
                    <svg
                      className="w-5 h-5 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

