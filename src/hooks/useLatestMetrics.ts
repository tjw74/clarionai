import { useState, useEffect } from 'react';
import { fetchAllMetrics, type MetricData } from '../datamanager';

export interface LatestMetrics {
  price: number | null;
  marketCap: number | null;
  realizedCap: number | null;
  mvrvRatio: number | null;
  unrealizedProfit: number | null;
  unrealizedLoss: number | null;
  realizedProfit: number | null;
  realizedLoss: number | null;
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
    marketCap: null,
    realizedCap: null,
    mvrvRatio: null,
    unrealizedProfit: null,
    unrealizedLoss: null,
    realizedProfit: null,
    realizedLoss: null,
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
        const marketCap = data.metrics['marketcap']?.[latestIndex] || null;
        const realizedCap = data.metrics['realized-cap']?.[latestIndex] || null;
        const unrealizedProfit = data.metrics['unrealized-profit']?.[latestIndex] || null;
        const unrealizedLoss = data.metrics['negative-unrealized-loss']?.[latestIndex] || null;
        const realizedProfit = data.metrics['realized-profit']?.[latestIndex] || null;
        const realizedLoss = data.metrics['negative-realized-loss']?.[latestIndex] || null;
        
        // Calculate MVRV Ratio
        let mvrvRatio = null;
        if (marketCap && realizedCap && realizedCap > 0) {
          mvrvRatio = marketCap / realizedCap;
        }

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
          marketCap,
          realizedCap,
          mvrvRatio,
          unrealizedProfit,
          unrealizedLoss,
          realizedProfit,
          realizedLoss,
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