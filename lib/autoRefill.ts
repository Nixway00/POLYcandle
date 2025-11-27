/**
 * Auto-Refill System
 * Automatically swaps accumulated USDC fees to SOL for gas
 */

import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddress, getAccount } from '@solana/spl-token';
import { getPlatformWallet } from './platformWallet';
import { SUPPORTED_TOKENS } from './tokens';
import { getSwapQuote, executeSwap } from './jupiterSwap';

// Configuration
const MIN_SOL_THRESHOLD = 0.05; // Refill when SOL drops below this
const USDC_SWAP_AMOUNT = 20; // Swap 20 USDC to SOL each refill
const MIN_USDC_FOR_REFILL = 25; // Need at least 25 USDC to trigger refill

/**
 * Check if wallet needs SOL refill
 */
export async function needsRefill(connection: Connection): Promise<{
  needsRefill: boolean;
  currentSol: number;
  reason?: string;
}> {
  try {
    const platformWallet = getPlatformWallet();
    const balance = await connection.getBalance(platformWallet.publicKey);
    const solBalance = balance / 1e9;

    if (solBalance >= MIN_SOL_THRESHOLD) {
      return {
        needsRefill: false,
        currentSol: solBalance,
      };
    }

    return {
      needsRefill: true,
      currentSol: solBalance,
      reason: `SOL balance (${solBalance.toFixed(4)}) below threshold (${MIN_SOL_THRESHOLD})`,
    };
  } catch (error) {
    console.error('Error checking refill need:', error);
    return {
      needsRefill: false,
      currentSol: 0,
      reason: 'Error checking balance',
    };
  }
}

/**
 * Get platform wallet's USDC balance
 */
export async function getUsdcBalance(connection: Connection): Promise<number> {
  try {
    const platformWallet = getPlatformWallet();
    const usdcMint = new PublicKey(SUPPORTED_TOKENS.USDC.mint);

    // Get associated token account
    const tokenAccount = await getAssociatedTokenAddress(
      usdcMint,
      platformWallet.publicKey
    );

    try {
      const accountInfo = await getAccount(connection, tokenAccount);
      const balance = Number(accountInfo.amount) / Math.pow(10, SUPPORTED_TOKENS.USDC.decimals);
      return balance;
    } catch (error) {
      // Token account doesn't exist yet
      return 0;
    }
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return 0;
  }
}

/**
 * Swap USDC to SOL for gas refill
 */
async function swapUsdcToSol(
  connection: Connection,
  amountUsdc: number
): Promise<{ success: boolean; solReceived: number; signature?: string; error?: string }> {
  try {
    const platformWallet = getPlatformWallet();
    const usdcMint = SUPPORTED_TOKENS.USDC.mint;
    const solMint = SUPPORTED_TOKENS.SOL.mint;

    console.log(`🔄 Swapping ${amountUsdc} USDC → SOL for gas refill...`);

    // Convert USDC to smallest unit (6 decimals)
    const amountInSmallestUnit = BigInt(Math.floor(amountUsdc * Math.pow(10, 6)));

    // Get quote (USDC → SOL, reverse direction)
    const quote = await getSwapQuote(
      usdcMint,
      amountInSmallestUnit,
      100 // 1% slippage
    );

    if (!quote) {
      return {
        success: false,
        solReceived: 0,
        error: 'Failed to get Jupiter quote',
      };
    }

    // Note: Jupiter quote output is in lamports for SOL
    const expectedSol = Number(quote.outAmount) / 1e9;
    console.log(`💰 Expected: ${expectedSol.toFixed(4)} SOL`);

    // Execute swap
    const result = await executeSwap(connection, platformWallet, quote);

    if (!result.success) {
      return {
        success: false,
        solReceived: 0,
        error: result.error || 'Swap execution failed',
      };
    }

    const solReceived = result.outputAmount / 1e9;
    console.log(`✅ Refill successful! Received ${solReceived.toFixed(4)} SOL`);

    return {
      success: true,
      solReceived,
      signature: result.signature,
    };
  } catch (error) {
    console.error('Error swapping USDC to SOL:', error);
    return {
      success: false,
      solReceived: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main auto-refill function
 * Call this periodically (e.g., after each round settlement)
 */
export async function autoRefillIfNeeded(
  connection: Connection
): Promise<{
  refilled: boolean;
  message: string;
  solBefore?: number;
  solAfter?: number;
  usdcSpent?: number;
}> {
  try {
    // Check if refill needed
    const refillCheck = await needsRefill(connection);

    if (!refillCheck.needsRefill) {
      return {
        refilled: false,
        message: `No refill needed. SOL balance: ${refillCheck.currentSol.toFixed(4)}`,
      };
    }

    console.log(`⚠️ ${refillCheck.reason}`);

    // Check USDC balance
    const usdcBalance = await getUsdcBalance(connection);
    console.log(`💵 USDC balance: ${usdcBalance.toFixed(2)}`);

    if (usdcBalance < MIN_USDC_FOR_REFILL) {
      return {
        refilled: false,
        message: `Insufficient USDC for refill. Have: ${usdcBalance.toFixed(2)}, need: ${MIN_USDC_FOR_REFILL}`,
      };
    }

    // Execute refill
    const solBefore = refillCheck.currentSol;
    const swapResult = await swapUsdcToSol(connection, USDC_SWAP_AMOUNT);

    if (!swapResult.success) {
      return {
        refilled: false,
        message: `Refill failed: ${swapResult.error}`,
        solBefore,
      };
    }

    const solAfter = solBefore + swapResult.solReceived;

    return {
      refilled: true,
      message: `✅ Auto-refill successful! ${USDC_SWAP_AMOUNT} USDC → ${swapResult.solReceived.toFixed(4)} SOL`,
      solBefore,
      solAfter,
      usdcSpent: USDC_SWAP_AMOUNT,
    };
  } catch (error) {
    console.error('Error in auto-refill:', error);
    return {
      refilled: false,
      message: `Auto-refill error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Get refill status for monitoring
 */
export async function getRefillStatus(connection: Connection): Promise<{
  solBalance: number;
  usdcBalance: number;
  needsRefill: boolean;
  canRefill: boolean;
  nextRefillAt?: number; // SOL threshold
  estimatedRefills: number; // How many refills possible with current USDC
}> {
  const [refillCheck, usdcBalance] = await Promise.all([
    needsRefill(connection),
    getUsdcBalance(connection),
  ]);

  const canRefill = usdcBalance >= MIN_USDC_FOR_REFILL;
  const estimatedRefills = Math.floor(usdcBalance / USDC_SWAP_AMOUNT);

  return {
    solBalance: refillCheck.currentSol,
    usdcBalance,
    needsRefill: refillCheck.needsRefill,
    canRefill,
    nextRefillAt: MIN_SOL_THRESHOLD,
    estimatedRefills,
  };
}

