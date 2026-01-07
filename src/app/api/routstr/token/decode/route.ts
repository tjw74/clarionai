import { NextRequest, NextResponse } from 'next/server';
import { getDecodedToken } from '@cashu/cashu-ts';

export const runtime = 'nodejs';

// POST: Decode a Cashu token to see its contents (amount, mint, proofs)
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

    try {
      // Decode the token
      const decoded = getDecodedToken(token);
      
      // Calculate total amount from proofs
      let totalAmount = 0;
      const mintUrls = new Set<string>();
      
      if (decoded.mint) {
        mintUrls.add(decoded.mint);
      }
      if (decoded.proofs) {
        decoded.proofs.forEach((proof) => {
          if (proof.amount) {
            totalAmount += proof.amount;
          }
        });
      }

      return NextResponse.json({
        success: true,
        token: {
          totalAmount,
          totalAmountSats: totalAmount,
          mints: Array.from(mintUrls),
          numProofs: decoded.proofs?.length || 0,
          isSpent: false, // We can't check if spent without querying the mint
        },
        decoded: {
          mint: decoded.mint,
          memo: decoded.memo,
          unit: decoded.unit,
          proofs: decoded.proofs?.map((p) => ({
            amount: p.amount,
            secret: p.secret ? (typeof p.secret === 'string' ? p.secret.substring(0, 16) + '...' : '...') : undefined,
            C: p.C ? (typeof p.C === 'string' ? p.C.substring(0, 16) + '...' : '...') : undefined,
          })),
        },
      });
    } catch (error: any) {
      return NextResponse.json({
        error: 'Failed to decode token',
        message: error?.message || 'Invalid token format',
        suggestion: 'Make sure the token string is complete and not truncated',
      }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to decode token' },
      { status: 500 }
    );
  }
}
