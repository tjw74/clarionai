// Quick script to import Cashu tokens
const tokens = [
  'cashuBo2Ftdmh0dHBzOi8vbWludC5jb2lub3MuaW9hdWNzYXRhdIGiYWlIAE963yoENWxhcIGjYWEZAgBhc3hAOWIwMzcyYjBlOGIyZTA0NWMxZDM1YTM0NjY4ODBiOGZjM2I5YmY0YWUxMGE3YmI1NTJkMDMxNzBiM2VlMGM2ZmFjWCECeWWqrx3yV5rEMQtUiloJj9mfMUBSaFyynCfxB3BAYqOiYWlIAHMRqi-ljMhhcJGkYWEYgGFzeEA5NjJlNzdjMjAyZDY1MGJiY2U4NmRlZmYxNmMwZDYzNjZjOWI5YWViNjJmYzRmYTQyMGM3NmUyYTI3YmQ3NGJmYWNYIQLheMlUjz1Y48d-Gr7Vv5X6vnr5eO4LtvAJsCR5iXKARGFko2FlWCBD4mHYoB-7-Zbdcp-EfYRKzguMnak-uBOwkRKC_0hhYWFzWCCdYjlnskVeaoGL5f_43-uTt8pIwM6HBLcqufJnMksA2mFyWCC2fdAw9XinnE-WUULkqiLQk2Bh5SLfGuIQbv-C2pMYB6RhYRhAYXN4QGRmNDExNTRmOWVlYTE0MzExMDM4NmJkY2Y5N2M2ZDBjNGU5YmZhZDViYzE0M2UxODg0ZTQ1NzUyOTlmYzEwMTJhY1ghA98Z-wC-jM0D2JLOd8KI-IbW33s9gRa1ZC3gihs70tL9YWSjYWVYIAHFCXzrVTiAm15r-9xKcUIcUxWNJ3W7S7cvCUAv4zpsYXNYIBDoPiiW4n7yunf89mI8Y-mMEn7M-zNOEt1yAgrdlzN6YXJYIHL3mu25V7FjG9...',
  'cashuBo2Ftdmh0dHBzOi8vbWludC5jb2lub3MuaW9hdWNzYXRhdIGiYWlIAHMRqi-ljMhhcIKkYWEIYXN4QDIxMTNiMTc2NWYzZTEwNjcwZGI1MzUwNzBjNzllMWVkY2YxZDExNTcxNjg2ZjVmZTgxOGYzMDg5OTk1Y2ZlOTZhY1ghAtLGRV-47xOwBaRMauQJN3HMNt7WLG_WGHxSp8SDch4PYWSjYWVYIMsRQSb6NA6m_p3BE5rpporp_pZluZBHHYIBZVexIiFbYXNYID8k9qolF81F3bNSONiDdgjMRSjrmvQMxJRZXaoQfP1tYXJYIJ7y8uAE4-nihjVoCc1PhBkEiMd3adDrlb5enscLPKDvpGFhAWFzeEA1YzM0ODZkZTkzMzU4OWI1Y2I5NGQyYTAyMzRjMzhlNzEwYjY3MTJhMzM4MDQxZjQ2NzQ3ZmRhYzA5ODQ2ZDA2YWNYIQNnGDgAlyUwXn0g-JGvNJuUlVNu8-33Lvz9jo4OepH8ImFko2FlWCARlDxLG8oN6RRXxQnftPiuWc6VBpFkeyfaX4L1qfhFdmFzWCBwwJejISbwtW_IcgEZ09x5d3hsZx0g_jL4xTdm2UhsKGFyWCCJ-MnvXOoEdbe1MKiEskuR9K14c_Kwnid28oY6dGqdzQ'
];

// Note: This combines tokens - Cashu tokens from the same mint can be combined
// Import the first token (or combine both if they're from the same mint)
console.log('To import, use the "Import" button in the UI, or run this in browser console:');
console.log(`
fetch('/api/routstr/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: '${tokens[0]}'
  })
}).then(r => r.json()).then(console.log);
`);
