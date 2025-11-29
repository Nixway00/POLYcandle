/**
 * Test Endpoint: Prisma Connection
 * GET /api/test/prisma
 * 
 * Test if Prisma Client is working correctly
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check if Prisma Client is initialized
    if (!prisma || typeof prisma.round === 'undefined') {
      return NextResponse.json(
        {
          success: false,
          error: 'Prisma Client not initialized',
          prismaType: typeof prisma,
          hasRound: typeof prisma?.round,
        },
        { status: 500 }
      );
    }

    // Test 2: Try a simple query
    const roundCount = await prisma.round.count();
    
    // Test 3: Try to find a round
    const testRound = await prisma.round.findFirst({
      take: 1,
    });

    return NextResponse.json({
      success: true,
      prismaInitialized: true,
      databaseConnected: true,
      roundCount,
      testRound: testRound ? 'Found' : 'No rounds in database',
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  } catch (error) {
    console.error('[Prisma Test] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'Unknown';

    return NextResponse.json(
      {
        success: false,
        error: 'Prisma test failed',
        errorName,
        errorMessage,
        errorStack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
        env: {
          hasDatabaseUrl: !!process.env.DATABASE_URL,
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 }
    );
  }
}

