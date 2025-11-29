import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUPPORTED_SYMBOLS, HistoryRoundResponse } from '@/lib/types';
import { RoundStatus } from '@prisma/client';

// Force dynamic rendering (uses database)
export const dynamic = 'force-dynamic';

/**
 * GET /api/rounds/history?symbol=BTCUSDT&limit=20
 * 
 * Returns the history of SETTLED rounds for the specified symbol
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Prisma is initialized
    if (!prisma || typeof prisma.round === 'undefined') {
      console.error('[Round History] Prisma Client not initialized');
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: 'Prisma Client not initialized. Please check DATABASE_URL and ensure Prisma Client is generated.',
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get('symbol');
    const limitParam = searchParams.get('limit');
    
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
    
    // Parse limit (default to 20, max 100)
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 20;
    
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json(
        { error: 'Invalid limit parameter' },
        { status: 400 }
      );
    }
    
    // Fetch settled rounds
    const rounds = await prisma.round.findMany({
      where: {
        symbol,
        status: RoundStatus.SETTLED,
      },
      orderBy: {
        endTime: 'desc',
      },
      take: limit,
    });
    
    const response: HistoryRoundResponse[] = rounds.map(round => ({
      id: round.id,
      symbol: round.symbol,
      startTime: round.startTime.toISOString(),
      endTime: round.endTime.toISOString(),
      winnerSide: round.winnerSide,
      totalGreen: round.totalGreen.toString(),
      totalRed: round.totalRed.toString(),
      bonusBoost: round.bonusBoost.toString(),
      feeRate: round.feeRate.toString(),
      multiplierGreen: round.multiplierGreen?.toString() || null,
      multiplierRed: round.multiplierRed?.toString() || null,
    }));
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching round history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

