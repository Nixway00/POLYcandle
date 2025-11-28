import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SUPPORTED_SYMBOLS } from '@/lib/types';

// Force dynamic rendering (uses database)
export const dynamic = 'force-dynamic';

/**
 * GET /api/bets/live?roundId=xxx
 * GET /api/bets/live?symbol=BTCUSDT
 * 
 * Returns recent bets for a specific round or symbol's current round
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const roundId = searchParams.get('roundId');
    const symbol = searchParams.get('symbol');
    
    if (!roundId && !symbol) {
      return NextResponse.json(
        { error: 'Either roundId or symbol is required' },
        { status: 400 }
      );
    }
    
    let whereClause: any = {};
    
    if (roundId) {
      // Get bets for specific round
      whereClause.roundId = roundId;
    } else if (symbol) {
      // Validate symbol
      if (!SUPPORTED_SYMBOLS.includes(symbol as any)) {
        return NextResponse.json(
          { error: 'Invalid symbol' },
          { status: 400 }
        );
      }
      
      // Get current round for symbol
      const currentRound = await prisma.round.findFirst({
        where: {
          symbol,
          status: 'OPEN',
        },
        orderBy: {
          startTime: 'desc',
        },
      });
      
      if (!currentRound) {
        // No current round, return empty array
        return NextResponse.json([]);
      }
      
      whereClause.roundId = currentRound.id;
    }
    
    // Fetch recent bets (last 50, ordered by newest first)
    const bets = await prisma.bet.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
      select: {
        id: true,
        walletAddress: true,
        username: true,
        isAnonymous: true,
        side: true,
        amount: true,
        paidToken: true,
        paidAmount: true,
        transactionSignature: true,
        createdAt: true,
        user: {
          select: {
            avatar: true,
          },
        },
      },
    });
    
    // Format response
    const formattedBets = bets.map(bet => ({
      id: bet.id,
      username: bet.username,
      avatar: bet.user?.avatar || null,
      isAnonymous: bet.isAnonymous,
      walletAddress: bet.isAnonymous ? null : bet.walletAddress,
      side: bet.side,
      amount: bet.amount.toString(),
      paidToken: bet.paidToken,
      paidAmount: bet.paidAmount?.toString() || null,
      transactionSignature: bet.transactionSignature,
      createdAt: bet.createdAt.toISOString(),
    }));
    
    return NextResponse.json(formattedBets);
    
  } catch (error) {
    console.error('Error fetching live bets:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}

