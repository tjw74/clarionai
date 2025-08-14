import { useState, useEffect } from 'react';
import { fetchAllMetrics, type MetricData } from '../datamanager';

export interface LatestMetrics {
  price: number | null;
  priceSpark30: number[]; // last 30d price for sparkline
  marketCapSpark30: number[];
  realizedCapSpark30: number[];
  mvrvSpark30: number[];
  unrealizedProfitSpark30: number[];
  unrealizedLossSpark30: number[];
  realizedProfitSpark30: number[];
  realizedLossSpark30: number[];
  unrealizedNet: number | null;
  unrealizedNetSpark30: number[];
  realizedNet: number | null;
  realizedNetSpark30: number[];
  soprSpark30: number[];
  marketCap: number | null;
  realizedCap: number | null;
  mvrvRatio: number | null;
  unrealizedProfit: number | null;
  unrealizedLoss: number | null;
  realizedProfit: number | null;
  realizedLoss: number | null;
  // Models
  realizedPrice: number | null;
  trueMarketMean: number | null;
  vaultedPrice: number | null;
  sma200: number | null;
  // Price relative signals
  trendRegime: 'Uptrend' | 'Range' | 'Downtrend' | 'Unknown';
  distances: Array<{ label: string; abs: number; pct: number }>; // to models
  // Regimes
  unrealizedRegime: 'Stressed Loss' | 'Neutral' | 'Elevated Profit' | 'Unknown';
  sopr: number | null;
  realizedRegime: 'Capitulation' | 'Neutral' | 'Profit-taking' | 'Unknown';
  soprChange30d: number | null;
  priceChange30d: number | null;
  priceChange90d: number | null;
  priceChange180d: number | null;
  marketCapChange30d: number | null;
  marketCapChange90d: number | null;
  marketCapChange180d: number | null;
  realizedCapChange30d: number | null;
  realizedCapChange90d: number | null;
  realizedCapChange180d: number | null;
  mvrvChange30d: number | null;
  mvrvChange90d: number | null;
  mvrvChange180d: number | null;
  unrealizedProfitChange30d: number | null;
  unrealizedProfitChange90d: number | null;
  unrealizedProfitChange180d: number | null;
  unrealizedLossChange30d: number | null;
  unrealizedLossChange90d: number | null;
  unrealizedLossChange180d: number | null;
  realizedProfitChange30d: number | null;
  realizedProfitChange90d: number | null;
  realizedProfitChange180d: number | null;
  realizedLossChange30d: number | null;
  realizedLossChange90d: number | null;
  realizedLossChange180d: number | null;
  loading: boolean;
  error: string | null;
}

export function useLatestMetrics(): LatestMetrics {
  const [metrics, setMetrics] = useState<LatestMetrics>({
    price: null,
    priceSpark30: [],
    marketCapSpark30: [],
    realizedCapSpark30: [],
    mvrvSpark30: [],
    unrealizedProfitSpark30: [],
    unrealizedLossSpark30: [],
    realizedProfitSpark30: [],
    realizedLossSpark30: [],
    unrealizedNet: null,
    unrealizedNetSpark30: [],
    realizedNet: null,
    realizedNetSpark30: [],
    soprSpark30: [],
    marketCap: null,
    realizedCap: null,
    mvrvRatio: null,
    unrealizedProfit: null,
    unrealizedLoss: null,
    realizedProfit: null,
    realizedLoss: null,
    realizedPrice: null,
    trueMarketMean: null,
    vaultedPrice: null,
    sma200: null,
    trendRegime: 'Unknown',
    distances: [],
    unrealizedRegime: 'Unknown',
    sopr: null,
    realizedRegime: 'Unknown',
    soprChange30d: null,
    priceChange30d: null,
    priceChange90d: null,
    priceChange180d: null,
    marketCapChange30d: null,
    marketCapChange90d: null,
    marketCapChange180d: null,
    realizedCapChange30d: null,
    realizedCapChange90d: null,
    realizedCapChange180d: null,
    mvrvChange30d: null,
    mvrvChange90d: null,
    mvrvChange180d: null,
    unrealizedProfitChange30d: null,
    unrealizedProfitChange90d: null,
    unrealizedProfitChange180d: null,
    unrealizedLossChange30d: null,
    unrealizedLossChange90d: null,
    unrealizedLossChange180d: null,
    realizedProfitChange30d: null,
    realizedProfitChange90d: null,
    realizedProfitChange180d: null,
    realizedLossChange30d: null,
    realizedLossChange90d: null,
    realizedLossChange180d: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const data: MetricData = await fetchAllMetrics();
        
        // Get the latest values (last element in each array)
        const latestIndex = data.dates.length - 1;
        
        const price = data.metrics['close']?.[latestIndex] || null;
        const realizedPrice = data.metrics['realized-price']?.[latestIndex] || null;
        const trueMarketMean = data.metrics['true-market-mean']?.[latestIndex] || null;
        const vaultedPrice = data.metrics['vaulted-price']?.[latestIndex] || null;
        const sma200 = data.metrics['200d-sma']?.[latestIndex] || null;
        const marketCap = data.metrics['marketcap']?.[latestIndex] || null;
        const realizedCap = data.metrics['realized-cap']?.[latestIndex] || null;
        const unrealizedProfit = data.metrics['unrealized-profit']?.[latestIndex] || null;
        const unrealizedLoss = data.metrics['negative-unrealized-loss']?.[latestIndex] || null;
        const realizedProfit = data.metrics['realized-profit']?.[latestIndex] || null;
        const realizedLoss = data.metrics['negative-realized-loss']?.[latestIndex] || null;
        const sopr = data.metrics['adjusted-spent-output-profit-ratio']?.[latestIndex] || null;
        
        // Calculate MVRV Ratio
        let mvrvRatio = null;
        if (marketCap && realizedCap && realizedCap > 0) {
          mvrvRatio = marketCap / realizedCap;
        }

        // Sparkline helper
        const computeSpark = (series: Array<number | null | undefined>, days: number): number[] => {
          const numeric = (series || []).map(v => (typeof v === 'number' && !Number.isNaN(v) ? v : null));
          const startIndex = Math.max(0, numeric.length - days);
          const windowValues = numeric.slice(startIndex).filter((v): v is number => v !== null);
          if (windowValues.length === 0) return [];
          const min = Math.min(...windowValues);
          const max = Math.max(...windowValues);
          const range = max - min || 1;
          const sliced = numeric.slice(startIndex);
          return sliced.map(v => {
            if (v === null) return 0.5; // neutral fallback for missing values
            return (v - min) / range;
          });
        };

        const window = 30;
        const priceSpark30 = computeSpark(data.metrics['close'] || [], window);
        const marketCapSpark30 = computeSpark(data.metrics['marketcap'] || [], window);
        const realizedCapSpark30 = computeSpark(data.metrics['realized-cap'] || [], window);
        const unrealizedProfitSpark30 = computeSpark(data.metrics['unrealized-profit'] || [], window);
        const unrealizedLossSpark30 = computeSpark(data.metrics['negative-unrealized-loss'] || [], window);
        const realizedProfitSpark30 = computeSpark(data.metrics['realized-profit'] || [], window);
        const realizedLossSpark30 = computeSpark(data.metrics['negative-realized-loss'] || [], window);
        const soprSpark30 = computeSpark(data.metrics['adjusted-spent-output-profit-ratio'] || [], window);
        // MVRV spark uses derived series (marketcap / realized-cap)
        const mcapSeries = data.metrics['marketcap'] || [];
        const rcapSeries = data.metrics['realized-cap'] || [];
        const mvrvSeries: number[] = [];
        const len = Math.max(mcapSeries.length, rcapSeries.length);
        for (let i = 0; i < len; i++) {
          const mc = mcapSeries[i];
          const rc = rcapSeries[i];
          const value = typeof mc === 'number' && typeof rc === 'number' && rc > 0 ? mc / rc : NaN;
          mvrvSeries.push(Number.isFinite(value) ? value : NaN);
        }
        const mvrvSpark30 = computeSpark(mvrvSeries, window);

        // Net P/L values and spark lines
        const unrealizedNet = (unrealizedProfit ?? 0) + (unrealizedLoss ?? 0);
        const realizedNet = (realizedProfit ?? 0) + (realizedLoss ?? 0);
        const unrealizedNetSeries: number[] = [];
        const realizedNetSeries: number[] = [];
        const upSeries = data.metrics['unrealized-profit'] || [];
        const ulSeries = data.metrics['negative-unrealized-loss'] || [];
        const rpSeries = data.metrics['realized-profit'] || [];
        const rlSeries = data.metrics['negative-realized-loss'] || [];
        const maxLen = Math.max(upSeries.length, ulSeries.length, rpSeries.length, rlSeries.length);
        for (let i = 0; i < maxLen; i++) {
          const up = typeof upSeries[i] === 'number' ? (upSeries[i] as number) : 0;
          const ul = typeof ulSeries[i] === 'number' ? (ulSeries[i] as number) : 0;
          const rp = typeof rpSeries[i] === 'number' ? (rpSeries[i] as number) : 0;
          const rl = typeof rlSeries[i] === 'number' ? (rlSeries[i] as number) : 0;
          unrealizedNetSeries.push(up + ul);
          realizedNetSeries.push(rp + rl);
        }
        const unrealizedNetSpark30 = computeSpark(unrealizedNetSeries, window);
        const realizedNetSpark30 = computeSpark(realizedNetSeries, window);

        // Trend regime
        const trendRegime = (price !== null && sma200 !== null && trueMarketMean !== null)
          ? (price > sma200 && price > trueMarketMean
              ? 'Uptrend'
              : (Math.abs(price - trueMarketMean) / Math.max(1, trueMarketMean) <= 0.05
                ? 'Range'
                : (price < sma200 && price < trueMarketMean ? 'Downtrend' : 'Range')))
          : 'Unknown';

        // Distances to anchors
        const distances: Array<{ label: string; abs: number; pct: number }> = [];
        const pushDist = (label: string, model: number | null) => {
          if (price !== null && model !== null && model !== 0) {
            distances.push({ label, abs: price - model, pct: ((price - model) / model) * 100 });
          }
        };
        pushDist('Realized', realizedPrice);
        pushDist('True Mean', trueMarketMean);
        pushDist('Vaulted', vaultedPrice);
        pushDist('200d', sma200);

        // Unrealized regime via MVRV thresholds
        const unrealizedRegime: LatestMetrics['unrealizedRegime'] = mvrvRatio === null
          ? 'Unknown'
          : (mvrvRatio < 1 ? 'Stressed Loss' : (mvrvRatio > 1.5 ? 'Elevated Profit' : 'Neutral'));

        // Realized regime via SOPR
        const realizedRegime: LatestMetrics['realizedRegime'] = sopr === null
          ? 'Unknown'
          : (sopr < 0.98 ? 'Capitulation' : (sopr > 1.02 ? 'Profit-taking' : 'Neutral'));

        // Calculate percentage changes
        const calculateChange = (current: number | null, daysAgo: number, metricKey: string): number | null => {
          if (current === null || latestIndex < daysAgo) return null;
          const pastValue = data.metrics[metricKey]?.[latestIndex - daysAgo];
          if (pastValue === null || pastValue === undefined || pastValue <= 0) return null;
          return ((current - pastValue) / pastValue) * 100;
        };

        const calculateMvrvChange = (current: number | null, daysAgo: number): number | null => {
          if (current === null || latestIndex < daysAgo) return null;
          const pastMarketCap = data.metrics['marketcap']?.[latestIndex - daysAgo];
          const pastRealizedCap = data.metrics['realized-cap']?.[latestIndex - daysAgo];
          if (pastMarketCap === null || pastRealizedCap === null || pastRealizedCap <= 0) return null;
          const pastMvrv = pastMarketCap / pastRealizedCap;
          return ((current - pastMvrv) / pastMvrv) * 100;
        };

        setMetrics({
          price,
          priceSpark30,
          marketCapSpark30,
          realizedCapSpark30,
          mvrvSpark30,
          unrealizedProfitSpark30,
          unrealizedLossSpark30,
          realizedProfitSpark30,
          realizedLossSpark30,
          unrealizedNet: Number.isFinite(unrealizedNet) ? unrealizedNet : null,
          unrealizedNetSpark30,
          realizedNet: Number.isFinite(realizedNet) ? realizedNet : null,
          realizedNetSpark30,
          soprSpark30,
          marketCap,
          realizedCap,
          mvrvRatio,
          unrealizedProfit,
          unrealizedLoss,
          realizedProfit,
          realizedLoss,
          realizedPrice,
          trueMarketMean,
          vaultedPrice,
          sma200,
          trendRegime,
          distances,
          unrealizedRegime,
          sopr,
          realizedRegime,
          soprChange30d: calculateChange(sopr, 30, 'adjusted-spent-output-profit-ratio'),
          priceChange30d: calculateChange(price, 30, 'close'),
          priceChange90d: calculateChange(price, 90, 'close'),
          priceChange180d: calculateChange(price, 180, 'close'),
          marketCapChange30d: calculateChange(marketCap, 30, 'marketcap'),
          marketCapChange90d: calculateChange(marketCap, 90, 'marketcap'),
          marketCapChange180d: calculateChange(marketCap, 180, 'marketcap'),
          realizedCapChange30d: calculateChange(realizedCap, 30, 'realized-cap'),
          realizedCapChange90d: calculateChange(realizedCap, 90, 'realized-cap'),
          realizedCapChange180d: calculateChange(realizedCap, 180, 'realized-cap'),
          mvrvChange30d: calculateMvrvChange(mvrvRatio, 30),
          mvrvChange90d: calculateMvrvChange(mvrvRatio, 90),
          mvrvChange180d: calculateMvrvChange(mvrvRatio, 180),
          unrealizedProfitChange30d: calculateChange(unrealizedProfit, 30, 'unrealized-profit'),
          unrealizedProfitChange90d: calculateChange(unrealizedProfit, 90, 'unrealized-profit'),
          unrealizedProfitChange180d: calculateChange(unrealizedProfit, 180, 'unrealized-profit'),
          unrealizedLossChange30d: calculateChange(unrealizedLoss, 30, 'negative-unrealized-loss'),
          unrealizedLossChange90d: calculateChange(unrealizedLoss, 90, 'negative-unrealized-loss'),
          unrealizedLossChange180d: calculateChange(unrealizedLoss, 180, 'negative-unrealized-loss'),
          realizedProfitChange30d: calculateChange(realizedProfit, 30, 'realized-profit'),
          realizedProfitChange90d: calculateChange(realizedProfit, 90, 'realized-profit'),
          realizedProfitChange180d: calculateChange(realizedProfit, 180, 'realized-profit'),
          realizedLossChange30d: calculateChange(realizedLoss, 30, 'negative-realized-loss'),
          realizedLossChange90d: calculateChange(realizedLoss, 90, 'negative-realized-loss'),
          realizedLossChange180d: calculateChange(realizedLoss, 180, 'negative-realized-loss'),
          loading: false,
          error: null,
        });
      } catch (error) {
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch metrics',
        }));
      }
    }

    fetchMetrics();
  }, []);

  return metrics;
} 