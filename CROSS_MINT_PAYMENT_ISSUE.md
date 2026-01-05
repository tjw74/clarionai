# Cross-Mint Payment Issue - Design Flaw

## The Problem

**What happened:**
1. Web app created a quote on `https://8333.space:3338` (default mint)
2. User paid using Minibits wallet configured for `mint.coinos.io` (different mint)
3. Payment went to `mint.coinos.io`, but quote doesn't exist there
4. Tokens were **NEVER REDEEMED** because payment verification failed
5. Sats are stuck at `mint.coinos.io` with no quote to claim them

## Root Cause

**Cashu quotes are mint-specific:**
- A quote created on Mint A can only be claimed from Mint A
- If you pay to Mint B, those sats are at Mint B, but there's no quote there
- The web app doesn't detect this mismatch

## Why This Happens

When a user's Cashu wallet (like Minibits) is configured for a specific mint:
- The wallet may route payments through its configured mint
- Even if the invoice was created by a different mint
- This creates a mint mismatch that breaks token redemption

## Current Status

**Your 1k sats:**
- Location: `mint.coinos.io` (where you paid)
- Status: Paid but not claimed (no quote exists there)
- Quote ID: `68621f3d94e538bdc0eb1f3add38a5b9b87d1cdc530f` (exists on `8333.space:3338`, not on `mint.coinos.io`)

**Tokens:**
- Status: **NEVER REDEEMED** - `mintProofs()` was never called
- Reason: Payment verification failed due to mint mismatch

## Solutions

### Short-term (Recovery)
1. Check if `mint.coinos.io` has a quote ID for your payment (unlikely - quotes are created before payment)
2. Contact `mint.coinos.io` support to see if they can help recover the sats
3. The sats may be recoverable if the mint has a way to query payments by invoice

### Long-term (Fix)
1. **Detect mint mismatch**: When "quote not found" error occurs, try common mints or ask user
2. **User-selectable mint**: Allow users to choose which mint to use before generating QR code
3. **Better error messages**: Clearly explain mint mismatch issues
4. **Payment recovery UI**: Make it easier to specify which mint was actually used for payment

## Technical Details

**Code flow:**
```
1. requestCashuInvoice() → Creates quote on configured mint (8333.space:3338)
2. User pays → Payment goes to user's wallet's mint (mint.coinos.io)
3. checkCashuPayment() → Checks original mint (8333.space:3338) for quote
4. Result: "quote not found" or connection error
5. mintProofs() → NEVER CALLED (tokens never redeemed)
```

**What should happen:**
- Detect when quote doesn't exist on original mint
- Try to find quote on user's wallet's mint
- Or allow user to specify which mint they paid to
- Claim tokens from the correct mint
