'use client';
import React, { useEffect, useState } from "react";

function formatUSDShort(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

// Minimal shadcn-style card component
function Card({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 shadow-lg w-full max-w-sm mx-auto">
      <div className="text-lg text-white/70 mb-2">{label}</div>
      <div className="text-4xl font-bold mb-2">
        {value !== null ? value : '—'}
      </div>
    </div>
  );
}

export default function DCATunerPage() {
  const [closePrice, setClosePrice] = useState<number | null>(null);
  const [sopr, setSopr] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [ohlcRes, soprRes] = await Promise.all([
          fetch('https://brk.openonchain.dev/api/vecs/dateindex-to-ohlc'),
          fetch('https://brk.openonchain.dev/api/vecs/dateindex-to-adjusted-spent-output-profit-ratio'),
        ]);
        if (!ohlcRes.ok || !soprRes.ok) throw new Error('Failed to fetch');
        const ohlcData = await ohlcRes.json();
        const soprData = await soprRes.json();
        // Get last close price (last value of last array)
        const lastOhlc = ohlcData[ohlcData.length - 1];
        const lastClose = Array.isArray(lastOhlc) ? lastOhlc[lastOhlc.length - 1] : null;
        // Get last SOPR value
        const lastSopr = soprData[soprData.length - 1];
        setClosePrice(typeof lastClose === 'number' ? lastClose : null);
        setSopr(typeof lastSopr === 'number' ? lastSopr : null);
      } catch (e) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
      <header className="py-8 border-b border-white/20 w-full flex items-center justify-center px-8">
        <h1 className="text-3xl font-bold">DCA Tuner</h1>
      </header>
      <div className="flex flex-col md:flex-row gap-6 justify-center items-center mt-8">
        <Card
          label="BTC Close Price"
          value={
            loading
              ? 'Loading...'
              : typeof closePrice === 'number' && !isNaN(closePrice)
                ? formatUSDShort(closePrice)
                : error || '—'
          }
        />
        <Card
          label="Adjusted SOPR"
          value={
            loading
              ? 'Loading...'
              : typeof sopr === 'number' && !isNaN(sopr)
                ? sopr.toLocaleString(undefined, { maximumFractionDigits: 4 })
                : error || '—'
          }
        />
      </div>
      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* Content goes here */}
      </div>
    </div>
  );
} 