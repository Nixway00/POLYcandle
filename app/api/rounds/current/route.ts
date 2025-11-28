import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUPPORTED_SYMBOLS, CurrentRoundResponse } from '@/lib/types';
import { RoundStatus, Prisma } from '@prisma/client';

// Force dynamic rendering (uses database)
export const dynamic = 'force-dynamic';

/**
 * GET /api/rounds/current?symbol=BTCUSDT
 * 
 * Returns the current OPEN round for the specified symbol
 * with live multipliers calculated on the fly
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    
    // Validate symbol parameter
    if (!symbol) {
      return NextResponse.json(
        { error: 'Missing required parameter: symbol' },
        { status: 400 }
      );
    }
    
    if (!SUPPORTED_SYMBOLS.includes(symbol as any)) {
      return NextResponse.json(
        { error: `Invalid symbol. Supported symbols: ${SUPPORTED_SYMBOLS.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Find the current OPEN round for this symbol
    const round = await prisma.round.findFirst({
      where: {
        symbol,
        status: RoundStatus.OPEN,
      },
      orderBy: {
        startTime: 'desc',
      },
    });
    
    if (!round) {
      return NextResponse.json(
        { error: `No open round found for ${symbol}` },
        { status: 404 }
      );
    }
    
    // Calculate live multipliers
    const V = parseFloat(round.totalGreen.toString());
    const R = parseFloat(round.totalRed.toString());
    const B = parseFloat(round.bonusBoost.toString());
    const f = parseFloat(round.feeRate.toString());
    
    const L = V + R; // Total pool
    const Fee = L * f;
    const D = L + B - Fee; // Distribution pool
    
    let multiplierGreen: string | null = null;
    let multiplierRed: string | null = null;
    
    // Calculate multipliers (avoid division by zero)
    if (V > 0) {
      multiplierGreen = (D / V).toFixed(4);
    }
    if (R > 0) {
      multiplierRed = (D / R).toFixed(4);
    }
    
    // Calculate time remaining until betting closes (startTime)
    const now = new Date();
    const timeRemaining = Math.max(0, round.startTime.getTime() - now.getTime());
    
    const response: CurrentRoundResponse = {
      id: round.id,
      symbol: round.symbol,
      timeframe: round.timeframe,
      startTime: round.startTime.toISOString(),
      endTime: round.endTime.toISOString(),
      status: round.status,
      totalGreen: round.totalGreen.toString(),
      totalRed: round.totalRed.toString(),
      bonusBoost: round.bonusBoost.toString(),
      feeRate: round.feeRate.toString(),
      multiplierGreen,
      multiplierRed,
      timeRemaining,
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching current round:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}

