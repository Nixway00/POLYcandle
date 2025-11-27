/**
 * Test Binance Price Feed
 * 
 * Run with: npx ts-node scripts/test-binance.ts
 */

import { getCandleOHLC, determineWinner } from '../lib/priceFeed';

async function testBinance() {
  console.log('🧪 Testing Binance Price Feed...\n');
  
  // Test with a candle from 1 hour ago
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  // Align to 5-minute window
  const startTime = new Date(Math.floor(oneHourAgo.getTime() / (5 * 60 * 1000)) * (5 * 60 * 1000));
  const endTime = new Date(startTime.getTime() + 5 * 60 * 1000);
  
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT'];
  
  for (const symbol of symbols) {
    try {
      console.log(`\n📊 Testing ${symbol}...`);
      console.log(`   Time: ${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
      
      const ohlc = await getCandleOHLC(symbol, startTime, endTime);
      const winner = determineWinner(ohlc);
      
      const change = ((ohlc.close - ohlc.open) / ohlc.open * 100).toFixed(2);
      const changeSign = change >= 0 ? '+' : '';
      
      console.log(`   Open:   $${ohlc.open.toLocaleString()}`);
      console.log(`   Close:  $${ohlc.close.toLocaleString()}`);
      console.log(`   Change: ${changeSign}${change}%`);
      console.log(`   Winner: ${winner} ${winner === 'GREEN' ? '🟢' : winner === 'RED' ? '🔴' : '⚪'}`);
      
    } catch (error) {
      console.error(`   ❌ Error:`, error.message);
    }
  }
  
  console.log('\n✅ Test completed!');
}

testBinance().catch(console.error);

