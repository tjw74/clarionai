'use client';
import { useState, useEffect, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend as ChartLegend,
  TimeScale,
} from 'chart.js';
import 'chartjs-adapter-date-fns';

// Register Chart.js elements and scales
ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  ChartLegend,
  TimeScale
);

const PRICE_MODELS_ENDPOINTS = {
  ohlc: 'https://brk.openonchain.dev/api/vecs/dateindex-to-ohlc',
  realized: 'https://brk.openonchain.dev/api/vecs/dateindex-to-realized-price',
  trueMean: 'https://brk.openonchain.dev/api/vecs/dateindex-to-true-market-mean',
  dma200: 'https://brk.openonchain.dev/api/vecs/dateindex-to-200d-sma',
};

export default function ChaosLabs() {
  const [ohlc, setOhlc] = useState<any[] | null>(null);
  const [realized, setRealized] = useState<any[] | null>(null);
  const [trueMean, setTrueMean] = useState<any[] | null>(null);
  const [dma200, setDMA200] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(PRICE_MODELS_ENDPOINTS.ohlc).then(r => r.json()),
      fetch(PRICE_MODELS_ENDPOINTS.realized).then(r => r.json()),
      fetch(PRICE_MODELS_ENDPOINTS.trueMean).then(r => r.json()),
      fetch(PRICE_MODELS_ENDPOINTS.dma200).then(r => r.json()),
    ])
      .then(([ohlcData, realizedData, trueMeanData, dma200Data]) => {
        setOhlc(ohlcData);
        setRealized(realizedData);
        setTrueMean(trueMeanData);
        setDMA200(dma200Data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to fetch price model data.');
        setLoading(false);
      });
  }, []);

  // Map data for Chart.js: no filtering, just plot all data
  const safeOhlc = useMemo(() => Array.isArray(ohlc) ? ohlc.map((d: any) => ({ x: d[0] * 1000, y: d[4] })) : [], [ohlc]);
  const safeRealized = useMemo(() => Array.isArray(realized) ? realized.map((d: any) => ({ x: d[0] * 1000, y: d[1] })) : [], [realized]);
  const safeTrueMean = useMemo(() => Array.isArray(trueMean) ? trueMean.map((d: any) => ({ x: d[0] * 1000, y: d[1] })) : [], [trueMean]);
  const safeDMA200 = useMemo(() => Array.isArray(dma200) ? dma200.map((d: any) => ({ x: d[0] * 1000, y: d[1] })) : [], [dma200]);

  const chartData = useMemo(() => ({
    datasets: [
      {
        label: 'OHLC',
        data: safeOhlc,
        borderColor: '#4fd1c5',
        backgroundColor: 'rgba(79,209,197,0.2)',
        pointRadius: 0,
        fill: false,
        tension: 0.2,
      },
      {
        label: 'Realized',
        data: safeRealized,
        borderColor: '#f6e05e',
        backgroundColor: 'rgba(246,224,94,0.2)',
        pointRadius: 0,
        fill: false,
        tension: 0.2,
      },
      {
        label: 'True Mean',
        data: safeTrueMean,
        borderColor: '#fc8181',
        backgroundColor: 'rgba(252,129,129,0.2)',
        pointRadius: 0,
        fill: false,
        tension: 0.2,
      },
      {
        label: '200d SMA',
        data: safeDMA200,
        borderColor: '#90cdf4',
        backgroundColor: 'rgba(144,205,244,0.2)',
        pointRadius: 0,
        fill: false,
        tension: 0.2,
      },
    ],
  }), [safeOhlc, safeRealized, safeTrueMean, safeDMA200]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Custom legend
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        backgroundColor: '#222',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#fff',
        borderWidth: 1,
      },
    },
    layout: { padding: 0 },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'year' as const,
          tooltipFormat: 'yyyy',
          displayFormats: { year: 'yyyy' },
        },
        grid: {
          color: 'rgba(255,255,255,0.1)',
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
        },
        ticks: {
          color: '#fff',
          autoSkip: true,
          maxTicksLimit: 10,
        },
        title: { display: false },
      },
      y: {
        type: 'logarithmic' as const,
        position: 'right' as const,
        grid: {
          color: 'rgba(255,255,255,0.1)',
          borderColor: 'rgba(255,255,255,0.2)',
          borderWidth: 1,
        },
        ticks: {
          color: '#fff',
          callback: function(value: any) {
            // Only show base 10 ticks
            if (value === 0) return '0';
            const log = Math.log10(value);
            if (Number.isInteger(log)) return value.toLocaleString();
            return '';
          },
        },
        title: { display: false },
        min: 1,
      },
    },
    backgroundColor: '#000',
  }), []);

  // Custom legend (top left)
  const legendItems = [
    { label: 'OHLC', color: '#4fd1c5' },
    { label: 'Realized', color: '#f6e05e' },
    { label: 'True Mean', color: '#fc8181' },
    { label: '200d SMA', color: '#90cdf4' },
  ];

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col items-center justify-center">
      <h1 className="text-3xl font-bold mb-8">Chaos Labs</h1>
      {loading ? (
        <span className="text-white">Loading price model data...</span>
      ) : error ? (
        <span className="text-red-400">{error}</span>
      ) : (
        <div className="w-full max-w-3xl bg-zinc-900 rounded-lg p-8 flex flex-col items-center relative" style={{ minHeight: 400 }}>
          {/* Custom legend top left */}
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-1 bg-black/80 px-2 py-1 rounded shadow">
            {legendItems.map(item => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-white">
                <span className="inline-block w-3 h-3 rounded-full" style={{ background: item.color }}></span>
                {item.label}
              </div>
            ))}
          </div>
          {/* Chart */}
          <div className="w-full h-[360px]">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}
    </div>
  );
} 