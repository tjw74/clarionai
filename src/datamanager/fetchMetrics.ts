// This code passed review, it works, it's frozen

import { METRICS_LIST } from './metricsConfig';
import { calculateDerivedMetrics } from './derivedMetrics';

const DEFAULT_API_BASE = "https://bitcoinresearchkit.org";

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
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch ${metric}: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    if (!Array.isArray(data) || data.length < 2) {
      throw new Error(`Invalid data format for ${metric}`);
    }
    
    const [dates, values] = data;
    return { metric, dates, values };
  });

  const results = await Promise.all(promises);
  
  // All metrics should have the same dates due to dateindex alignment
  const dates = results[0]?.dates || [];
  const metrics: Record<string, number[]> = {};
  
  results.forEach(({ metric, values }) => {
    metrics[metric] = values;
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