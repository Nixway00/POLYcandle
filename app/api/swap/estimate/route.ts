/**
 * API Endpoint: Estimate USDC value for token amount
 * Used by frontend to show estimated bet value
 */

import { NextRequest, NextResponse } from 'next/server';
import { estimateUsdcValue } from '@/lib/jupiterSwap';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');
    const amountStr = searchParams.get('amount');

    if (!token || !amountStr) {
      return NextResponse.json(
        { error: 'Missing token or amount parameter' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    // If already USDC, return as-is
    if (token.toUpperCase() === 'USDC') {
      return NextResponse.json({
        token,
        amount,
        estimatedUsdc: amount,
        conversionRate: 1,
      });
    }

    // Get Jupiter quote
    const estimatedUsdc = await estimateUsdcValue(token, amount);

    if (estimatedUsdc === 0) {
      return NextResponse.json(
        { error: 'Unable to get quote from Jupiter' },
        { status: 500 }
      );
    }

    const conversionRate = estimatedUsdc / amount;

    return NextResponse.json({
      token,
      amount,
      estimatedUsdc,
      conversionRate,
      note: 'Estimated value. Actual may vary due to slippage.',
    });
  } catch (error) {
    console.error('Error estimating USDC value:', error);
    return NextResponse.json(
      { error: 'Failed to estimate USDC value' },
      { status: 500 }
    );
  }
}

