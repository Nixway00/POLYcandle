import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering (uses database)
export const dynamic = 'force-dynamic';

/**
 * GET /api/rankings?sortBy=profit&limit=50
 * 
 * Get leaderboard of top users
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sortBy = searchParams.get('sortBy') || 'profit';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let orderBy: any = {};
    
    switch (sortBy) {
      case 'profit':
        orderBy = { totalProfit: 'desc' };
        break;
      case 'winRate':
        // Sort by win rate (calculated field)
        orderBy = [
          { totalWins: 'desc' },
          { totalBets: 'asc' },
        ];
        break;
      case 'wins':
        orderBy = { totalWins: 'desc' };
        break;
      default:
        orderBy = { totalProfit: 'desc' };
    }

    const users = await prisma.user.findMany({
      where: {
        totalBets: {
          gt: 0, // Only users who have placed at least one bet
        },
      },
      orderBy,
      take: limit,
    });

    // Calculate win rate and format response
    const leaderboard = users.map((user, index) => {
      const winRate = user.totalBets > 0
        ? (user.totalWins / user.totalBets) * 100
        : 0;

      return {
        rank: index + 1,
        walletAddress: user.walletAddress,
        username: user.username,
        avatar: user.avatar,
        totalBets: user.totalBets,
        totalWins: user.totalWins,
        winRate,
        totalProfit: user.totalProfit.toString(),
      };
    });

    // Sort by win rate if that's the criteria (since it's calculated)
    if (sortBy === 'winRate') {
      leaderboard.sort((a, b) => b.winRate - a.winRate);
      leaderboard.forEach((user, index) => {
        user.rank = index + 1;
      });
    }

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

