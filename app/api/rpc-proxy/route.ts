/**
 * RPC Proxy Endpoint
 * Hides Helius API key from client-side code
 * All client RPC calls go through this proxy
 */

import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering (uses environment variables and external API)
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Get the Helius RPC URL from environment (server-side only)
    const heliusRpc = process.env.HELIUS_RPC;
    
    if (!heliusRpc) {
      return NextResponse.json(
        { error: 'RPC endpoint not configured' },
        { status: 500 }
      );
    }

    // Forward the request body to Helius
    const body = await request.json();
    
    const response = await fetch(heliusRpc, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Return the response from Helius
    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error('RPC Proxy Error:', error);
    return NextResponse.json(
      { error: 'RPC request failed' },
      { status: 500 }
    );
  }
}

// Also support GET for health checks
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'RPC Proxy is running',
  });
}

