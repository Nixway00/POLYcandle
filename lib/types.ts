import { Prisma } from '@prisma/client';

// Re-export Prisma enums for convenience
export { RoundStatus, BetSide, WinnerSide, BetStatus } from '@prisma/client';

// Types for API responses
export interface CurrentRoundResponse {
  id: string;
  symbol: string;
  timeframe: string;
  startTime: string;
  endTime: string;
  status: string;
  totalGreen: string;
  totalRed: string;
  bonusBoost: string;
  feeRate: string;
  multiplierGreen: string | null;
  multiplierRed: string | null;
  timeRemaining: number; // milliseconds
}

export interface HistoryRoundResponse {
  id: string;
  symbol: string;
  startTime: string;
  endTime: string;
  winnerSide: string | null;
  totalGreen: string;
  totalRed: string;
  bonusBoost: string;
  feeRate: string;
  multiplierGreen: string | null;
  multiplierRed: string | null;
}

export interface BetResponse {
  id: string;
  roundId: string;
  walletAddress: string;
  side: string;
  amount: string;
  payout: string;
  status: string;
  createdAt: string;
}

export interface PlaceBetRequest {
  symbol: string;
  roundId: string;
  side: 'GREEN' | 'RED';
  amount: number;
  walletAddress: string;
}

export interface PlaceBetResponse {
  bet: BetResponse;
  round: CurrentRoundResponse;
}

// Supported symbols
export const SUPPORTED_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ZECUSDT'] as const;
export type SupportedSymbol = typeof SUPPORTED_SYMBOLS[number];

// Symbol display mapping
export const SYMBOL_DISPLAY: Record<SupportedSymbol, string> = {
  BTCUSDT: 'BTC',
  ETHUSDT: 'ETH',
  SOLUSDT: 'SOL',
  ZECUSDT: 'ZEC',
};

// Timeframe constant
export const TIMEFRAME_MS = 5 * 60 * 1000; // 5 minutes
export const ACTIVE_SYMBOLS: SupportedSymbol[] = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ZECUSDT'];

