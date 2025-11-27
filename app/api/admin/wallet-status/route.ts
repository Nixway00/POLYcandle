/**
 * API Endpoint: Platform Wallet Status & Manual Refill
 * GET - Check wallet status
 * POST - Trigger manual refill
 */

import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { getRefillStatus, autoRefillIfNeeded } from '@/lib/autoRefill';

export async function GET(request: NextRequest) {
  try {
    const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
    const status = await getRefillStatus(connection);

    return NextResponse.json({
      success: true,
      wallet: {
        solBalance: status.solBalance.toFixed(4),
        usdcBalance: status.usdcBalance.toFixed(2),
        needsRefill: status.needsRefill,
        canRefill: status.canRefill,
        refillThreshold: status.nextRefillAt,
        estimatedRefills: status.estimatedRefills,
      },
      message: status.needsRefill
        ? '⚠️ Wallet SOL below threshold'
        : '✅ Wallet SOL sufficient',
    });
  } catch (error) {
    console.error('Error checking wallet status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check wallet status',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const connection = new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC!);
    
    console.log('🔧 Manual refill triggered...');
    const result = await autoRefillIfNeeded(connection);

    return NextResponse.json({
      success: result.refilled,
      message: result.message,
      details: {
        solBefore: result.solBefore?.toFixed(4),
        solAfter: result.solAfter?.toFixed(4),
        usdcSpent: result.usdcSpent?.toFixed(2),
      },
    });
  } catch (error) {
    console.error('Error triggering manual refill:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to trigger refill',
      },
      { status: 500 }
    );
  }
}

