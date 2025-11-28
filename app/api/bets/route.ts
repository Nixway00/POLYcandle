import { NextRequest, NextResponse } from 'next/server';
import { Connection } from '@solana/web3.js';
import { prisma } from '@/lib/prisma';
import { SUPPORTED_SYMBOLS, PlaceBetRequest, PlaceBetResponse, CurrentRoundResponse } from '@/lib/types';
import { RoundStatus, BetSide, BetStatus, Prisma } from '@prisma/client';
import { swapToUsdc } from '@/lib/jupiterSwap';
import { getPlatformWallet } from '@/lib/platformWallet';

/**
 * POST /api/bets
 * 
 * Places a new bet on an open round
 * 
 * Body: {
 *   symbol: string,
 *   roundId: string,
 *   side: 'GREEN' | 'RED',
 *   amount: number,
 *   walletAddress: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: any = await request.json();
    
    // Validate required fields
    const { 
      symbol, 
      roundId, 
      side, 
      walletAddress,
      transactionSignature,
      paidToken,
      paidAmount,
      estimatedUsdc,
      username,
      isAnonymous
    } = body;
    
    if (!symbol || !roundId || !side || !walletAddress || !paidToken || paidAmount === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: symbol, roundId, side, walletAddress, paidToken, paidAmount' },
        { status: 400 }
      );
    }
    
    // Validate symbol
    if (!SUPPORTED_SYMBOLS.includes(symbol as any)) {
      return NextResponse.json(
        { error: `Invalid symbol. Supported symbols: ${SUPPORTED_SYMBOLS.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate side
    if (side !== 'GREEN' && side !== 'RED') {
      return NextResponse.json(
        { error: 'Invalid side. Must be GREEN or RED' },
        { status: 400 }
      );
    }
    
    // Validate paid amount
    if (typeof paidAmount !== 'number' || paidAmount <= 0) {
      return NextResponse.json(
        { error: 'Invalid paidAmount. Must be a positive number' },
        { status: 400 }
      );
    }
    
    // Validate wallet address (basic check)
    if (typeof walletAddress !== 'string' || walletAddress.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid wallet address' },
        { status: 400 }
      );
    }
    
    // Find the round
    const round = await prisma.round.findFirst({
      where: {
        id: roundId,
        symbol,
      },
    });
    
    if (!round) {
      return NextResponse.json(
        { error: 'Round not found' },
        { status: 404 }
      );
    }
    
    // Check if round is OPEN
    if (round.status !== RoundStatus.OPEN) {
      return NextResponse.json(
        { error: `Cannot place bet. Round is ${round.status}` },
        { status: 400 }
      );
    }
    
    // Execute token swap if needed
    let swapResult: any = null;
    let actualUsdc = paidAmount; // Default: if already USDC
    
    if (paidToken.toUpperCase() !== 'USDC') {
      console.log(`🔄 Swapping ${paidAmount} ${paidToken} to USDC...`);
      
      try {
        const connection = new Connection(process.env.HELIUS_RPC!);
        const platformWallet = getPlatformWallet();
        
        swapResult = await swapToUsdc(
          connection,
          platformWallet,
          paidToken,
          paidAmount,
          100 // 1% slippage
        );
        
        if (!swapResult.success) {
          throw new Error(swapResult.error || 'Swap failed');
        }
        
        actualUsdc = swapResult.outputAmount;
        console.log(`✅ Swap complete: ${actualUsdc.toFixed(2)} USDC received`);
      } catch (error) {
        console.error('Swap error:', error);
        return NextResponse.json(
          { error: 'Failed to swap tokens to USDC. Please try again.' },
          { status: 500 }
        );
      }
    }
    
    // Calculate platform fee (variable by token)
    // Stablecoins (USDC/USDT): 3% - no swap cost
    // Other tokens: 6% - includes swap cost
    const isStablecoin = ['USDC', 'USDT'].includes(paidToken.toUpperCase());
    const FEE_RATE = isStablecoin ? 0.03 : 0.06;
    const platformFee = actualUsdc * FEE_RATE;
    const netAmount = actualUsdc - platformFee; // Amount to add to pool
    
    console.log(`💰 Bet value: ${actualUsdc.toFixed(2)} USDC, Fee: ${platformFee.toFixed(2)} USDC (${(FEE_RATE * 100).toFixed(0)}%), Net: ${netAmount.toFixed(2)} USDC`);
    
    // Create bet and update round totals in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Find or create user
      const user = await tx.user.upsert({
        where: { walletAddress: walletAddress.trim() },
        update: {
          totalBets: { increment: 1 },
          totalVolume: { increment: new Prisma.Decimal(netAmount.toFixed(8)) },
        },
        create: {
          walletAddress: walletAddress.trim(),
          username: username || null,
          isAnonymous: isAnonymous || false,
          totalBets: 1,
          totalVolume: new Prisma.Decimal(netAmount.toFixed(8)),
        },
      });

      // Create the bet
      const bet = await tx.bet.create({
        data: {
          roundId,
          walletAddress: walletAddress.trim(),
          userId: user.id,
          side: side as BetSide,
          amount: new Prisma.Decimal(netAmount.toFixed(8)), // Net amount in pool (USDC)
          payout: new Prisma.Decimal(0),
          status: BetStatus.PENDING,
          
          // Original payment info
          transactionSignature: transactionSignature || null,
          paidToken: paidToken,
          paidAmount: new Prisma.Decimal(paidAmount.toFixed(8)),
          paymentMethod: transactionSignature ? 'wallet' : 'test',
          
          // Swap tracking
          swapSignature: swapResult?.signature || null,
          estimatedUsdc: estimatedUsdc ? new Prisma.Decimal(estimatedUsdc.toFixed(8)) : null,
          actualUsdc: new Prisma.Decimal(actualUsdc.toFixed(8)),
          slippage: swapResult?.slippage ? new Prisma.Decimal(swapResult.slippage.toFixed(4)) : null,
          
          // Fee
          platformFee: new Prisma.Decimal(platformFee.toFixed(8)),
          
          // User display info
          username: username || null,
          isAnonymous: isAnonymous || false,
        },
      });
      
      // Update round totals (with net USDC amount)
      const updateData: any = {};
      if (side === 'GREEN') {
        updateData.totalGreen = {
          increment: new Prisma.Decimal(netAmount.toFixed(8)),
        };
      } else {
        updateData.totalRed = {
          increment: new Prisma.Decimal(netAmount.toFixed(8)),
        };
      }
      
      const updatedRound = await tx.round.update({
        where: { id: roundId },
        data: updateData,
      });
      
      return { bet, updatedRound };
    });
    
    // Calculate live multipliers for response
    const V = parseFloat(result.updatedRound.totalGreen.toString());
    const R = parseFloat(result.updatedRound.totalRed.toString());
    const B = parseFloat(result.updatedRound.bonusBoost.toString());
    const f = parseFloat(result.updatedRound.feeRate.toString());
    
    const L = V + R;
    const Fee = L * f;
    const D = L + B - Fee;
    
    let multiplierGreen: string | null = null;
    let multiplierRed: string | null = null;
    
    if (V > 0) {
      multiplierGreen = (D / V).toFixed(4);
    }
    if (R > 0) {
      multiplierRed = (D / R).toFixed(4);
    }
    
    const now = new Date();
    const timeRemaining = Math.max(0, result.updatedRound.startTime.getTime() - now.getTime());
    
    const response: PlaceBetResponse = {
      bet: {
        id: result.bet.id,
        roundId: result.bet.roundId,
        walletAddress: result.bet.walletAddress,
        side: result.bet.side,
        amount: result.bet.amount.toString(),
        payout: result.bet.payout.toString(),
        status: result.bet.status,
        createdAt: result.bet.createdAt.toISOString(),
      },
      round: {
        id: result.updatedRound.id,
        symbol: result.updatedRound.symbol,
        timeframe: result.updatedRound.timeframe,
        startTime: result.updatedRound.startTime.toISOString(),
        endTime: result.updatedRound.endTime.toISOString(),
        status: result.updatedRound.status,
        totalGreen: result.updatedRound.totalGreen.toString(),
        totalRed: result.updatedRound.totalRed.toString(),
        bonusBoost: result.updatedRound.bonusBoost.toString(),
        feeRate: result.updatedRound.feeRate.toString(),
        multiplierGreen,
        multiplierRed,
        timeRemaining,
      },
    };
    
    return NextResponse.json(response, { status: 201 });
    
  } catch (error) {
    console.error('Error placing bet:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

