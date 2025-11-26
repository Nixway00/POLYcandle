/**
 * Round Scheduler Module
 * 
 * Manages the lifecycle of betting rounds:
 * 1. Creating new rounds for each 5-minute window
 * 2. Locking rounds when betting period ends
 * 3. Settling rounds and calculating payouts
 * 
 * This can be called manually via API or integrated with Vercel Cron
 */

import { prisma } from './prisma';
import { getCandleOHLC, determineWinner } from './priceFeed';
import { ACTIVE_SYMBOLS, TIMEFRAME_MS } from './types';
import { RoundStatus, BetStatus, WinnerSide, Prisma } from '@prisma/client';

/**
 * Aligns a timestamp to the nearest 5-minute window start
 * Example: 12:03:45 -> 12:00:00, 12:07:30 -> 12:05:00
 */
function alignToTimeframe(date: Date, timeframeMs: number): Date {
  const timestamp = date.getTime();
  const aligned = Math.floor(timestamp / timeframeMs) * timeframeMs;
  return new Date(aligned);
}

/**
 * Ensures that there is an OPEN round for each active symbol
 * for the current 5-minute window
 * 
 * Called by scheduler to create rounds proactively
 */
export async function ensureCurrentRounds(): Promise<void> {
  console.log('[Scheduler] Ensuring current rounds exist for all symbols...');
  
  const now = new Date();
  const currentWindowStart = alignToTimeframe(now, TIMEFRAME_MS);
  
  // If current window has already started, create round for NEXT window
  let nextWindowStart: Date;
  if (currentWindowStart.getTime() <= now.getTime()) {
    nextWindowStart = new Date(currentWindowStart.getTime() + TIMEFRAME_MS);
  } else {
    nextWindowStart = currentWindowStart;
  }
  
  const nextWindowEnd = new Date(nextWindowStart.getTime() + TIMEFRAME_MS);
  
  console.log(`[Scheduler] Creating rounds for window: ${nextWindowStart.toISOString()} - ${nextWindowEnd.toISOString()}`);
  
  for (const symbol of ACTIVE_SYMBOLS) {
    // Check if round already exists for this window
    const existingRound = await prisma.round.findFirst({
      where: {
        symbol,
        startTime: nextWindowStart,
      },
    });
    
    if (!existingRound) {
      // Create new round
      const newRound = await prisma.round.create({
        data: {
          symbol,
          timeframe: '5m',
          startTime: nextWindowStart,
          endTime: nextWindowEnd,
          status: RoundStatus.OPEN,
          totalGreen: new Prisma.Decimal(0),
          totalRed: new Prisma.Decimal(0),
          bonusBoost: new Prisma.Decimal(0),
          feeRate: new Prisma.Decimal(0.05), // 5% platform fee
        },
      });
      
      console.log(`[Scheduler] Created new round for ${symbol}: ${newRound.id} (${nextWindowStart.toISOString()} - ${nextWindowEnd.toISOString()})`);
    } else {
      console.log(`[Scheduler] Round for ${symbol} already exists for this window`);
    }
  }
  
  console.log('[Scheduler] Current rounds check completed');
}

/**
 * Locks all OPEN rounds whose startTime has passed
 * 
 * When a round is locked, no more bets can be placed
 */
export async function lockRoundsIfNeeded(): Promise<void> {
  console.log('[Scheduler] Checking for rounds to lock...');
  
  const now = new Date();
  
  const roundsToLock = await prisma.round.findMany({
    where: {
      status: RoundStatus.OPEN,
      startTime: {
        lte: now,
      },
    },
  });
  
  for (const round of roundsToLock) {
    await prisma.round.update({
      where: { id: round.id },
      data: { status: RoundStatus.LOCKED },
    });
    
    console.log(`[Scheduler] Locked round ${round.id} (${round.symbol})`);
  }
  
  console.log(`[Scheduler] Locked ${roundsToLock.length} round(s)`);
}

/**
 * Settles all LOCKED rounds whose endTime has passed
 * 
 * Settlement process:
 * 1. Fetch candle OHLC data
 * 2. Determine winner (GREEN, RED, or DRAW)
 * 3. Calculate multipliers using pari-mutuel formula
 * 4. Update all bets with payouts
 * 5. Mark round as SETTLED
 */
export async function settleRoundsIfNeeded(): Promise<void> {
  console.log('[Scheduler] Checking for rounds to settle...');
  
  const now = new Date();
  
  const roundsToSettle = await prisma.round.findMany({
    where: {
      status: RoundStatus.LOCKED,
      endTime: {
        lte: now,
      },
    },
    include: {
      bets: true,
    },
  });
  
  for (const round of roundsToSettle) {
    console.log(`[Scheduler] Settling round ${round.id} (${round.symbol})...`);
    
    try {
      // 1. Fetch candle data
      const ohlc = await getCandleOHLC(round.symbol, round.startTime, round.endTime);
      const winnerSide = determineWinner(ohlc);
      
      console.log(`[Scheduler] Round ${round.id} outcome: ${winnerSide} (open: ${ohlc.open}, close: ${ohlc.close})`);
      
      // 2. Calculate pool and multipliers
      const V = parseFloat(round.totalGreen.toString());
      const R = parseFloat(round.totalRed.toString());
      const B = parseFloat(round.bonusBoost.toString());
      const f = parseFloat(round.feeRate.toString());
      
      const L = V + R; // Total user pool
      const Fee = L * f; // Platform fee
      const D = L + B - Fee; // Distribution pool
      
      let multiplierGreen: Prisma.Decimal | null = null;
      let multiplierRed: Prisma.Decimal | null = null;
      
      // 3. Handle different outcomes
      if (winnerSide === WinnerSide.DRAW) {
        // DRAW: Refund all bets
        console.log(`[Scheduler] DRAW - refunding all bets`);
        
        for (const bet of round.bets) {
          await prisma.bet.update({
            where: { id: bet.id },
            data: {
              status: BetStatus.REFUNDED,
              payout: bet.amount, // Return original amount
            },
          });
        }
      } else {
        // GREEN or RED wins
        if (V > 0) {
          multiplierGreen = new Prisma.Decimal((D / V).toFixed(8));
        }
        if (R > 0) {
          multiplierRed = new Prisma.Decimal((D / R).toFixed(8));
        }
        
        console.log(`[Scheduler] Multipliers - Green: ${multiplierGreen?.toString() || 'N/A'}, Red: ${multiplierRed?.toString() || 'N/A'}`);
        
        // Update all bets
        for (const bet of round.bets) {
          let newStatus: BetStatus;
          let payout: Prisma.Decimal;
          
          if (bet.side === winnerSide) {
            // Winner
            newStatus = BetStatus.WON;
            const multiplier = winnerSide === WinnerSide.GREEN ? multiplierGreen : multiplierRed;
            
            if (multiplier) {
              const betAmount = parseFloat(bet.amount.toString());
              const multiplierValue = parseFloat(multiplier.toString());
              payout = new Prisma.Decimal((betAmount * multiplierValue).toFixed(8));
            } else {
              // Edge case: no multiplier (shouldn't happen if there are bets)
              payout = bet.amount;
            }
          } else {
            // Loser
            newStatus = BetStatus.LOST;
            payout = new Prisma.Decimal(0);
          }
          
          await prisma.bet.update({
            where: { id: bet.id },
            data: {
              status: newStatus,
              payout,
            },
          });
        }
      }
      
      // 4. Update round as settled
      await prisma.round.update({
        where: { id: round.id },
        data: {
          status: RoundStatus.SETTLED,
          winnerSide: winnerSide as WinnerSide,
          multiplierGreen,
          multiplierRed,
        },
      });
      
      console.log(`[Scheduler] Round ${round.id} settled successfully`);
      
    } catch (error) {
      console.error(`[Scheduler] Error settling round ${round.id}:`, error);
      // Continue with other rounds even if one fails
    }
  }
  
  console.log(`[Scheduler] Settled ${roundsToSettle.length} round(s)`);
}

/**
 * Runs all scheduler tasks in sequence
 * This is the main entry point for the scheduler
 */
export async function runScheduler(): Promise<{ success: boolean; message: string }> {
  try {
    console.log('[Scheduler] Starting scheduler run...');
    
    await ensureCurrentRounds();
    await lockRoundsIfNeeded();
    await settleRoundsIfNeeded();
    
    console.log('[Scheduler] Scheduler run completed successfully');
    
    return {
      success: true,
      message: 'Scheduler completed successfully',
    };
  } catch (error) {
    console.error('[Scheduler] Error during scheduler run:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

