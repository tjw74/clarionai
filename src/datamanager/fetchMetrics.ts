// This code passed review, it works, it's frozen

import { METRICS_LIST } from './metricsConfig';
import { calculateDerivedMetrics } from './derivedMetrics';
import { config } from '@/lib/config';

const DEFAULT_API_BASE = '/api/bitview';

// Simple interface for metric data with dates and values
export interface MetricData {
  dates: string[];
  metrics: Record<string, number[]>;
}

// Fetch all metrics in batches to avoid parameter length limits
export async function fetchAllMetrics(apiBaseUrl: string = DEFAULT_API_BASE): Promise<MetricData> {
  console.log(`Fetching all ${METRICS_LIST.length} metrics in batches...`);
  
  try {
    // First, get the dates
    const dateUrl = `${apiBaseUrl}?index=dateindex&ids=date&format=json`;
    console.log(`Fetching dates from: ${dateUrl}`);
    
    const dateResponse = await fetch(dateUrl);
    if (!dateResponse.ok) {
      throw new Error(`Failed to fetch dates: ${dateResponse.status}`);
    }
    
    const dateData = await dateResponse.json();
    if (!Array.isArray(dateData)) {
      throw new Error('Invalid date format received');
    }
    
    const dates = dateData;
    console.log(`Fetched ${dates.length} data points`);
    
    // Fetch metrics in batches of 10 to avoid parameter length limits
    const batchSize = 10;
    const metrics: Record<string, number[]> = {};
    
    for (let i = 0; i < METRICS_LIST.length; i += batchSize) {
      const batch = METRICS_LIST.slice(i, i + batchSize);
      const batchWithDate = ['date', ...batch];
      const idsParam = batchWithDate.join(',');
      const url = `${apiBaseUrl}?index=dateindex&ids=${idsParam}&format=json`;
      console.log(`Fetching batch ${Math.floor(i/batchSize) + 1}: ${batch.join(', ')}`);

      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Failed to fetch batch ${Math.floor(i/batchSize) + 1} (${batch.join(', ')}): ${response.status} ${response.statusText}`);
        // Fill with NaN for failed batch
        batch.forEach(metric => {
          metrics[metric] = new Array(dates.length).fill(NaN);
        });
        continue;
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length < 2) {
        console.warn(`Invalid data format for batch ${Math.floor(i/batchSize) + 1} (${batch.join(', ')}): expected array with at least 2 elements, got ${typeof data}`);
        batch.forEach(metric => {
          metrics[metric] = new Array(dates.length).fill(NaN);
        });
        continue;
      }

      // Map each metric in this batch to its corresponding data array
      batch.forEach((metric, batchIndex) => {
        const metricData = data[batchIndex + 1]; // +1 because dates is at index 0
        if (Array.isArray(metricData)) {
          // Validate array length matches dates
          if (metricData.length === dates.length) {
            metrics[metric] = metricData;
          } else {
            console.warn(`Metric ${metric} has incorrect length: ${metricData.length}, expected ${dates.length}`);
            // Pad or truncate to match dates length
            if (metricData.length < dates.length) {
              metrics[metric] = [...metricData, ...new Array(dates.length - metricData.length).fill(NaN)];
            } else {
              metrics[metric] = metricData.slice(0, dates.length);
            }
          }
        } else {
          console.warn(`No data found for metric: ${metric} (got ${typeof metricData})`);
          metrics[metric] = new Array(dates.length).fill(NaN);
        }
      });
    }

    // Calculate derived metrics
    const derivedMetrics = calculateDerivedMetrics(metrics);
    
    // Merge derived metrics with base metrics
    Object.assign(metrics, derivedMetrics);
    
    // Check for metrics that are all NaN (failed to fetch)
    const failedMetrics: string[] = [];
    const successfulMetrics: string[] = [];
    
    Object.keys(metrics).forEach(key => {
      const arr = metrics[key];
      if (Array.isArray(arr)) {
        const validCount = arr.filter(v => typeof v === 'number' && !isNaN(v) && isFinite(v)).length;
        if (validCount === 0) {
          failedMetrics.push(key);
        } else {
          successfulMetrics.push(key);
        }
      }
    });
    
    console.log(`Successfully fetched ${successfulMetrics.length} metrics with valid data (including ${Object.keys(derivedMetrics).length} derived) with ${dates.length} data points`);
    if (failedMetrics.length > 0) {
      console.warn(`Failed to fetch ${failedMetrics.length} metrics (all NaN):`, failedMetrics);
    }
    console.log('Available metrics:', Object.keys(metrics));
    console.log('Derived metrics:', Object.keys(derivedMetrics));
    if (derivedMetrics['mvrv-ratio']) {
      console.log('MVRV Ratio derived metric found:', {
        length: derivedMetrics['mvrv-ratio'].length,
        firstFewValues: derivedMetrics['mvrv-ratio'].slice(0, 5),
        lastFewValues: derivedMetrics['mvrv-ratio'].slice(-5)
      });
    } else {
      console.warn('MVRV Ratio NOT found in derived metrics!');
    }
    
    return {
      dates,
      metrics
    };
  } catch (error) {
    console.error('Error fetching all metrics:', error);
    throw error;
  }
}

// Fetch the latest date
export async function fetchLatestDate(apiBaseUrl: string = DEFAULT_API_BASE): Promise<string> {
  try {
    const url = `${apiBaseUrl}?index=dateindex&ids=date&from=-1`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch latest date: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    
    if (typeof data !== 'string') {
      throw new Error('Invalid date format received');
    }
    
    return data;
    
  } catch (error) {
    console.error('Failed to fetch latest date:', error);
    throw error;
  }
} 