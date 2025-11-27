/**
 * Platform Wallet Service
 * Manages the escrow wallet for receiving bets and executing swaps
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import bs58 from 'bs58';

/**
 * Get platform wallet keypair from environment
 */
export function getPlatformWallet(): Keypair {
  const privateKey = process.env.PLATFORM_WALLET_PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('PLATFORM_WALLET_PRIVATE_KEY not configured in environment');
  }

  try {
    // Try base58 format first (most common)
    const decoded = bs58.decode(privateKey);
    return Keypair.fromSecretKey(decoded);
  } catch (e1) {
    try {
      // Try JSON array format
      const keyArray = JSON.parse(privateKey);
      return Keypair.fromSecretKey(Uint8Array.from(keyArray));
    } catch (e2) {
      try {
        // Try base64 format
        const decoded = Buffer.from(privateKey, 'base64');
        return Keypair.fromSecretKey(decoded);
      } catch (e3) {
        throw new Error('Invalid PLATFORM_WALLET_PRIVATE_KEY format. Expected base58, JSON array, or base64');
      }
    }
  }
}

/**
 * Get platform wallet public key
 */
export function getPlatformWalletAddress(): PublicKey {
  const publicKey = process.env.PLATFORM_WALLET_PUBLIC_KEY;
  
  if (publicKey) {
    return new PublicKey(publicKey);
  }
  
  // Fallback: derive from private key
  return getPlatformWallet().publicKey;
}

/**
 * Check platform wallet balance
 */
export async function checkPlatformWalletBalance(
  connection: Connection
): Promise<{
  solBalance: number;
  address: string;
}> {
  const wallet = getPlatformWallet();
  const balance = await connection.getBalance(wallet.publicKey);
  
  return {
    solBalance: balance / 1e9,
    address: wallet.publicKey.toBase58(),
  };
}

/**
 * Verify platform wallet is configured and funded
 */
export async function verifyPlatformWallet(
  connection: Connection
): Promise<{ valid: boolean; message: string; balance?: number }> {
  try {
    const wallet = getPlatformWallet();
    const balance = await connection.getBalance(wallet.publicKey);
    const solBalance = balance / 1e9;
    
    if (solBalance < 0.01) {
      return {
        valid: false,
        message: `Platform wallet has insufficient SOL: ${solBalance.toFixed(4)} SOL. Need at least 0.01 SOL.`,
        balance: solBalance,
      };
    }
    
    return {
      valid: true,
      message: `Platform wallet configured: ${wallet.publicKey.toBase58()} with ${solBalance.toFixed(4)} SOL`,
      balance: solBalance,
    };
  } catch (error) {
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Monitor wallet and alert if balance is low
 */
export async function monitorWalletBalance(
  connection: Connection,
  minBalanceSOL: number = 0.1
): Promise<{ needsFunding: boolean; currentBalance: number }> {
  const { solBalance } = await checkPlatformWalletBalance(connection);
  
  return {
    needsFunding: solBalance < minBalanceSOL,
    currentBalance: solBalance,
  };
}

