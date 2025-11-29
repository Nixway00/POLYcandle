/**
 * Test Endpoint: Jupiter Swap Quote
 * GET /api/test/jupiter?token=BONK&amount=1000
 * 
 * Test Jupiter API directly to debug quote issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTokenInfo, getAllAvailableTokens } from '@/lib/tokens';
import { getSwapQuote } from '@/lib/jupiterSwap';
import { SUPPORTED_TOKENS } from '@/lib/tokens';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const tokenSymbol = searchParams.get('token') || 'BONK';
    const amountStr = searchParams.get('amount') || '1000';
    
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // Get token info
    const allTokens = getAllAvailableTokens();
    const tokenInfo = allTokens[tokenSymbol.toUpperCase()];
    
    if (!tokenInfo) {
      return NextResponse.json(
        { 
          error: `Token ${tokenSymbol} not found`,
          availableTokens: Object.keys(allTokens),
        },
        { status: 400 }
      );
    }

    // Convert to smallest unit
    const amountInSmallestUnit = BigInt(
      Math.floor(amount * Math.pow(10, tokenInfo.decimals))
    );

    console.log(`[Jupiter Test] Testing ${amount} ${tokenSymbol}`);
    console.log(`[Jupiter Test] Mint: ${tokenInfo.mint}`);
    console.log(`[Jupiter Test] Decimals: ${tokenInfo.decimals}`);
    console.log(`[Jupiter Test] Amount (smallest unit): ${amountInSmallestUnit.toString()}`);

    // Get quote
    let quote;
    try {
      quote = await getSwapQuote(tokenInfo.mint, amountInSmallestUnit);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to get Jupiter quote',
          details: errorMessage,
          token: {
            symbol: tokenSymbol,
            mint: tokenInfo.mint,
            decimals: tokenInfo.decimals,
            amount: amount,
            amountInSmallestUnit: amountInSmallestUnit.toString(),
          },
        },
        { status: 500 }
      );
    }

    // Convert USDC output
    const usdcDecimals = SUPPORTED_TOKENS.USDC.decimals;
    const usdcValue = Number(quote.outAmount) / Math.pow(10, usdcDecimals);
    const conversionRate = usdcValue / amount;

    return NextResponse.json({
      success: true,
      token: {
        symbol: tokenSymbol,
        mint: tokenInfo.mint,
        decimals: tokenInfo.decimals,
        amount: amount,
        amountInSmallestUnit: amountInSmallestUnit.toString(),
      },
      quote: {
        inAmount: quote.inAmount,
        outAmount: quote.outAmount,
        estimatedUsdc: usdcValue.toFixed(6),
        conversionRate: conversionRate.toFixed(8),
        priceImpact: quote.priceImpactPct,
        slippageBps: quote.slippageBps,
      },
      jupiterResponse: quote,
    });
  } catch (error) {
    console.error('[Jupiter Test] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

