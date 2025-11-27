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
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    icon: '💵',
    coingeckoId: 'usd-coin',
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    icon: '💰',
    coingeckoId: 'tether',
  },
  BONK: {
    symbol: 'BONK',
    name: 'Bonk',
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    decimals: 5,
    icon: '🐕',
    coingeckoId: 'bonk',
  },
  WIF: {
    symbol: 'WIF',
    name: 'dogwifhat',
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    decimals: 6,
    icon: '🐶',
    coingeckoId: 'dogwifcoin',
  },
  JTO: {
    symbol: 'JTO',
    name: 'Jito',
    mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
    decimals: 9,
    icon: '⚡',
    coingeckoId: 'jito-governance-token',
  },
  JUP: {
    symbol: 'JUP',
    name: 'Jupiter',
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    decimals: 6,
    icon: '🪐',
    coingeckoId: 'jupiter-exchange-solana',
  },
  // PUMP: {
  //   symbol: 'PUMP',
  //   name: 'Pump.fun',
  //   mint: 'PUMPKsqK3hDgvVbGfD7c4vwjJLST1vXFLX7R3s6pump',
  //   decimals: 6,
  //   icon: '🔥',
  //   coingeckoId: 'pump-fun',
  // },
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

/**
 * Get all available tokens
 * Simple function - no meme rotation (will be manual via admin)
 */
export function getAllAvailableTokens(): Record<string, TokenInfo> {
  return SUPPORTED_TOKENS;
}

