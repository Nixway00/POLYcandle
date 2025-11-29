import { NextResponse } from 'next/server';
import { getCandleOHLC, determineWinner } from '@/lib/priceFeed';

// Force dynamic rendering (calls external API)
export const dynamic = 'force-dynamic';

/**
 * GET /api/test/binance
 * 
 * Test endpoint to verify Binance price feed is working
 */
export async function GET() {
  try {
    console.log('🧪 Testing Binance Price Feed...');
    
    // Test with a candle from 1 hour ago
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Align to 5-minute window
    const TIMEFRAME_MS = 5 * 60 * 1000;
    const startTime = new Date(Math.floor(oneHourAgo.getTime() / TIMEFRAME_MS) * TIMEFRAME_MS);
    const endTime = new Date(startTime.getTime() + TIMEFRAME_MS);
    
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ZECUSDT'];
    const results = [];
    
    for (const symbol of symbols) {
      try {
        const ohlc = await getCandleOHLC(symbol, startTime, endTime);
        const winner = determineWinner(ohlc);
        
        const changeNum = ((ohlc.close - ohlc.open) / ohlc.open * 100);
        const change = changeNum.toFixed(2);
        
        results.push({
          symbol,
          timeframe: `${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`,
          open: ohlc.open,
          close: ohlc.close,
          change: `${change}%`,
          winner,
          success: true,
        });
        
      } catch (error) {
        results.push({
          symbol,
          error: error instanceof Error ? error.message : 'Unknown error',
          success: false,
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Binance price feed test completed',
      timestamp: new Date().toISOString(),
      testWindow: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
      },
      results,
    });
    
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

