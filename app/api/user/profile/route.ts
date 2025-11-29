import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering (uses database)
export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile?wallet=xxx
 * Get or create user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Check if Prisma is initialized
    if (!prisma || typeof prisma.user === 'undefined') {
      console.error('[User Profile GET] Prisma Client not initialized');
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: 'Prisma Client not initialized. Please check DATABASE_URL and ensure Prisma Client is generated.',
        },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('wallet');

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress },
      });
    }

    // Calculate win rate
    const winRate = user.totalBets > 0
      ? (user.totalWins / user.totalBets) * 100
      : 0;

    return NextResponse.json({
      username: user.username,
      avatar: user.avatar,
      isAnonymous: user.isAnonymous,
      stats: {
        totalBets: user.totalBets,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        winRate,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/profile
 * Update user profile
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Prisma is initialized
    if (!prisma || typeof prisma.user === 'undefined') {
      console.error('[User Profile POST] Prisma Client not initialized');
      return NextResponse.json(
        { 
          error: 'Database connection error',
          details: 'Prisma Client not initialized. Please check DATABASE_URL and ensure Prisma Client is generated.',
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { walletAddress, username, avatar, isAnonymous } = body;

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Upsert user
    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {
        username: username || null,
        avatar: avatar || '🎯',
        isAnonymous: isAnonymous || false,
      },
      create: {
        walletAddress,
        username: username || null,
        avatar: avatar || '🎯',
        isAnonymous: isAnonymous || false,
      },
    });

    const winRate = user.totalBets > 0
      ? (user.totalWins / user.totalBets) * 100
      : 0;

    return NextResponse.json({
      username: user.username,
      avatar: user.avatar,
      isAnonymous: user.isAnonymous,
      stats: {
        totalBets: user.totalBets,
        totalWins: user.totalWins,
        totalLosses: user.totalLosses,
        winRate,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

