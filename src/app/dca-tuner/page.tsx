'use client';
import React, { useEffect, useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { DollarSign, Activity, Wallet, Calendar, TrendingUp, Sparkle } from "lucide-react";
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  Title,
  TimeScale,
);

function formatUSDShort(value: number): string {
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

function formatPercent(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

type CardProps = {
  label: string;
  value?: string | number | null;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
};

function Card({ label, value, icon, children, className }: CardProps) {
  return (
    <div className={`bg-[#18181b] border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col items-center min-h-[120px] w-full relative ${className || ''}`}>
      {icon && (
        <span className="absolute top-4 right-4 text-white/60">{icon}</span>
      )}
      <div className="text-lg text-white/70 mb-2 w-full text-center">{label}</div>
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

function getTimeFrameSlice(ohlcData: any[], timeFrame: string) {
  if (!Array.isArray(ohlcData) || ohlcData.length === 0) return ohlcData;
  if (timeFrame === 'all') return ohlcData;
  const daysMap: Record<string, number> = {
    '2y': 365 * 2,
    '4y': 365 * 4,
    '8y': 365 * 8,
    '12y': 365 * 12,
  };
  const days = daysMap[timeFrame];
  return ohlcData.slice(-days);
}

// Helper: rolling mean and std
function rollingStats(arr: number[]): { means: number[]; stds: number[] } {
  const means: number[] = [];
  const stds: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    const windowArr = arr.slice(0, i + 1);
    const mean = windowArr.reduce((a, b) => a + b, 0) / windowArr.length;
    const std = Math.sqrt(windowArr.reduce((a, b) => a + (b - mean) ** 2, 0) / windowArr.length);
    means.push(mean);
    stds.push(std);
  }
  return { means, stds };
}

// Helper: Z-score calculation for all days
function getZScores(arr: number[]): number[] {
  if (!arr.length) return [];
  const mean = arr.reduce((a: number, b: number) => a + b, 0) / arr.length;
  const std = Math.sqrt(arr.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) / arr.length);
  return arr.map((v: number) => std > 0 ? (v - mean) / std : 0);
}

// Helper: Histogram binning
function getZScoreHistogram(zscores: number[], binWidth: number = 0.2): { bins: number[]; counts: number[] } {
  if (!zscores.length) return { bins: [], counts: [] };
  const min = Math.floor(Math.min(...zscores) / binWidth) * binWidth;
  const max = Math.ceil(Math.max(...zscores) / binWidth) * binWidth;
  const bins: number[] = [];
  for (let b = min; b < max; b += binWidth) {
    bins.push(b);
  }
  const counts = bins.map((b, i) => {
    const upper = b + binWidth;
    const count = zscores.filter((z: number) => z >= b && z < upper).length;
    return count;
  });
  // Last bin includes max value
  if (bins.length) {
    counts[counts.length - 1] += zscores.filter((z: number) => z === max).length;
  }
  return { bins, counts };
}

export default function DCATunerPage() {
  const [closePrice, setClosePrice] = useState<number | null>(null);
  const [sopr, setSopr] = useState<number | null>(null);
  const [ohlcData, setOhlcData] = useState<any[]>([]);
  const [soprData, setSoprData] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [budget, setBudget] = useState<number>(100);
  const [budgetInput, setBudgetInput] = useState<string>('100');
  const [timeFrame, setTimeFrame] = useState<string>('4y');
  const [marketCap, setMarketCap] = useState<number[]>([]);
  const [realizedCap, setRealizedCap] = useState<number[]>([]);
  const [mvrv, setMvrv] = useState<number[]>([]);
  const [mvrvZ, setMvrvZ] = useState<number[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [ohlcRes, soprRes, tsRes, marketCapRes, realizedCapRes] = await Promise.all([
          fetch('https://brk.openonchain.dev/api/vecs/dateindex-to-ohlc'),
          fetch('https://brk.openonchain.dev/api/vecs/dateindex-to-adjusted-spent-output-profit-ratio'),
          fetch('https://brk.openonchain.dev/api/vecs/dateindex-to-timestamp'),
          fetch('https://brk.openonchain.dev/api/vecs/dateindex-to-marketcap'),
          fetch('https://brk.openonchain.dev/api/vecs/dateindex-to-realized-cap'),
        ]);
        if (!ohlcRes.ok || !soprRes.ok || !tsRes.ok || !marketCapRes.ok || !realizedCapRes.ok) throw new Error('Failed to fetch');
        const ohlc = await ohlcRes.json();
        const soprData = await soprRes.json();
        const tsData = await tsRes.json();
        const marketCapData = await marketCapRes.json();
        const realizedCapData = await realizedCapRes.json();
        setOhlcData(ohlc);
        setSoprData(soprData);
        setTimestamps(tsData);
        setMarketCap(marketCapData);
        setRealizedCap(realizedCapData);
        // Calculate MVRV ratio (market cap / realized cap)
        const mvrvArr: number[] = Array.isArray(marketCapData) && Array.isArray(realizedCapData) && marketCapData.length === realizedCapData.length
          ? marketCapData.map((mc: number, i: number) => (realizedCapData[i] > 0 && isFinite(mc) && isFinite(realizedCapData[i])) ? mc / realizedCapData[i] : NaN)
          : [];
        const filteredMvrvArr: number[] = mvrvArr.filter((v: number) => typeof v === 'number' && isFinite(v));
        setMvrv(filteredMvrvArr);
        // Calculate Z-score of MVRV ratio
        if (filteredMvrvArr.length > 0) {
          const mean = filteredMvrvArr.reduce((a: number, b: number) => a + b, 0) / filteredMvrvArr.length;
          const std = Math.sqrt(filteredMvrvArr.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) / filteredMvrvArr.length);
          const mvrvZArr: number[] = filteredMvrvArr.map((v: number) => (std > 0) ? (v - mean) / std : 0);
          setMvrvZ(mvrvZArr);
        } else {
          setMvrvZ([]);
        }
        const lastOhlc = ohlc[ohlc.length - 1];
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

  // Regular DCA calculation
  const dcaResult = useMemo(() => {
    if (!ohlcData.length || !budget || loading || error) return null;
    const sliced = getTimeFrameSlice(ohlcData, timeFrame);
    const numDays = sliced.length;
    const totalBudget = budget * numDays;
    let totalBTC = 0;
    let totalInvested = 0;
    for (let i = 0; i < numDays; i++) {
      const ohlc = sliced[i];
      const close = Array.isArray(ohlc) ? ohlc[ohlc.length - 1] : null;
      if (typeof close !== 'number' || close <= 0) continue;
      const btcBought = (totalBudget / numDays) / close;
      totalBTC += btcBought;
      totalInvested += totalBudget / numDays;
    }
    const finalClose = Array.isArray(sliced[sliced.length - 1]) ? sliced[sliced.length - 1][sliced[sliced.length - 1].length - 1] : null;
    if (!finalClose || totalInvested === 0) return null;
    const finalValue = totalBTC * finalClose;
    const percentReturn = ((finalValue - totalInvested) / totalInvested) * 100;
    return {
      totalBTC,
      totalInvested,
      finalValue,
      percentReturn,
    };
  }, [ohlcData, budget, timeFrame, loading, error]);

  // Tuned DCA calculation (stepwise Z-score zones, fixed total spend)
  const tunedDCAResult = useMemo(() => {
    if (!ohlcData.length || !budget || loading || error) return null;
    if (!Array.isArray(soprData) || soprData.length !== ohlcData.length) return null;
    const slicedOhlc = getTimeFrameSlice(ohlcData, timeFrame);
    const slicedSopr = getTimeFrameSlice(soprData, timeFrame);
    if (!slicedSopr.length || slicedSopr.length !== slicedOhlc.length) return null;
    const numDays = slicedOhlc.length;
    const totalBudget = budget * numDays;
    const { means, stds } = rollingStats(slicedSopr);
    const k = 0.25;
    // Calculate all multipliers first
    let multipliers: number[] = [];
    for (let i = 0; i < numDays; i++) {
      const soprVal = slicedSopr[i];
      const mean = means[i];
      const std = stds[i];
      const z = std > 0 ? (soprVal - mean) / std : 0;
      let zone = 0;
      if (z < 0) zone = Math.floor(z / 0.5);
      else zone = Math.ceil(z / 0.5);
      zone = Math.max(-4, Math.min(4, zone));
      let multiplier = 1 - k * zone;
      multiplier = Math.max(0.1, Math.min(2.0, multiplier));
      multipliers.push(multiplier);
    }
    // Normalize multipliers so their sum equals numDays
    const multiplierSum = multipliers.reduce((a, b) => a + b, 0);
    const normalizedMultipliers = multipliers.map(m => m * numDays / multiplierSum);
    let totalBTC = 0;
    let totalInvested = 0;
    for (let i = 0; i < numDays; i++) {
      const ohlc = slicedOhlc[i];
      const close = Array.isArray(ohlc) ? ohlc[ohlc.length - 1] : null;
      if (typeof close !== 'number' || close <= 0) continue;
      const tunedBudget = totalBudget * (normalizedMultipliers[i] / numDays);
      const btcBought = tunedBudget / close;
      totalBTC += btcBought;
      totalInvested += tunedBudget;
    }
    const finalClose = Array.isArray(slicedOhlc[slicedOhlc.length - 1]) ? slicedOhlc[slicedOhlc.length - 1][slicedOhlc[slicedOhlc.length - 1].length - 1] : null;
    if (!finalClose || totalInvested === 0) return null;
    const finalValue = totalBTC * finalClose;
    const percentReturn = ((finalValue - totalInvested) / totalInvested) * 100;
    return {
      totalBTC,
      totalInvested,
      finalValue,
      percentReturn,
    };
  }, [ohlcData, soprData, budget, timeFrame, loading, error]);

  // Chart data for price line chart
  const priceChartData = useMemo(() => {
    if (!ohlcData.length || !timestamps.length) return null;
    const sliced = getTimeFrameSlice(ohlcData, timeFrame);
    const tsSliced = getTimeFrameSlice(timestamps, timeFrame);
    const data = sliced.map((ohlc, i) => {
      const close = Array.isArray(ohlc) ? ohlc[ohlc.length - 1] : null;
      const t = tsSliced[i];
      if (typeof close !== 'number' || typeof t !== 'number') return null;
      return { x: new Date(t * 1000), y: close };
    }).filter(Boolean);
    return {
      datasets: [
        {
          label: 'BTC Price',
          data,
          borderColor: '#60a5fa',
          backgroundColor: 'rgba(96,165,250,0.1)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.2,
          pointStyle: 'circle',
          pointBackgroundColor: '#60a5fa',
          pointBorderColor: '#60a5fa',
          pointBorderWidth: 0,
        },
      ],
    };
  }, [ohlcData, timestamps, timeFrame]);

  // Chart data for Z-score histogram
  const zScoreChartData = useMemo(() => {
    if (!soprData.length) return null;
    const sliced = getTimeFrameSlice(soprData, timeFrame);
    const zscores = getZScores(sliced);
    const { bins, counts } = getZScoreHistogram(zscores, 0.2);
    const total = zscores.length;
    return {
      labels: bins.map(b => b.toFixed(2)),
      datasets: [
        {
          label: 'Z-score Distribution',
          data: counts.map(c => (c / total) * 100),
          backgroundColor: '#fbbf24',
        },
      ],
    };
  }, [soprData, timeFrame]);

  // Add Z-score trace data for its own panel
  const zScoreTraceData = useMemo(() => {
    if (!timestamps.length || !soprData.length) return null;
    const tsSliced = getTimeFrameSlice(timestamps, timeFrame);
    const soprSliced = getTimeFrameSlice(soprData, timeFrame);
    const zscores = getZScores(soprSliced);
    const data = tsSliced.map((t, i) => {
      if (typeof t !== 'number' || typeof zscores[i] !== 'number') return null;
      return { x: new Date(t * 1000), y: zscores[i] };
    }).filter(Boolean);
    return {
      datasets: [
        {
          label: 'Z-score',
          data,
          borderColor: '#fff',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          pointRadius: 0,
          tension: 0.2,
        },
      ],
    };
  }, [timestamps, soprData, timeFrame]);

  const zScorePanelOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10,
          borderWidth: 0,
        },
      },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'year' as const,
          displayFormats: { year: 'yyyy' },
          tooltipFormat: 'yyyy',
        },
        ticks: { color: '#fff', autoSkip: true, maxTicksLimit: 10 },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        position: 'left' as const,
        ticks: {
          color: '#fff',
        },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10,
          borderWidth: 0,
        },
      },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'year' as const,
          displayFormats: { year: 'yyyy' },
          tooltipFormat: 'yyyy',
        },
        ticks: { color: '#fff', autoSkip: true, maxTicksLimit: 10 },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        ticks: {
          color: '#fff',
          callback: function(tickValue: string | number) {
            const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
            if (isNaN(value)) return tickValue;
            // Helper to format with or without decimal
            const formatShort = (num: number, suffix: string) => {
              const rounded = Math.round(num * 10) / 10;
              return Number.isInteger(rounded)
                ? `$${rounded}${suffix}`
                : `$${rounded.toFixed(1)}${suffix}`;
            };
            if (value >= 1e9) return formatShort(value / 1e9, 'B');
            if (value >= 1e6) return formatShort(value / 1e6, 'M');
            if (value >= 1e3) return formatShort(value / 1e3, 'K');
            const rounded = Math.round(value * 10) / 10;
            return Number.isInteger(rounded)
              ? `$${rounded}`
              : `$${rounded.toFixed(1)}`;
          },
        },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  };

  const chartOptionsZScore = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#fff',
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 10,
          boxHeight: 10,
          borderWidth: 0,
        },
      },
      tooltip: { mode: 'index' as const, intersect: false },
    },
    scales: {
      x: {
        type: 'category' as const,
        ticks: { color: '#fff' },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
      y: {
        type: 'linear' as const,
        ticks: {
          color: '#fff',
          callback: function(tickValue: string | number) {
            const value = typeof tickValue === 'string' ? parseFloat(tickValue) : tickValue;
            if (isNaN(value)) return tickValue;
            return value + '%';
          },
        },
        grid: { color: 'rgba(255,255,255,0.1)' },
      },
    },
  };

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
      <header className="py-8 border-b border-white/20 w-full flex items-center justify-center px-8">
        <h1 className="text-3xl font-bold">DCA Tuner</h1>
      </header>
      <main className="flex flex-col items-center w-full py-8 mx-auto gap-y-8">
        {/* Top row: 4 cards in a responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full px-8">
          <Card label="BTC Close Price" icon={<DollarSign className="w-5 h-5" />} value={
            loading
              ? 'Loading...'
              : typeof closePrice === 'number' && !isNaN(closePrice)
                ? formatUSDShort(closePrice)
                : error || '—'
          } />
          <Card label="Adjusted SOPR" icon={<Activity className="w-5 h-5" />} value={
            loading
              ? 'Loading...'
              : typeof sopr === 'number' && !isNaN(sopr)
                ? sopr.toLocaleString(undefined, { maximumFractionDigits: 4 })
                : error || '—'
          } />
          <Card label="Budget (USD)" icon={<Wallet className="w-5 h-5" />}>
            <input
              type="number"
              min={1}
              step={1}
              className="mt-2 px-3 py-2 rounded bg-[#232326] text-white w-32 text-center border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
              value={budgetInput}
              onChange={handleBudgetChange}
            />
          </Card>
          <Card label="Time Frame" icon={<Calendar className="w-5 h-5" />}>
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
          <Card label="DCA Performance" icon={<TrendingUp className="w-5 h-5" />}>
            {loading || !dcaResult ? (
              <div className="text-4xl font-bold mb-2">--</div>
            ) : (
              <div className="flex flex-row items-center justify-between w-full gap-4 text-base">
                {/* Profit (large, first) */}
                <div className={"flex flex-col items-center flex-1 " + (dcaResult.finalValue - dcaResult.totalInvested >= 0 ? 'text-green-400' : 'text-red-400')}>
                  <div className="text-xs text-white/60 mb-1">Profit</div>
                  <div className="text-3xl font-extrabold leading-tight">{formatUSDShort(dcaResult.finalValue - dcaResult.totalInvested)}</div>
                  <div className={"text-sm font-semibold mt-1 " + (dcaResult.percentReturn >= 0 ? 'text-green-300' : 'text-red-300')}>Return <span className="ml-1">{formatPercent(dcaResult.percentReturn)}</span></div>
                </div>
                {/* Invested */}
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs text-white/60 mb-1">Invested</div>
                  <div className="font-bold">{formatUSDShort(dcaResult.totalInvested)}</div>
                </div>
                {/* BTC Gain */}
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs text-white/60 mb-1">BTC Gain</div>
                  <div className="font-bold">{dcaResult.totalBTC.toFixed(6)}</div>
                </div>
                {/* Value */}
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs text-white/60 mb-1">Value</div>
                  <div className="font-bold">{formatUSDShort(dcaResult.finalValue)}</div>
                </div>
              </div>
            )}
          </Card>
          <Card label="Tuned DCA Performance" icon={<Sparkle className="w-5 h-5" />}>
            {loading || !tunedDCAResult ? (
              <div className="text-4xl font-bold mb-2">--</div>
            ) : (
              <div className="flex flex-row items-center justify-between w-full gap-4 text-base">
                {/* Profit (large, first) */}
                <div className={"flex flex-col items-center flex-1 " + (tunedDCAResult.finalValue - tunedDCAResult.totalInvested >= 0 ? 'text-green-400' : 'text-red-400')}>
                  <div className="text-xs text-white/60 mb-1">Profit</div>
                  <div className="text-3xl font-extrabold leading-tight">{formatUSDShort(tunedDCAResult.finalValue - tunedDCAResult.totalInvested)}</div>
                  <div className={"text-sm font-semibold mt-1 " + (tunedDCAResult.percentReturn >= 0 ? 'text-green-300' : 'text-red-300')}>Return <span className="ml-1">{formatPercent(tunedDCAResult.percentReturn)}</span></div>
                </div>
                {/* Invested */}
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs text-white/60 mb-1">Invested</div>
                  <div className="font-bold">{formatUSDShort(tunedDCAResult.totalInvested)}</div>
                </div>
                {/* BTC Gain */}
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs text-white/60 mb-1">BTC Gain</div>
                  <div className="font-bold">{tunedDCAResult.totalBTC.toFixed(6)}</div>
                </div>
                {/* Value */}
                <div className="flex flex-col items-center flex-1">
                  <div className="text-xs text-white/60 mb-1">Value</div>
                  <div className="font-bold">{formatUSDShort(tunedDCAResult.finalValue)}</div>
                </div>
              </div>
            )}
          </Card>
        </div>
        {/* Proof of Work Accordion */}
        <div className="w-full px-8">
          <Accordion type="single" collapsible className="shadow-lg">
            <AccordionItem value="pow">
              <AccordionTrigger>Proof of Work</AccordionTrigger>
              <AccordionContent>
                <p className="mb-4"><strong>DCA (Dollar Cost Averaging):</strong> Each day, a fixed USD amount is used to buy BTC at the closing price. Over time, this accumulates BTC and smooths out price volatility. The results show your total invested, BTC gained, and profit if you held until today.</p>
                <p className="mb-4"><strong>Tuned DCA:</strong> Instead of a fixed amount, the daily investment is adjusted based on the aSOPR metric's Z-score. When aSOPR is low (statistically cheap), more is invested; when high, less is invested. The adjustment uses 0.5 standard deviation steps, with a sensitivity parameter, and is clamped to avoid extreme values. This aims to accumulate more BTC and improve returns by buying more during statistically favorable periods.</p>
                <p className="mb-4"><strong>Interactions:</strong> You can change the time frame and daily budget. All calculations update instantly, and the chart and cards reflect both strategies for easy comparison.</p>
                <p className="mb-2"><strong>Performance Cards:</strong> Show profit, return, invested, BTC gain, and value for each strategy. Profit and return are color-coded for clarity.</p>
                {/* Infographic: Z-score zones and purchase adjustment */}
                <div className="flex flex-col items-center justify-center w-full mb-8">
                  {/* Horizontal bar chart for Z-score zones and purchase multipliers */}
                  <div className="w-full max-w-2xl">
                    {(() => {
                      // Generate zones from +2.0σ to -2.0σ in 0.5 steps
                      const zones = [2, 1.5, 1, 0.5, 0, -0.5, -1, -1.5, -2];
                      const labels = zones.map(z => (z > 0 ? `+${z}σ` : z === 0 ? '0' : `${z}σ`));
                      const k = 0.25;
                      const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
                      const multipliers = zones.map(z => clamp(1 - k * z, 0.1, 2.0));
                      const backgroundColor = zones.map(z =>
                        z >= 1.5 ? '#f87171' :
                        z >= 0.5 ? '#fbbf24' :
                        z === 0 ? '#e5e7eb' :
                        z >= -1.0 ? '#4ade80' :
                        '#22c55e'
                      );
                      return (
                        <Bar
                          data={{
                            labels,
                            datasets: [
                              {
                                label: 'Purchase Multiplier',
                                data: multipliers,
                                backgroundColor,
                                borderRadius: 12,
                                barPercentage: 0.45,
                                categoryPercentage: 0.7,
                              },
                            ],
                          }}
                          options={{
                            indexAxis: 'y',
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}x`,
                                },
                              },
                            },
                            scales: {
                              x: {
                                min: 0,
                                max: 2.2,
                                ticks: {
                                  color: '#fff',
                                  callback: (v) => `${v}x`,
                                  font: { size: 16 },
                                },
                                grid: { color: 'rgba(255,255,255,0.1)' },
                              },
                              y: {
                                ticks: {
                                  color: '#fff',
                                  font: { size: 18, weight: 'bold' },
                                },
                                grid: { color: 'rgba(255,255,255,0.1)' },
                              },
                            },
                          }}
                          height={340}
                        />
                      );
                    })()}
                  </div>
                  {/* Summary table: stddev zone to multiplier and change in daily spend */}
                  <div className="w-full max-w-2xl flex flex-col items-center justify-center mt-6 mb-2">
                    <table className="w-full text-center border-separate border-spacing-y-1">
                      <thead>
                        <tr>
                          <th className="text-white/90 text-base font-semibold py-2">Zone (stddev)</th>
                          <th className="text-white/90 text-base font-semibold py-2">Multiplier</th>
                          <th className="text-white/90 text-base font-semibold py-2">Change in Daily Spend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const k = 0.25;
                          const zones = [2, 1.5, 1, 0.5, 0, -0.5, -1, -1.5, -2];
                          return zones.map(z => {
                            const multiplier = Math.max(0.1, Math.min(2.0, 1 - k * z));
                            const change = ((multiplier - 1) * 100).toFixed(0);
                            return (
                              <tr key={z} className="bg-[#232326]">
                                <td className="py-1 text-white/80 text-base font-mono">{z > 0 ? `+${z}` : z === 0 ? '0' : z}</td>
                                <td className="py-1 text-white/80 text-base font-mono">{multiplier.toFixed(2)}x</td>
                                <td className={
                                  parseFloat(change) > 0 ? 'text-green-400' : parseFloat(change) < 0 ? 'text-red-400' : 'text-white/80'
                                }>
                                  {parseFloat(change) > 0 ? '+' : ''}{change}%
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-white/80 text-center mt-2 text-lg max-w-2xl">
                    <span className="font-semibold">How it works:</span> The daily purchase amount is adjusted based on the Z-score zone. When the Z-score is low (top), you buy more. When it is high (bottom), you buy less. The multiplier (e.g., 2x, 1.5x, 1x, 0.5x, 0.2x) shows how much you buy in each zone, relative to your base amount.
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        {/* Chart section: all charts in accordion */}
        <div className="w-full px-8 flex flex-col gap-8">
          <Accordion type="single" collapsible className="shadow-lg">
            <AccordionItem value="charts">
              <AccordionTrigger>Charts</AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-8">
                  <Card label="BTC Price Chart" icon={<TrendingUp className="w-6 h-6 text-white/60" />} className="w-full p-0">
                    <div className="w-full h-[350px]">
                      {priceChartData ? (
                        <Line data={priceChartData} options={chartOptions} />
                      ) : (
                        <div className="text-white/60 text-center py-12">No data</div>
                      )}
                    </div>
                  </Card>
                  <Card label="Z-score Trace" icon={<Activity className="w-6 h-6 text-white/60" />}>
                    <div className="h-[350px] w-full">
                      {zScoreTraceData ? (
                        <Line data={zScoreTraceData} options={zScorePanelOptions} />
                      ) : (
                        <div className="text-white/60 text-center py-12">No data</div>
                      )}
                    </div>
                  </Card>
                  <Card label="Z-score Distribution" icon={<Activity className="w-6 h-6 text-white/60" />}>
                    {zScoreChartData ? (
                      <Bar data={zScoreChartData} options={chartOptionsZScore} height={300} />
                    ) : (
                      <div className="text-white/60 text-center py-12">No data</div>
                    )}
                  </Card>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
        <div className="flex flex-col flex-1 w-full p-4 gap-4">
          {/* More content and charts will go here */}
        </div>
      </main>
    </div>
  );
} 