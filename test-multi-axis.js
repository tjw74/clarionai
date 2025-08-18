// Test script for multi-axis logic
// This simulates the axis assignment logic to verify it works correctly

// Mock metric data similar to what would be in the AI Workbench
const mockMetricData = {
  dates: ['2020-01-01', '2020-01-02', '2020-01-03'],
  metrics: {
    'close': [10000, 11000, 12000], // Price: $10k-$12k
    'short-term-holders-adjusted-spent-output-profit-ratio': [0.95, 1.05, 1.15], // STH SOPR: 0.95-1.15
    'marketcap': [200000000000, 220000000000, 240000000000], // Market Cap: $200B-$240B
    'mvrv-ratio': [2.1, 2.3, 2.5], // MVRV: 2.1-2.5
    'short-term-holders-utxo-count': [5000000, 5200000, 5400000], // UTXO Count: 5M-5.4M
  }
};

const METRIC_SCALE_TYPES = {
  USD_LARGE: ['marketcap', 'realized-cap'],
  USD_PRICE: ['close', 'realized-price', '200d-sma', 'true-market-mean', 'vaulted-price', 'short-term-holders-realized-price'],
  RATIO: ['mvrv-ratio', 'adjusted-spent-output-profit-ratio', 'sell-side-risk-ratio'],
  PERCENTAGE: ['liveliness'],
  COUNT: ['short-term-holders-utxo-count'],
};

// Simulate the axis assignment logic
function getAxisAssignment(metrics, metricData, sliderRange) {
  if (!metricData || !sliderRange) {
    console.log('No data available, using fallback logic');
    return { leftAxisMetrics: [], rightAxisMetrics: [], axisGroups: [] };
  }

  const [start, end] = sliderRange;
  const axisGroups = [];
  
  // Analyze data ranges for each metric
  const metricRanges = [];
  
  metrics.forEach((metric) => {
    const data = metricData.metrics[metric];
    if (!data || data.length === 0) return;
    
    const slicedData = data.slice(start, end + 1).filter(v => typeof v === 'number' && !isNaN(v));
    if (slicedData.length === 0) return;
    
    const min = Math.min(...slicedData);
    const max = Math.max(...slicedData);
    
    // Skip metrics with invalid ranges
    if (min === max || min <= 0 || max <= 0) {
      console.log(`Skipping metric ${metric} due to invalid range: min=${min}, max=${max}`);
      return;
    }
    
    const range = max - min;
    
    // Determine appropriate scale type
    let scale = 'linear';
    if (METRIC_SCALE_TYPES.USD_LARGE.includes(metric) || 
        METRIC_SCALE_TYPES.USD_PRICE.includes(metric) ||
        METRIC_SCALE_TYPES.COUNT.includes(metric)) {
      scale = 'log';
    }
    
    metricRanges.push({ metric, range: { min, max }, scale });
  });
  
  console.log('Metric ranges:', metricRanges);
  
  // Sort metrics by their range magnitude (log scale for better comparison)
  metricRanges.sort((a, b) => {
    const aMagnitude = Math.log10(a.range.max / Math.max(a.range.min, 1e-10));
    const bMagnitude = Math.log10(b.range.max / Math.max(b.range.min, 1e-10));
    return bMagnitude - aMagnitude;
  });
  
  console.log('Sorted by magnitude:', metricRanges.map(m => ({
    metric: m.metric,
    magnitude: Math.log10(m.range.max / Math.max(m.range.min, 1e-10))
  })));
  
  // Group metrics by scale compatibility
  metricRanges.forEach(({ metric, range, scale }) => {
    // Check if this metric can share an axis with existing groups
    let assigned = false;
    
    for (let i = 0; i < axisGroups.length; i++) {
      const group = axisGroups[i];
      if (group.scale !== scale) continue;
      
      // Check if ranges are compatible (within reasonable overlap)
      const groupRange = group.range;
      const combinedMin = Math.min(groupRange.min, range.min);
      const combinedMax = Math.max(groupRange.max, range.max);
      
      // For log scale, check if the ratio of max/min is reasonable
      if (scale === 'log') {
        const ratio = combinedMax / Math.max(combinedMin, 1e-10);
        if (ratio <= 1e6) { // Allow up to 6 orders of magnitude
          group.metrics.push(metric);
          group.range = { min: combinedMin, max: combinedMax };
          assigned = true;
          break;
        }
      } else {
        // For linear scale, check if the absolute difference is reasonable
        const rangeDiff = combinedMax - combinedMin;
        const individualRange = range.max - range.min;
        if (rangeDiff <= individualRange * 100) { // Allow up to 100x range difference
          group.metrics.push(metric);
          group.range = { min: combinedMin, max: combinedMax };
          assigned = true;
          break;
        }
      }
      
      // Additional check: if one metric is much larger than the other, separate them
      const groupMagnitude = Math.log10(groupRange.max / Math.max(groupRange.min, 1e-10));
      const metricMagnitude = Math.log10(range.max / Math.max(range.min, 1e-10));
      if (Math.abs(groupMagnitude - metricMagnitude) > 3) { // More than 3 orders of magnitude difference
        continue; // Don't group these metrics together
      }
    }
    
    // If no compatible group found, create a new one
    if (!assigned) {
      const axisId = `y${axisGroups.length + 1}`;
      const side = axisGroups.length % 2 === 0 ? 'left' : 'right';
      axisGroups.push({
        axisId,
        metrics: [metric],
        side,
        scale,
        range
      });
    }
  });
  
  console.log('Axis groups created:', axisGroups);
  
  // Convert to the expected format for backward compatibility
  const leftAxisMetrics = [];
  const rightAxisMetrics = [];
  
  axisGroups.forEach((group) => {
    if (group.side === 'left') {
      leftAxisMetrics.push(...group.metrics);
    } else {
      rightAxisMetrics.push(...group.metrics);
    }
  });
  
  return { leftAxisMetrics, rightAxisMetrics, axisGroups };
}

// Test scenarios
console.log('=== Testing Multi-Axis Logic ===\n');

// Test 1: Price + STH SOPR (the original problem)
console.log('Test 1: Price + STH SOPR');
const test1 = getAxisAssignment(
  ['close', 'short-term-holders-adjusted-spent-output-profit-ratio'],
  mockMetricData,
  [0, 2]
);
console.log('Result:', test1);
console.log('Expected: Price and STH SOPR should be on separate axes due to scale difference\n');

// Test 2: Multiple compatible metrics
console.log('Test 2: Multiple compatible metrics');
const test2 = getAxisAssignment(
  ['close', 'marketcap'],
  mockMetricData,
  [0, 2]
);
console.log('Result:', test2);
console.log('Expected: Both should be on same axis (both log scale, similar magnitude)\n');

// Test 3: Mixed scale types
console.log('Test 3: Mixed scale types');
const test3 = getAxisAssignment(
  ['close', 'mvrv-ratio', 'short-term-holders-utxo-count'],
  mockMetricData,
  [0, 2]
);
console.log('Result:', test3);
console.log('Expected: Should create 3 separate axes due to different scales and magnitudes\n');

// Test 4: All metrics
console.log('Test 4: All metrics');
const test4 = getAxisAssignment(
  ['close', 'short-term-holders-adjusted-spent-output-profit-ratio', 'marketcap', 'mvrv-ratio', 'short-term-holders-utxo-count'],
  mockMetricData,
  [0, 2]
);
console.log('Result:', test4);
console.log('Expected: Should group compatible metrics and create separate axes for incompatible ones\n');

console.log('=== Test Complete ===');
