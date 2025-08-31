// This code passed review, it works, it's frozen

import { METRICS_LIST } from './metricsConfig';
import { calculateDerivedMetrics } from './derivedMetrics';
import { config } from '@/lib/config';

const DEFAULT_API_BASE = config.api.baseUrl;

// Simple interface for metric data with dates and values
export interface MetricData {
  dates: string[];
  metrics: Record<string, number[]>;
}

// Fetch all metrics one at a time to respect API limits
export async function fetchAllMetrics(apiBaseUrl: string = DEFAULT_API_BASE): Promise<MetricData> {
  console.log(`Fetching ${METRICS_LIST.length} metrics individually...`);
  
  const promises = METRICS_LIST.map(async (metric) => {
    const url = `${apiBaseUrl}/api/vecs/query?index=dateindex&ids=date,${metric}&format=json`;
    console.log(`Fetching ${metric} from: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`status ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data) || data.length < 2) throw new Error('bad format');
      const [dates, values] = data;
      return { metric, dates, values };
    } catch (err) {
      // Fallback for metrics not present in the generic query index
      if (metric === 'short-term-holders-realized-price') {
        console.warn(`Fallback fetch for ${metric}`);
        // 1) fetch values from specific endpoint
        const valRes = await fetch(`${apiBaseUrl}/api/vecs/dateindex-to-short-term-holders-realized-price`);
        if (!valRes.ok) throw new Error(`Failed fallback values for ${metric}: ${valRes.status}`);
        const values: number[] = await valRes.json();
        // 2) fetch dates using a reliable series (date,close)
        const dateRes = await fetch(`${apiBaseUrl}/api/vecs/query?index=dateindex&ids=date,close&format=json`);
        if (!dateRes.ok) throw new Error(`Failed fallback dates for ${metric}: ${dateRes.status}`);
        const dateData = await dateRes.json();
        const dates: string[] = Array.isArray(dateData) && dateData.length >= 1 ? dateData[0] : [];
        // Align lengths conservatively
        const len = Math.min(dates.length, values.length);
        return { metric, dates: dates.slice(0, len), values: values.slice(0, len) };
      }
      throw new Error(`Failed to fetch ${metric}: ${String(err)}`);
    }
  });

  const results = await Promise.all(promises);

  // Choose canonical date axis from `close` if present, otherwise first result
  const closeEntry = results.find(r => r.metric === 'close');
  const dates = closeEntry?.dates || results[0]?.dates || [];

  const targetLen = dates.length;
  const metrics: Record<string, number[]> = {};

  // Helper: align each metric's values to the canonical date length by
  // left-padding with NaN when the series starts later, and truncating
  // from the start when the series is longer.
  const alignToLength = (values: number[], length: number): number[] => {
    if (!Array.isArray(values)) return new Array(length).fill(NaN);
    if (values.length === length) return values;
    if (values.length < length) {
      const pad = new Array(length - values.length).fill(NaN);
      return [...pad, ...values];
    }
    // If longer, take the most recent `length` items to keep tail aligned
    return values.slice(values.length - length);
  };

  results.forEach(({ metric, values }) => {
    metrics[metric] = alignToLength(values, targetLen);
  });
  
  // Calculate derived metrics
  const derivedMetrics = calculateDerivedMetrics(metrics);
  
  // Merge derived metrics with base metrics
  Object.assign(metrics, derivedMetrics);
  
  console.log(`Successfully fetched ${Object.keys(metrics).length} metrics (including ${Object.keys(derivedMetrics).length} derived) with ${dates.length} data points`);
  console.log('Available metrics:', Object.keys(metrics));
  console.log('Derived metrics:', Object.keys(derivedMetrics));
  if (derivedMetrics['mvrv-ratio']) {
    console.log('MVRV Ratio derived metric found:', {
      length: derivedMetrics['mvrv-ratio'].length,
      firstFewValues: derivedMetrics['mvrv-ratio'].slice(0, 5)
    });
  }
  
  return {
    dates,
    metrics
  };
}

// Fetch the latest date
export async function fetchLatestDate(apiBaseUrl: string = DEFAULT_API_BASE): Promise<string> {
  try {
    const url = `${apiBaseUrl}/api/vecs/dateindex-to-date?from=-1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch latest date: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (typeof data !== 'string') {
      throw new Error('Invalid date format received');
    }
    
    return data;
    
  } catch (error) {
    console.error('Failed to fetch latest date:', error);
    throw error;
  }
} 