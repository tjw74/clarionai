# Cashu Payment Safety Guide

## Understanding the Payment Flow

### How Cashu Payments Work

1. **Quote Creation** (No payment yet - SAFE)
   - You request a payment QR code
   - The app creates a "quote" on the Cashu mint
   - A Lightning invoice is generated
   - QR code is displayed
   - **At this point: NO MONEY HAS MOVED**

2. **Payment** (You pay via Lightning)
   - You scan QR code with your Cashu wallet
   - Your wallet pays the Lightning invoice
   - Payment goes to the Lightning Network
   - **Your sats are now at the mint, but NOT yet converted to tokens**

3. **Token Claiming** (Critical step)
   - App polls the mint to check if payment is confirmed
   - Once confirmed, app calls `mintProofs()` to claim tokens
   - Mint converts your paid sats into Cashu ecash tokens
   - Tokens are returned to the app
   - **Only now are your sats converted to usable tokens**

### The Critical Risk Point

**Between steps 2 and 3 is where you can lose sats:**
- If payment is confirmed but tokens are never claimed
- If there's a mint mismatch (payment goes to wrong mint)
- If the app crashes or times out before claiming

## Why 1,000 Sats Minimum?

The 1,000 sat minimum exists for several reasons:

1. **Lightning Network Minimums**
   - Lightning invoices typically have minimum amounts
   - Many Lightning nodes won't process very small payments
   - 1,000 sats (~$0.40) is a common Lightning minimum

2. **Mint Operational Costs**
   - Mints need to cover Lightning routing fees
   - Very small amounts may not cover operational costs
   - 1,000 sats ensures the payment is economically viable

3. **Testing Safety**
   - Larger minimums reduce risk of losing funds in testing
   - But 1k is still small enough for testing
   - **However: This is NOT a guarantee of safety**

4. **Cashu Protocol Limits**
   - Some mints may enforce their own minimums
   - The Cashu SDK may have minimum requirements

**Important:** The 1k minimum is NOT a safety guarantee - it's a technical requirement. You can still lose your 1k sats if something goes wrong.

## Safety Guarantees - What You Need to Know

### ⚠️ CURRENT RISKS

1. **Cross-Mint Payment Issue** (KNOWN BUG)
   - If your wallet uses a different mint than the app
   - Payment goes to your wallet's mint
   - But quote exists on app's mint
   - **Result: Sats stuck, tokens never claimed**
   - **Status: Partially mitigated with recovery tools**

2. **Payment Timeout**
   - App polls for 10 minutes (200 attempts)
   - If payment takes longer, polling stops
   - **Result: Payment confirmed but tokens not claimed**
   - **Mitigation: "Claim Tokens" button for manual recovery**

3. **App Crash/Network Issues**
   - If app crashes after payment but before claiming
   - If network fails during token claiming
   - **Result: Payment confirmed but tokens not claimed**
   - **Mitigation: Recovery tools available**

4. **Mint Goes Offline**
   - If mint goes offline after payment
   - Cannot claim tokens until mint is back
   - **Result: Temporary loss until mint recovers**

### ✅ SAFETY MECHANISMS IN PLACE

1. **Quote ID Storage**
   - Quote ID saved to `localStorage` as `cashu:lastQuote`
   - Contains: quote ID, amount, mint URL, timestamp
   - **Use this for recovery if payment succeeds but tokens not claimed**

2. **Recovery Tools**
   - "Claim Tokens" button in QR code dialog
   - Token Recovery dialog for manual recovery
   - Can specify mint URL if cross-mint issue occurs

3. **Payment Polling**
   - Automatically checks every 3 seconds
   - Continues for 10 minutes
   - Tries alternate mints if quote not found

4. **Error Messages**
   - Clear error messages for cross-mint issues
   - Guidance on which mint to use for recovery

## How to Test Safely

### Option 1: Use Manual Token Input (SAFEST)
1. Get a Cashu token from another source
2. Use "Paste Token" option in payment dialog
3. **No payment risk - you already have the token**

### Option 2: Test with Small Amount (Still Risky)
1. Use minimum 1,000 sats
2. **Before paying:**
   - Check browser console for quote ID
   - Save the quote ID and mint URL
   - Note the exact amount
3. **After paying:**
   - Wait for automatic claiming (up to 10 minutes)
   - If timeout, use "Claim Tokens" button
   - If that fails, use Token Recovery dialog

### Option 3: Use Test Mint (If Available)
1. Find a test/development mint
2. Use test Lightning network
3. Test with test sats (not real money)

## Recovery Procedures

### If Payment Succeeds But Tokens Not Claimed

1. **Check localStorage:**
   ```javascript
   // In browser console:
   const lastQuote = localStorage.getItem('cashu:lastQuote');
   console.log(JSON.parse(lastQuote));
   ```

2. **Use Token Recovery Dialog:**
   - Open Token Recovery
   - Enter quote ID from localStorage
   - Enter amount (1,000 sats)
   - Enter mint URL (check which mint you actually paid to)
   - Click "Recover"

3. **If Cross-Mint Issue:**
   - Check your wallet settings - which mint is it configured for?
   - Use that mint URL in recovery dialog
   - The app will try to find your quote on that mint

### If You Lose Your Quote ID

Unfortunately, if you lose the quote ID:
- **You cannot recover the tokens automatically**
- The Cashu protocol requires the quote ID to claim tokens
- Contact the mint operator directly
- Provide: invoice string, payment hash, timestamp, amount
- They may be able to help manually

## Recommendations

### Before Testing

1. **Understand the risks** - You can lose your 1k sats
2. **Save quote information** - Quote ID, mint URL, amount
3. **Check your wallet's mint** - Ensure it matches app's mint
4. **Test in small increments** - Don't test with large amounts

### During Testing

1. **Monitor the payment flow** - Watch for errors
2. **Keep browser open** - Don't close during payment
3. **Check console logs** - Look for quote ID and errors
4. **Wait for completion** - Don't interrupt the flow

### After Testing

1. **Verify tokens received** - Check token balance
2. **Save recovery info** - Keep quote ID and mint URL
3. **Test token usage** - Make sure tokens work for API calls

## Current Limitations

1. **No automatic cross-mint detection** - App doesn't know which mint you paid to
2. **No payment status persistence** - If you refresh, polling restarts
3. **Limited recovery options** - Requires quote ID
4. **No refund mechanism** - If payment succeeds but tokens fail, no automatic refund

## What We're Working On

1. **Better cross-mint handling** - Detect and handle mint mismatches
2. **Persistent payment tracking** - Resume polling after refresh
3. **Better recovery UI** - Easier to specify mint and recover
4. **Payment history** - Track all payment attempts

## Bottom Line

**The 1k sat minimum is a technical requirement, NOT a safety guarantee.**

**You CAN lose your 1k sats if:**
- Cross-mint payment issue occurs
- App crashes before claiming tokens
- Network fails during claiming
- Mint goes offline

**To minimize risk:**
- Use manual token input if possible
- Save quote information before paying
- Monitor the payment flow
- Use recovery tools if needed
- Test with amounts you're willing to lose

**The app has recovery mechanisms, but they require:**
- Quote ID (saved automatically to localStorage)
- Correct mint URL (may need to check your wallet)
- Manual intervention (using recovery tools)
