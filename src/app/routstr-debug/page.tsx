'use client';

import { useEffect, useState } from 'react';

export default function RoutstrDebugPage() {
  const [quote, setQuote] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [allLocalStorage, setAllLocalStorage] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get ALL localStorage items
    const all: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        all[key] = localStorage.getItem(key) || '';
      }
    }
    setAllLocalStorage(all);

    // Get quote from localStorage
    const lastQuote = localStorage.getItem('cashu:lastQuote');
    if (lastQuote) {
      try {
        const data = JSON.parse(lastQuote);
        setQuote(data.quote || null);
        // Auto-copy to clipboard
        if (data.quote) {
          navigator.clipboard.writeText(data.quote);
        }
      } catch (e) {
        // ignore
      }
    }

    // Also check all localStorage keys for quote
    if (!quote) {
      for (const [key, value] of Object.entries(all)) {
        if (key.includes('quote') || key.includes('cashu')) {
          try {
            const parsed = JSON.parse(value);
            if (parsed.quote) {
              setQuote(parsed.quote);
              break;
            }
          } catch (e) {
            // Check if value itself looks like a quote ID (hex string)
            if (typeof value === 'string' && value.length > 20 && /^[a-f0-9]+$/i.test(value)) {
              setQuote(value);
            }
          }
        }
      }
    }

    // Get token
    import('@/lib/routstr/token').then(({ loadCashuToken }) => {
      loadCashuToken().then((t) => setToken(t));
    });
  }, []);

  return (
    <div className="p-8 bg-black text-white min-h-screen">
      <h1 className="text-2xl mb-4">Routstr Debug Info</h1>
      
      <div className="space-y-4">
        <div>
          <h2 className="text-lg mb-2">Quote ID:</h2>
          <div className="bg-black border border-white/20 p-4 rounded font-mono text-sm break-all">
            {quote || 'Not found in localStorage. Check server console logs for [Cashu] messages when QR code was generated.'}
          </div>
          {quote && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(quote);
                alert('Copied!');
              }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Copy Quote ID
            </button>
          )}
          {!quote && (
            <div className="mt-2 text-xs text-white/60">
              <p>If you paid, check:</p>
              <ol className="list-decimal list-inside mt-1 space-y-1">
                <li>Server console logs (terminal where you ran npm run dev)</li>
                <li>Browser console (F12) for any stored data</li>
                <li>Your minibits wallet payment history for invoice details</li>
              </ol>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg mb-2">Cashu Token:</h2>
          <div className="bg-black border border-white/20 p-4 rounded font-mono text-xs break-all max-h-96 overflow-auto">
            {token || 'No token - recover tokens first'}
          </div>
          {token && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(token);
                alert('Copied!');
              }}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded"
            >
              Copy Token
            </button>
          )}
        </div>

        <div>
          <h2 className="text-lg mb-2">All localStorage (for debugging):</h2>
          <div className="bg-black border border-white/20 p-4 rounded font-mono text-xs break-all max-h-96 overflow-auto">
            <pre>{JSON.stringify(allLocalStorage, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
