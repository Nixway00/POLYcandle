import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/user/bets?wallet=xxx&limit=10
 * 
 * Get user's bet history
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    const bets = await prisma.bet.findMany({
      where: {
        walletAddress,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        round: {
          select: {
            symbol: true,
            winnerSide: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    });

    const formattedBets = bets.map(bet => ({
      id: bet.id,
      side: bet.side,
      amount: bet.amount.toString(),
      payout: bet.payout.toString(),
      status: bet.status,
      createdAt: bet.createdAt.toISOString(),
      round: {
        symbol: bet.round.symbol,
        winnerSide: bet.round.winnerSide,
        startTime: bet.round.startTime.toISOString(),
        endTime: bet.round.endTime.toISOString(),
      },
    }));

    return NextResponse.json(formattedBets);
  } catch (error) {
    console.error('Error fetching user bets:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

