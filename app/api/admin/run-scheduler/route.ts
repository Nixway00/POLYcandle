import { NextResponse } from 'next/server';
import { runScheduler } from '@/lib/roundScheduler';

// Force dynamic rendering (uses database and Solana)
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/run-scheduler
 * 
 * Manually triggers the scheduler to:
 * 1. Create new rounds if needed
 * 2. Lock rounds that have started
 * 3. Settle rounds that have ended
 * 
 * In production, this would be called by Vercel Cron or similar
 * For MVP, call this manually for testing
 */
export async function POST() {
  try {
    console.log('[API] Manual scheduler trigger requested');
    
    const result = await runScheduler();
    
    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    });
    
  } catch (error) {
    console.error('Error running scheduler:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/run-scheduler
 * 
 * Also support GET for easier testing in browser
 */
export async function GET() {
  return POST();
}

