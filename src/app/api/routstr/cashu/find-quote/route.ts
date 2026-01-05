import { NextRequest, NextResponse } from 'next/server';
import { Mint } from '@cashu/cashu-ts';

export const runtime = 'nodejs';

// POST: Try to find quote ID from invoice or other identifiers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { invoice, mintUrl } = body as { invoice?: string; mintUrl?: string };

    const mintUrlToUse = mintUrl || 'https://8333.space:3338';
    const mint = new Mint(mintUrlToUse);

    // Try to get mint info to see available endpoints
    try {
      const info = await mint.getInfo();
      
      // Unfortunately, Cashu mints don't expose a "list quotes" endpoint
      // The quote ID is only returned when creating the quote
      
      return NextResponse.json({
        error: 'Cannot retrieve quote ID from mint. Quote ID is only available when creating the invoice.',
        suggestion: 'Check server logs or browser localStorage for the quote ID that was generated when the QR code was created.',
        mintInfo: info,
      }, { status: 400 });
    } catch (error: any) {
      return NextResponse.json({
        error: `Cannot connect to mint: ${error?.message}`,
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to query mint' },
      { status: 500 }
    );
  }
}
