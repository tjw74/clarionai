#!/usr/bin/env node

// Test to see what data is available in different time ranges
// The UI shows Jan 2000 - Jan 2001, but Bitcoin data starts in 2009

const METRICS_LIST = [
  'price_close',
  'adjusted_sopr',
  'sell_side_risk_ratio',
  'liveliness',
  'lth_sopr',
  'lth_supply',
  'lth_realized_cap',
  'realized_profit',
  'neg_realized_loss',
  'net_realized_pnl',
  'unrealized_profit',
  'neg_unrealized_loss',
  'net_unrealized_pnl',
];

async function testMetricInTimeRange(metricName, startIndex, endIndex) {
  const url = `https://bitview.space/api/vecs/dateindex-to-${metricName}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    
    const data = await response.json();
    if (!Array.isArray(data)) return null;
    
    // Get date range
    const dateUrl = 'https://bitview.space/api/vecs/dateindex-to-date';
    const dateResponse = await fetch(dateUrl);
    const dates = await dateResponse.json();
    
    if (startIndex >= data.length || endIndex >= data.length) return null;
    
    const slicedData = data.slice(startIndex, endIndex + 1);
    const validData = slicedData.filter(v => typeof v === 'number' && !isNaN(v) && v !== null);
    
    return {
      metric: metricName,
      startDate: dates[startIndex],
      endDate: dates[endIndex],
      totalInRange: slicedData.length,
      validCount: validData.length,
      hasData: validData.length > 0,
      min: validData.length > 0 ? Math.min(...validData) : null,
      max: validData.length > 0 ? Math.max(...validData) : null,
    };
  } catch (error) {
    return null;
  }
}

async function findFirstValidDataIndex(metricName) {
  const url = `https://bitview.space/api/vecs/dateindex-to-${metricName}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return -1;
    
    const data = await response.json();
    if (!Array.isArray(data)) return -1;
    
    for (let i = 0; i < data.length; i++) {
      const val = data[i];
      if (typeof val === 'number' && !isNaN(val) && val !== null && val !== 0) {
        return i;
      }
    }
    return -1;
  } catch (error) {
    return -1;
  }
}

async function testAllMetrics() {
  console.log('Testing metrics with different time ranges...\n');
  
  // First, get dates to understand the range
  const dateUrl = 'https://bitview.space/api/vecs/dateindex-to-date';
  const dateResponse = await fetch(dateUrl);
  const dates = await dateResponse.json();
  
  console.log(`Total data points: ${dates.length}`);
  console.log(`First date: ${dates[0]}`);
  console.log(`Last date: ${dates[dates.length - 1]}\n`);
  
  // Test with early range (like Jan 2000 - Jan 2001, which is index 0-365 approximately)
  // But first, find where Bitcoin data actually starts
  console.log('Finding first valid data for each metric...\n');
  
  const firstValidIndices = {};
  for (const metric of METRICS_LIST) {
    process.stdout.write(`Checking ${metric}... `);
    const firstIndex = await findFirstValidDataIndex(metric);
    firstValidIndices[metric] = firstIndex;
    
    if (firstIndex >= 0) {
      console.log(`First data at index ${firstIndex} (${dates[firstIndex]})`);
    } else {
      console.log('No valid data found');
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\nTesting with early range (indices 0-365, approximately Jan 2000 - Jan 2001):\n');
  
  const earlyRangeResults = [];
  for (const metric of METRICS_LIST) {
    const result = await testMetricInTimeRange(metric, 0, Math.min(365, dates.length - 1));
    if (result) {
      earlyRangeResults.push(result);
      console.log(`${metric}: ${result.validCount}/${result.totalInRange} valid (${result.hasData ? 'HAS DATA' : 'NO DATA'})`);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\nTesting with recent range (last 365 days):\n');
  
  const recentStart = Math.max(0, dates.length - 365);
  const recentEnd = dates.length - 1;
  const recentRangeResults = [];
  
  for (const metric of METRICS_LIST) {
    const result = await testMetricInTimeRange(metric, recentStart, recentEnd);
    if (result) {
      recentRangeResults.push(result);
      console.log(`${metric}: ${result.validCount}/${result.totalInRange} valid, min=${result.min}, max=${result.max}`);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\nSUMMARY:\n');
  
  const earlyNoData = earlyRangeResults.filter(r => !r.hasData);
  const recentNoData = recentRangeResults.filter(r => !r.hasData);
  
  console.log(`Metrics with NO DATA in early range (0-365): ${earlyNoData.length}`);
  earlyNoData.forEach(r => console.log(`  - ${r.metric}`));
  
  console.log(`\nMetrics with NO DATA in recent range: ${recentNoData.length}`);
  recentNoData.forEach(r => console.log(`  - ${r.metric}`));
  
  console.log('\nFirst valid data indices:');
  Object.entries(firstValidIndices)
    .sort((a, b) => a[1] - b[1])
    .forEach(([metric, index]) => {
      if (index >= 0) {
        console.log(`  ${metric}: index ${index} (${dates[index]})`);
      }
    });
}

testAllMetrics().catch(console.error);



