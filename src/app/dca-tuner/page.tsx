'use client';
import React, { useEffect, useState } from "react";

function formatUSDShort(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function Card({ label, value, children }: { label: string; value?: string | number | null; children?: React.ReactNode }) {
  return (
    <div className="bg-[#18181b] border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col items-center min-h-[120px] w-full">
      <div className="text-lg text-white/70 mb-2">{label}</div>
      {value !== undefined && (
        <div className="text-4xl font-bold mb-2">{value !== null ? value : '—'}</div>
      )}
      {children}
    </div>
  );
}

const TIME_FRAMES = [
  { label: 'All', value: 'all' },
  { label: '2 Years', value: '2y' },
  { label: '4 Years', value: '4y' },
  { label: '8 Years', value: '8y' },
  { label: '12 Years', value: '12y' },
];

export default function DCATunerPage() {
  const [closePrice, setClosePrice] = useState<number | null>(null);
  const [sopr, setSopr] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<number>(100);
  const [budgetInput, setBudgetInput] = useState<string>('100');
  const [timeFrame, setTimeFrame] = useState<string>('all');

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
        const lastOhlc = ohlcData[ohlcData.length - 1];
        const lastClose = Array.isArray(lastOhlc) ? lastOhlc[lastOhlc.length - 1] : null;
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

  // Budget input handlers
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setBudgetInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setBudget(num);
    }
  };

  // Time frame select handler
  const handleTimeFrameChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeFrame(e.target.value);
  };

  // Placeholder for DCA performance results
  const straightDCA = '--';
  const tunedDCA = '--';

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
      <header className="py-8 border-b border-white/20 w-full flex items-center justify-center px-8">
        <h1 className="text-3xl font-bold">DCA Tuner</h1>
      </header>
      <main className="flex flex-col items-center w-full py-8 mx-auto gap-y-8">
        {/* Top row: 4 cards in a responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full px-8">
          <Card label="BTC Close Price" value={
            loading
              ? 'Loading...'
              : typeof closePrice === 'number' && !isNaN(closePrice)
                ? formatUSDShort(closePrice)
                : error || '—'
          } />
          <Card label="Adjusted SOPR" value={
            loading
              ? 'Loading...'
              : typeof sopr === 'number' && !isNaN(sopr)
                ? sopr.toLocaleString(undefined, { maximumFractionDigits: 4 })
                : error || '—'
          } />
          <Card label="Budget (USD)">
            <input
              type="number"
              min={1}
              step={1}
              className="mt-2 px-3 py-2 rounded bg-[#232326] text-white w-32 text-center border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={budgetInput}
              onChange={handleBudgetChange}
            />
          </Card>
          <Card label="Time Frame">
            <select
              className="mt-2 px-3 py-2 rounded bg-[#232326] text-white w-36 text-center border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={timeFrame}
              onChange={handleTimeFrameChange}
            >
              {TIME_FRAMES.map(tf => (
                <option key={tf.value} value={tf.value}>{tf.label}</option>
              ))}
            </select>
          </Card>
        </div>
        {/* Second row: 2 cards in a grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full px-8">
          <Card label="Straight DCA Performance" value={straightDCA} />
          <Card label="Tuned DCA Performance" value={tunedDCA} />
        </div>
        <div className="flex flex-col flex-1 w-full p-4 gap-4">
          {/* More content and charts will go here */}
        </div>
      </main>
    </div>
  );
} 