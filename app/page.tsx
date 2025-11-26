'use client';

import { useState } from 'react';
import { SUPPORTED_SYMBOLS, SYMBOL_DISPLAY, SupportedSymbol } from '@/lib/types';
import Header from '@/components/Header';
import AssetSelector from '@/components/AssetSelector';
import TradingViewWidget from '@/components/TradingViewWidget';
import CurrentRound from '@/components/CurrentRound';
import RoundHistory from '@/components/RoundHistory';
import LiveBetsFeed from '@/components/LiveBetsFeed';

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
        
        {/* Main Layout with Sidebar */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3 space-y-8">
            {/* TradingView Chart */}
            <TradingViewWidget symbol={selectedSymbol} />
            
            {/* Current Round & Betting */}
            <CurrentRound symbol={selectedSymbol} />
            
            {/* Round History */}
            <RoundHistory symbol={selectedSymbol} />
          </div>
          
          {/* Live Bets Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-4">
              <LiveBetsFeed symbol={selectedSymbol} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

