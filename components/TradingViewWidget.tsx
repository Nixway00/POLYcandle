'use client';

import { useEffect, useRef } from 'react';
import { SupportedSymbol } from '@/lib/types';

interface TradingViewWidgetProps {
  symbol: SupportedSymbol;
}

/**
 * TradingView Advanced Chart Widget
 * 
 * Official widget from TradingView that displays live price charts
 */
export default function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Clear previous widget
    containerRef.current.innerHTML = '';
    
    // Create script element for TradingView widget
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => {
      if (typeof (window as any).TradingView !== 'undefined') {
        new (window as any).TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${symbol}`,
          interval: '5',
          timezone: 'Etc/UTC',
          theme: 'dark',
          style: '1',
          locale: 'en',
          toolbar_bg: '#f1f3f6',
          enable_publishing: false,
          hide_side_toolbar: false,
          allow_symbol_change: false,
          container_id: 'tradingview_widget',
        });
      }
    };
    
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'tradingview_widget';
    widgetContainer.style.height = '500px';
    
    containerRef.current.appendChild(widgetContainer);
    document.head.appendChild(script);
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol]);
  
  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden shadow-xl">
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Live Chart - {symbol}</h2>
        <p className="text-sm text-gray-400">5-minute timeframe</p>
      </div>
      <div ref={containerRef} className="h-[500px]" />
    </div>
  );
}

