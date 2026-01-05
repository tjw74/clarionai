import { NextRequest, NextResponse } from 'next/server';
import { saveCashuToken } from '@/lib/routstr/token';
import { getEncodedTokenV4 } from '@cashu/cashu-ts';

export const runtime = 'nodejs';

// POST: Import Cashu tokens from user-provided token string
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = body as { token: string };

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token string is required' },
        { status: 400 }
      );
    }

    // Validate token format (should start with "cashu")
    if (!token.trim().startsWith('cashu')) {
      return NextResponse.json(
        { error: 'Invalid token format. Cashu tokens should start with "cashu"' },
        { status: 400 }
      );
    }

    // Save the token
    await saveCashuToken(token);

    // Try to decode and get basic info about the token
    try {
      // The token should be a valid Cashu token
      // We can't easily decode it without the mint, but we can save it
      return NextResponse.json({
        success: true,
        message: 'Token imported successfully',
        tokenPreview: token.substring(0, 50) + '...',
      });
    } catch (error: any) {
      // Even if decoding fails, save it anyway (user might know what they're doing)
      return NextResponse.json({
        success: true,
        message: 'Token saved (validation skipped)',
        warning: error?.message || 'Could not validate token format',
        tokenPreview: token.substring(0, 50) + '...',
      });
    }
  } catch (error) {
    console.error('Error importing Cashu token:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to import token' },
      { status: 500 }
    );
  }
}
