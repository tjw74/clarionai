import { NextRequest, NextResponse } from 'next/server';
import { Mint, Wallet } from '@cashu/cashu-ts';

export const runtime = 'nodejs';

/**
 * Query a mint for payment information by invoice or other identifiers
 * This is a recovery mechanism when quote ID doesn't work
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mintUrl, invoice, paymentHash } = body as { 
      mintUrl: string; 
      invoice?: string; 
      paymentHash?: string;
    };

    if (!mintUrl) {
      return NextResponse.json(
        { error: 'Mint URL is required' },
        { status: 400 }
      );
    }

    const mint = new Mint(mintUrl);
    const wallet = new Wallet(mint, { unit: 'sat' });

    try {
      await wallet.loadMint();
    } catch (error: any) {
      return NextResponse.json({
        error: `Cannot connect to mint: ${error?.message}`,
        suggestion: 'Verify the mint URL is correct and accessible',
      }, { status: 500 });
    }

    // Try to get mint info to see what endpoints are available
    const mintInfo = await mint.getInfo();
    
    // Unfortunately, Cashu mints don't expose a way to query payments by invoice
    // Quotes are the only way to track payments, and they're mint-specific
    
    return NextResponse.json({
      error: 'Cashu mints do not expose payment query endpoints',
      explanation: 'Cashu payments can only be tracked via quote IDs, which are mint-specific. If you paid to a different mint than the one that created the quote, the payment cannot be automatically recovered.',
      mintInfo: {
        name: mintInfo.name,
        version: mintInfo.version,
        description: mintInfo.description,
      },
      suggestion: 'Contact the mint operator directly. They may be able to help recover the payment if you provide: invoice, payment hash, or timestamp.',
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query payment' },
      { status: 500 }
    );
  }
}
