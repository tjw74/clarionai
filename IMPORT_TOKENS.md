# Import Your Cashu Tokens

You provided two Cashu tokens. Here's how to import them:

## Option 1: Use the API directly

Run this in your browser console (F12):

```javascript
// Token 1
fetch('/api/routstr/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'cashuBo2Ftdmh0dHBzOi8vbWludC5jb2lub3MuaW9hdWNzYXRhdIGiYWlIAE963yoENWxhcIGjYWEZAgBhc3hAOWIwMzcyYjBlOGIyZTA0NWMxZDM1YTM0NjY4ODBiOGZjM2I5YmY0YWUxMGE3YmI1NTJkMDMxNzBiM2VlMGM2ZmFjWCECeWWqrx3yV5rEMQtUiloJj9mfMUBSaFyynCfxB3BAYqOiYWlIAHMRqi-ljMhhcJGkYWEYgGFzeEA5NjJlNzdjMjAyZDY1MGJiY2U4NmRlZmYxNmMwZDYzNjZjOWI5YWViNjJmYzRmYTQyMGM3NmUyYTI3YmQ3NGJmYWNYIQLheMlUjz1Y48d-Gr7Vv5X6vnr5eO4LtvAJsCR5iXKARGFko2FlWCBD4mHYoB-7-Zbdcp-EfYRKzguMnak-uBOwkRKC_0hhYWFzWCCdYjlnskVeaoGL5f_43-uTt8pIwM6HBLcqufJnMksA2mFyWCC2fdAw9XinnE-WUULkqiLQk2Bh5SLfGuIQbv-C2pMYB6RhYRhAYXN4QGRmNDExNTRmOWVlYTE0MzExMDM4NmJkY2Y5N2M2ZDBjNGU5YmZhZDViYzE0M2UxODg0ZTQ1NzUyOTlmYzEwMTJhY1ghA98Z-wC-jM0D2JLOd8KI-IbW33s9gRa1ZC3gihs70tL9YWSjYWVYIAHFCXzrVTiAm15r-9xKcUIcUxWNJ3W7S7cvCUAv4zpsYXNYIBDoPiiW4n7yunf89mI8Y-mMEn7M-zNOEt1yAgrdlzN6YXJYIHL3mu25V7FjG9...'
  })
}).then(r => r.json()).then(console.log);

// Token 2
fetch('/api/routstr/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: 'cashuBo2Ftdmh0dHBzOi8vbWludC5jb2lub3MuaW9hdWNzYXRhdIGiYWlIAHMRqi-ljMhhcIKkYWEIYXN4QDIxMTNiMTc2NWYzZTEwNjcwZGI1MzUwNzBjNzllMWVkY2YxZDExNTcxNjg2ZjVmZTgxOGYzMDg5OTk1Y2ZlOTZhY1ghAtLGRV-47xOwBaRMauQJN3HMNt7WLG_WGHxSp8SDch4PYWSjYWVYIMsRQSb6NA6m_p3BE5rpporp_pZluZBHHYIBZVexIiFbYXNYID8k9qolF81F3bNSONiDdgjMRSjrmvQMxJRZXaoQfP1tYXJYIJ7y8uAE4-nihjVoCc1PhBkEiMd3adDrlb5enscLPKDvpGFhAWFzeEA1YzM0ODZkZTkzMzU4OWI1Y2I5NGQyYTAyMzRjMzhlNzEwYjY3MTJhMzM4MDQxZjQ2NzQ3ZmRhYzA5ODQ2ZDA2YWNYIQNnGDgAlyUwXn0g-JGvNJuUlVNu8-33Lvz9jo4OepH8ImFko2FlWCARlDxLG8oN6RRXxQnftPiuWc6VBpFkeyfaX4L1qfhFdmFzWCBwwJejISbwtW_IcgEZ09x5d3hsZx0g_jL4xTdm2UhsKGFyWCCJ-MnvXOoEdbe1MKiEskuR9K14c_Kwnid28oY6dGqdzQ'
  })
}).then(r => r.json()).then(console.log);
```

## Option 2: Add Import Button to UI

I can add an "Import Token" button to the TokenManager component that lets you paste the token directly.

## Note

These tokens appear to be from `mint.coinos.io` (based on the encoded mint URL in the token). They should work with Routstr once imported.

**Which option do you prefer?**
