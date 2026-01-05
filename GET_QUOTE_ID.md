# How to Get Your Quote ID (Mac)

## Method 1: Use the Debug Page (EASIEST)

1. **Go to:** `http://localhost:3010/routstr-debug` (or your app URL + `/routstr-debug`)
2. **The quote ID will be displayed** and automatically copied to your clipboard
3. **Copy it** and use it in the Recover dialog

## Method 2: Right-Click Method

1. **Right-click anywhere on the page**
2. **Click "Inspect" or "Inspect Element"**
3. **Click the "Application" tab** (or "Storage" in Firefox)
4. **Click "Local Storage"** in the left sidebar
5. **Click your site's domain** (localhost:3010)
6. **Find `cashu:lastQuote`** and click it
7. **Copy the "quote" value** from the JSON

## Method 3: Keyboard Shortcuts

**Chrome/Edge:**
- `Cmd + Option + I` (or `Cmd + Shift + I`)

**Firefox:**
- `Cmd + Option + I` (or `Cmd + Shift + I`)

**Safari:**
- First enable Developer menu: Safari → Settings → Advanced → Check "Show Develop menu"
- Then: `Cmd + Option + I`

## Method 4: From Terminal (If you have the app running)

The quote ID from your logs is:
**`20a8ba93d208f3375f2a68621f3d94e538bdc0eb1f3add38a5b9b87d1cdc530f`**

Try this in the Recover dialog:
- Quote ID: `20a8ba93d208f3375f2a68621f3d94e538bdc0eb1f3add38a5b9b87d1cdc530f`
- Mint URL: `https://mint.coinos.io`
- Amount: `1000`
