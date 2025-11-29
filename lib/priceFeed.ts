/**
 * Price Feed Module
 * 
 * REAL IMPLEMENTATION using Binance API
 * 
 * This module provides actual candle OHLC data from Binance exchange.
 * No more mock data - these are real market prices!
 */

export interface CandleOHLC {
  open: number;
  high: number;
  low: number;
  close: number;
}

interface BinanceKlineResponse {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  trades: number;
  takerBuyBaseAsset: string;
  takerBuyQuoteAsset: string;
}

/**
 * Fetches REAL OHLC data from Binance API
 * 
 * @param symbol - Trading pair (e.g., "BTCUSDT", "ETHUSDT")
 * @param startTime - Candle start time
 * @param endTime - Candle end time
 * @returns Promise with real open and close prices from Binance
 */
export async function getCandleOHLC(
  symbol: string,
  startTime: Date,
  endTime: Date
): Promise<Pick<CandleOHLC, 'open' | 'close'>> {
  try {
    console.log(`[Binance] Fetching real candle for ${symbol} from ${startTime.toISOString()} to ${endTime.toISOString()}`);
    
    const startTimeMs = startTime.getTime();
    const endTimeMs = endTime.getTime();
    
    // Binance API endpoint
    const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&startTime=${startTimeMs}&endTime=${endTimeMs}&limit=1`;
    
    console.log(`[Binance] Request URL: ${url}`);
    
    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Binance] API error response: ${errorText}`);
        throw new Error(`Binance API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        // Try to get the most recent candle if exact time not found
        console.warn(`[Binance] No exact candle found, trying latest candle...`);
        const latestUrl = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=5m&limit=1`;
        const latestResponse = await fetch(latestUrl, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
        });
        
        if (!latestResponse.ok) {
          throw new Error(`Binance API error fetching latest: ${latestResponse.status}`);
        }
        
        const latestData = await latestResponse.json();
        if (!latestData || latestData.length === 0) {
          throw new Error(`No candle data available for ${symbol}`);
        }
        
        const kline = latestData[0];
        const open = parseFloat(kline[1]);
        const close = parseFloat(kline[4]);
        
        console.log(`[Binance] ✅ Using latest candle for ${symbol}: open=${open}, close=${close}`);
        
        return { open, close };
      }
      
      // Binance kline format: [timestamp, open, high, low, close, volume, ...]
      const kline = data[0];
      const open = parseFloat(kline[1]);
      const close = parseFloat(kline[4]);
      
      if (isNaN(open) || isNaN(close)) {
        throw new Error(`Invalid price data from Binance: open=${kline[1]}, close=${kline[4]}`);
      }
      
      console.log(`[Binance] ✅ Real data for ${symbol}: open=${open}, close=${close}, outcome=${close > open ? 'GREEN' : close < open ? 'RED' : 'DRAW'}`);
      
      return {
        open,
        close,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Binance API request timeout (10s)');
      }
      throw fetchError;
    }
    
  } catch (error) {
    console.error(`[Binance] ❌ Error fetching candle for ${symbol}:`, error);
    
    // In caso di errore, logga e rilancia
    // NON usare mock data in produzione!
    throw new Error(`Failed to fetch real price data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Determines the winner side based on OHLC data
 */
export function determineWinner(ohlc: Pick<CandleOHLC, 'open' | 'close'>): 'GREEN' | 'RED' | 'DRAW' {
  if (ohlc.close > ohlc.open) return 'GREEN';
  if (ohlc.close < ohlc.open) return 'RED';
  return 'DRAW';
}

