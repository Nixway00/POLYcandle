'use client';

import { useState } from 'react';
import { SUPPORTED_SYMBOLS, SYMBOL_DISPLAY, SupportedSymbol } from '@/lib/types';
import Header from '@/components/Header';
import AssetSelector from '@/components/AssetSelector';
import TradingViewWidget from '@/components/TradingViewWidget';
import CurrentRound from '@/components/CurrentRound';
import RoundHistory from '@/components/RoundHistory';

export default function Home() {
  const [selectedSymbol, setSelectedSymbol] = useState<SupportedSymbol>('BTCUSDT');
  
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Asset Selector */}
        <AssetSelector 
          selectedSymbol={selectedSymbol}
          onSelectSymbol={setSelectedSymbol}
        />
        
        {/* TradingView Chart */}
        <div className="mt-8">
          <TradingViewWidget symbol={selectedSymbol} />
        </div>
        
        {/* Current Round & Betting */}
        <div className="mt-8">
          <CurrentRound symbol={selectedSymbol} />
        </div>
        
        {/* Round History */}
        <div className="mt-8">
          <RoundHistory symbol={selectedSymbol} />
        </div>
      </div>
    </main>
  );
}

