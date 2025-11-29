import { PrismaClient } from '@prisma/client';

// PrismaClient is attached to the `global` object in development to prevent
// exhausting your database connection limit.
// Learn more: https://pris.ly/d/help/next-js-best-practices

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Check if DATABASE_URL is configured
if (!process.env.DATABASE_URL) {
  console.error('⚠️ DATABASE_URL environment variable is not set!');
  console.error('Please configure DATABASE_URL in your environment variables.');
  // Don't throw in module scope - let it fail gracefully in API routes
}

let prismaInstance: PrismaClient;

try {
  prismaInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
} catch (error) {
  console.error('❌ Failed to initialize Prisma Client:', error);
  // Create a dummy instance to prevent app crash
  prismaInstance = {} as PrismaClient;
}

export const prisma = prismaInstance;

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

