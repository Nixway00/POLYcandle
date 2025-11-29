import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('⚠️ DATABASE_URL environment variable is not set!');
  console.error('Please configure DATABASE_URL in your environment variables.');
}

// Initialize Prisma Client
// In production (Vercel), we need to ensure Prisma Client is generated
// The build script runs "prisma generate && next build" to ensure this
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

