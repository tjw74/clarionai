import { useState, useEffect } from 'react';
import { fetchAllMetrics, type MetricData } from '../datamanager';

export interface LatestMetrics {
  price: number | null;
  marketCap: number | null;
  realizedCap: number | null;
  mvrvRatio: number | null;
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
  loading: boolean;
  error: string | null;
}

export function useLatestMetrics(): LatestMetrics {
  const [metrics, setMetrics] = useState<LatestMetrics>({
    price: null,
    marketCap: null,
    realizedCap: null,
    mvrvRatio: null,
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