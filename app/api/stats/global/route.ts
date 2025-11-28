import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering (uses database)
export const dynamic = 'force-dynamic';

/**
 * GET /api/stats/global
 * 
 * Get global platform statistics
 */
export async function GET() {
  try {
    // Get total bets
    const totalBets = await prisma.bet.count();

    // Get total users
    const totalUsers = await prisma.user.count();

    // Get total volume
    const volumeResult = await prisma.bet.aggregate({
      _sum: {
        amount: true,
      },
    });

    // Get total paid out (sum of all payouts)
    const payoutResult = await prisma.bet.aggregate({
      where: {
        status: 'WON',
      },
      _sum: {
        payout: true,
      },
    });

    // Calculate platform fees (5% of total volume)
    const totalVolume = parseFloat(volumeResult._sum.amount?.toString() || '0');
    const platformFees = totalVolume * 0.05;

    // Get most popular asset
    const assetStats = await prisma.round.groupBy({
      by: ['symbol'],
      _count: {
        symbol: true,
      },
      orderBy: {
        _count: {
          symbol: 'desc',
        },
      },
      take: 1,
    });

    const mostPopularAsset = assetStats[0]?.symbol || null;

    return NextResponse.json({
      totalBets,
      totalUsers,
      totalVolume: totalVolume.toFixed(8),
      totalPaidOut: payoutResult._sum.payout?.toString() || '0',
      platformFees: platformFees.toFixed(8),
      mostPopularAsset,
    });
  } catch (error) {
    console.error('Error fetching global stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

