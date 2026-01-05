# User-Selectable Mint Upgrade

## Summary

The web app now supports user-selectable Cashu mints, allowing each user to choose which mint they want to use for payments. This eliminates cross-mint payment issues by ensuring the app creates quotes on the same mint that the user's wallet is configured for.

## What Changed

**Before:** The app used a single global mint (`https://8333.space:3338`) for all users, causing cross-mint payment failures when users' wallets were configured for different mints.

**After:** Users can select their preferred mint (from preset list or custom URL), and the app automatically uses that mint for creating payment quotes. The app also auto-detects the mint from existing tokens.

## Key Features

- **Mint Selection UI**: Users can choose from preset mints or enter a custom mint URL
- **Auto-Detection**: Automatically detects mint from existing tokens
- **Preference Storage**: Saves user's mint preference in localStorage
- **Validation**: Validates mint URLs and normalizes them (adds https:// if missing)
- **Warning Messages**: Clear warnings about wallet compatibility

## Implementation Details

### New Functions (`src/lib/routstr/token.ts`)
- `getUserMint()`: Gets user's preferred mint (priority: selection → token → default)
- `setUserMint()`: Saves user's mint preference
- `clearUserMint()`: Clears user's mint preference
- `validateMintUrl()`: Validates mint URL format
- `normalizeMintUrl()`: Normalizes mint URL (adds https:// if missing)
- `getMintFromToken()`: Extracts mint URL from token (via API)

### Updated Components
- **PaymentDialog**: Added mint selection UI with preset/custom options
- **CashuQRCode**: Now accepts and uses `mintUrl` prop
- **API Route** (`/api/routstr/cashu/receive`): Accepts `mintUrl` parameter

### User Experience Flow
1. User opens payment dialog
2. App loads user's mint preference (or auto-detects from existing token)
3. User can select preset mint or enter custom URL
4. User clicks "Scan QR Code"
5. App creates quote on user's selected mint
6. User pays with wallet configured for same mint
7. Payment succeeds without cross-mint issues

## Benefits

- ✅ Eliminates cross-mint payment failures
- ✅ Works with any Cashu mint
- ✅ Auto-detects mint from existing tokens
- ✅ User-friendly preset selection
- ✅ Supports custom mints
- ✅ Preference persistence

## Technical Notes

- Mint preference stored in `localStorage` as `routstr:userMint`
- Auto-detection uses token decode API to extract mint URL
- Falls back to default mint if no preference or token exists
- All payment flows now respect user's mint selection
