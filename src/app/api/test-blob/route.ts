import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing Vercel Blob configuration...');
    
    // Check if the token exists
    const hasToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    console.log('BLOB_READ_WRITE_TOKEN exists:', hasToken);
    
    if (!hasToken) {
      return NextResponse.json({
        error: 'BLOB_READ_WRITE_TOKEN environment variable is not set',
        configured: false
      }, { status: 500 });
    }

    // Get token info (without exposing the actual token)
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const tokenLength = token?.length || 0;
    const tokenPrefix = token?.substring(0, 8) + '...';

    return NextResponse.json({
      configured: true,
      tokenLength,
      tokenPrefix,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Blob configuration test error:', error);
    return NextResponse.json({
      error: 'Failed to test blob configuration',
      configured: false
    }, { status: 500 });
  }
}
