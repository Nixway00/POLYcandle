/**
 * Database Seed Script
 * 
 * This script creates initial rounds for testing purposes
 * Run with: npx ts-node scripts/seed.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ZECUSDT'];
  const now = new Date();
  
  // Align to 5-minute window
  const TIMEFRAME_MS = 5 * 60 * 1000;
  const alignedTime = new Date(Math.floor(now.getTime() / TIMEFRAME_MS) * TIMEFRAME_MS);
  const endTime = new Date(alignedTime.getTime() + TIMEFRAME_MS);
  
  console.log(`Creating rounds for window: ${alignedTime.toISOString()} - ${endTime.toISOString()}`);
  
  for (const symbol of symbols) {
    const round = await prisma.round.create({
      data: {
        symbol,
        timeframe: '5m',
        startTime: alignedTime,
        endTime: endTime,
        status: 'OPEN',
        totalGreen: 0,
        totalRed: 0,
        bonusBoost: 0,
        feeRate: 0.05,
      },
    });
    
    console.log(`✅ Created round for ${symbol}: ${round.id}`);
  }
  
  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

