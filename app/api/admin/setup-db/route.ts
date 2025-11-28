/**
 * API Endpoint: Setup Database Schema
 * POST /api/admin/setup-db
 * 
 * Applies Prisma schema to database
 * Run this ONCE after deployment to create tables
 */

import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    console.log('🔄 Starting database setup...');
    
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: 'DATABASE_URL environment variable not configured',
        },
        { status: 500 }
      );
    }

    // Run prisma db push
    console.log('📊 Applying Prisma schema...');
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss');
    
    console.log('✅ Database setup completed');
    console.log('Output:', stdout);
    
    if (stderr) {
      console.warn('Warnings:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Database schema applied successfully',
      output: stdout,
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorOutput = error instanceof Error && 'stdout' in error 
      ? (error as any).stdout 
      : undefined;

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to setup database',
        details: errorMessage,
        output: errorOutput,
      },
      { status: 500 }
    );
  }
}

