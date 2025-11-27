/**
 * Supported Tokens Configuration
 * All tokens that can be used for betting
 */

export interface TokenInfo {
  symbol: string;
  name: string;
  mint: string; // Solana token mint address
  decimals: number;
  icon: string; // Emoji or URL
  coingeckoId?: string; // For price fetching
}

/**
 * Supported tokens for betting
 * Start with: SOL, USDC, BONK
 */
export const SUPPORTED_TOKENS: Record<string, TokenInfo> = {
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'So11111111111111111111111111111111111111112', // Native SOL
    decimals: 9,
    icon: '◎',
    coingeckoId: 'solana',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC on Solana
    decimals: 6,
    icon: '💵',
    coingeckoId: 'usd-coin',
  },
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
    decimals: 5,
    icon: '🐕',
    coingeckoId: 'bonk',
  },
};

/**
 * Get token info by symbol
 */
export function getTokenInfo(symbol: string): TokenInfo | undefined {
  return SUPPORTED_TOKENS[symbol.toUpperCase()];
}

/**
 * Get all supported token symbols
 */
export function getSupportedTokens(): string[] {
  return Object.keys(SUPPORTED_TOKENS);
}

/**
 * Check if token is supported
 */
export function isTokenSupported(symbol: string): boolean {
  return symbol.toUpperCase() in SUPPORTED_TOKENS;
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: number, symbol: string): string {
  const token = getTokenInfo(symbol);
  if (!token) return amount.toString();
  
  return amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: Math.min(token.decimals, 6),
  });
}

/**
 * Convert token amount to lamports/smallest unit
 */
export function toTokenAmount(amount: number, symbol: string): bigint {
  const token = getTokenInfo(symbol);
  if (!token) throw new Error(`Token ${symbol} not supported`);
  
  return BigInt(Math.floor(amount * Math.pow(10, token.decimals)));
}

/**
 * Convert lamports/smallest unit to token amount
 */
export function fromTokenAmount(lamports: bigint, symbol: string): number {
  const token = getTokenInfo(symbol);
  if (!token) throw new Error(`Token ${symbol} not supported`);
  
  return Number(lamports) / Math.pow(10, token.decimals);
}

