import { NextRequest, NextResponse } from 'next/server';
import { Mint, Wallet } from '@cashu/cashu-ts';

export const runtime = 'nodejs';

/**
 * Recover tokens using Payment ID or invoice instead of quote ID
 * This queries the mint directly for pending payments
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mintUrl, paymentId, invoice, amount } = body as { 
      mintUrl: string; 
      paymentId?: string;
      invoice?: string;
      amount: number;
    };

    if (!mintUrl) {
      return NextResponse.json(
        { error: 'Mint URL is required' },
        { status: 400 }
      );
    }

    if (!amount || amount < 1000) {
      return NextResponse.json(
        { error: 'Amount is required (minimum 1000 sats)' },
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
      }, { status: 500 });
    }

    // Unfortunately, Cashu mints don't expose a public API to query by Payment ID or invoice
    // The only way is via quote ID
    
    // BUT - we can try to list all pending quotes and match by amount
    // This is a workaround - not all mints support this
    
    return NextResponse.json({
      error: 'Cashu mints do not support querying by Payment ID or invoice',
      explanation: 'Cashu protocol only allows claiming tokens via quote ID. The quote ID is generated when the invoice is created, not when payment is made.',
      whatYouNeed: 'The quote ID from when the QR code/invoice was generated',
      alternative: 'If you have the Lightning invoice string, we can try to extract information from it, but the quote ID is still required to claim tokens.',
      suggestion: 'Check the browser localStorage for "cashu:lastQuote" - this contains the quote ID from when the QR code was generated. OR contact mint.coinos.io support with your Payment ID and they may be able to provide the quote ID.',
    }, { status: 400 });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to recover tokens' },
      { status: 500 }
    );
  }
}
