/**
 * Jupiter Aggregator Integration
 * Handles automatic token swaps to USDC
 */

import { Connection, Keypair, VersionedTransaction, PublicKey } from '@solana/web3.js';
import { getTokenInfo, getAllAvailableTokens, SUPPORTED_TOKENS } from './tokens';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const USDC_MINT = SUPPORTED_TOKENS.USDC.mint;

export interface SwapQuote {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: any[];
}

export interface SwapResult {
  success: boolean;
  signature?: string;
  inputAmount: number;
  outputAmount: number;
  slippage: number;
  error?: string;
}

/**
 * Get swap quote from Jupiter
 */
export async function getSwapQuote(
  inputMint: string,
  inputAmount: bigint,
  slippageBps: number = 100 // 1% default
): Promise<SwapQuote | null> {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint: USDC_MINT,
      amount: inputAmount.toString(),
      slippageBps: slippageBps.toString(),
      onlyDirectRoutes: 'false',
      asLegacyTransaction: 'false',
    });

    const response = await fetch(`${JUPITER_API}/quote?${params}`);
    
    if (!response.ok) {
      console.error('Jupiter quote error:', await response.text());
      return null;
    }

    const quote = await response.json();
    return quote;
  } catch (error) {
    console.error('Error fetching swap quote:', error);
    return null;
  }
}

/**
 * Execute token swap via Jupiter
 */
export async function executeSwap(
  connection: Connection,
  wallet: Keypair,
  quote: SwapQuote
): Promise<SwapResult> {
  try {
    // Get serialized transaction from Jupiter
    const response = await fetch(`${JUPITER_API}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Jupiter swap error:', error);
      return {
        success: false,
        inputAmount: 0,
        outputAmount: 0,
        slippage: 0,
        error: 'Failed to get swap transaction',
      };
    }

    const { swapTransaction } = await response.json();

    // Deserialize and sign transaction
    const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
    const transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    transaction.sign([wallet]);

    // Send transaction
    const signature = await connection.sendRawTransaction(transaction.serialize(), {
      skipPreflight: false,
      maxRetries: 3,
    });

    // Confirm transaction
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      signature,
      ...latestBlockhash,
    }, 'confirmed');

    // Calculate amounts
    const inputAmount = Number(quote.inAmount);
    const outputAmount = Number(quote.outAmount);
    const expectedOutput = Number(quote.otherAmountThreshold);
    const slippage = ((expectedOutput - outputAmount) / expectedOutput) * 100;

    console.log('✅ Swap successful:', {
      signature,
      inputAmount,
      outputAmount,
      slippage: slippage.toFixed(4) + '%',
    });

    return {
      success: true,
      signature,
      inputAmount,
      outputAmount,
      slippage,
    };
  } catch (error) {
    console.error('Error executing swap:', error);
    return {
      success: false,
      inputAmount: 0,
      outputAmount: 0,
      slippage: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get estimated USDC value for a token amount
 * (Quote only, no swap execution)
 */
export async function estimateUsdcValue(
  tokenSymbol: string,
  tokenAmount: number
): Promise<number> {
  try {
    // If already USDC, return as-is
    if (tokenSymbol.toUpperCase() === 'USDC' || tokenSymbol.toUpperCase() === 'USDT') {
      return tokenAmount;
    }

    // Get token info from all available tokens (includes meme of the week)
    const allTokens = getAllAvailableTokens();
    const tokenInfo = allTokens[tokenSymbol.toUpperCase()];
    
    if (!tokenInfo) {
      console.error(`Token ${tokenSymbol} not found in available tokens`);
      throw new Error(`Token ${tokenSymbol} not supported`);
    }

    // Convert to smallest unit
    const amountInSmallestUnit = BigInt(
      Math.floor(tokenAmount * Math.pow(10, tokenInfo.decimals))
    );

    console.log(`Estimating ${tokenAmount} ${tokenSymbol} → USDC...`);

    // Get quote
    const quote = await getSwapQuote(tokenInfo.mint, amountInSmallestUnit);
    if (!quote) {
      console.error('Failed to get quote from Jupiter');
      throw new Error('Failed to get swap quote');
    }

    // Convert USDC output to decimal
    const usdcDecimals = SUPPORTED_TOKENS.USDC.decimals;
    const usdcValue = Number(quote.outAmount) / Math.pow(10, usdcDecimals);

    console.log(`✅ Estimate: ${usdcValue.toFixed(2)} USDC`);

    return usdcValue;
  } catch (error) {
    console.error('Error estimating USDC value:', error);
    return 0;
  }
}

/**
 * Swap any supported token to USDC
 * Complete flow: quote + execute
 */
export async function swapToUsdc(
  connection: Connection,
  wallet: Keypair,
  tokenSymbol: string,
  tokenAmount: number,
  slippageBps: number = 100
): Promise<SwapResult & { estimatedUsdc: number }> {
  try {
    // If already USDC/USDT, no swap needed
    if (tokenSymbol.toUpperCase() === 'USDC' || tokenSymbol.toUpperCase() === 'USDT') {
      return {
        success: true,
        inputAmount: tokenAmount,
        outputAmount: tokenAmount,
        slippage: 0,
        estimatedUsdc: tokenAmount,
      };
    }

    // Get token info from all available tokens
    const allTokens = getAllAvailableTokens();
    const tokenInfo = allTokens[tokenSymbol.toUpperCase()];
    
    if (!tokenInfo) {
      throw new Error(`Token ${tokenSymbol} not supported`);
    }

    // Convert to smallest unit
    const amountInSmallestUnit = BigInt(
      Math.floor(tokenAmount * Math.pow(10, tokenInfo.decimals))
    );

    console.log(`🔄 Getting quote: ${tokenAmount} ${tokenSymbol} → USDC`);

    // Get quote
    const quote = await getSwapQuote(tokenInfo.mint, amountInSmallestUnit, slippageBps);
    if (!quote) {
      throw new Error('Failed to get swap quote');
    }

    // Calculate estimated USDC
    const usdcDecimals = SUPPORTED_TOKENS.USDC.decimals;
    const estimatedUsdc = Number(quote.outAmount) / Math.pow(10, usdcDecimals);

    console.log(`💰 Estimated: ${estimatedUsdc.toFixed(2)} USDC`);

    // Execute swap
    const result = await executeSwap(connection, wallet, quote);

    return {
      ...result,
      estimatedUsdc,
    };
  } catch (error) {
    console.error('Error in swapToUsdc:', error);
    return {
      success: false,
      inputAmount: 0,
      outputAmount: 0,
      slippage: 0,
      estimatedUsdc: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if wallet has sufficient balance for swap + fees
 */
export async function checkSwapFeasibility(
  connection: Connection,
  walletAddress: PublicKey,
  tokenSymbol: string,
  tokenAmount: number
): Promise<{ feasible: boolean; reason?: string }> {
  try {
    const tokenInfo = getTokenInfo(tokenSymbol);
    if (!tokenInfo) {
      return { feasible: false, reason: 'Token not supported' };
    }

    // Check SOL balance for fees
    const solBalance = await connection.getBalance(walletAddress);
    const minSolRequired = 0.01 * 1e9; // 0.01 SOL minimum

    if (solBalance < minSolRequired) {
      return {
        feasible: false,
        reason: `Insufficient SOL for gas fees. Need at least 0.01 SOL, have ${(solBalance / 1e9).toFixed(4)} SOL`,
      };
    }

    // For SOL swaps, ensure we leave enough for fees
    if (tokenSymbol.toUpperCase() === 'SOL') {
      const totalNeeded = tokenAmount + 0.01; // Amount + fees
      const solBalanceTokens = solBalance / 1e9;
      
      if (solBalanceTokens < totalNeeded) {
        return {
          feasible: false,
          reason: `Insufficient SOL. Need ${totalNeeded.toFixed(4)} SOL (including fees), have ${solBalanceTokens.toFixed(4)} SOL`,
        };
      }
    }

    return { feasible: true };
  } catch (error) {
    return {
      feasible: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

