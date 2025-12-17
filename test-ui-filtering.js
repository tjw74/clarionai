#!/usr/bin/env node

// Test which metrics would be filtered out by the UI logic

const METRIC_SCALE_TYPES = {
  USD_LARGE: ['market_cap', 'realized_cap'],
  USD_PRICE: ['price_close', 'price_high', 'realized_price', 'price_200d_sma', 'true_market_mean', 'vaulted_price', 'sth_realized_price'],
  RATIO: ['mvrv-ratio', 'adjusted_sopr', 'sell_side_risk_ratio'],
  Z_SCORE: ['*_z'],
  PERCENTAGE: ['liveliness'],
  COUNT: ['sth_utxo_count'],
  SUPPLY: ['sth_supply', 'lth_supply'],
  USD_LOSS: ['sth_neg_realized_loss', 'sth_neg_unrealized_loss', 'neg_realized_loss', 'neg_unrealized_loss'],
};

const METRICS_LIST = [
  'price_close',
  'price_high',
  'realized_price',
  'price_200d_sma',
  'true_market_mean',
  'vaulted_price',
  'market_cap',
  'realized_cap',
  'adjusted_sopr',
  'sell_side_risk_ratio',
  'liveliness',
  'sth_realized_price',
  'sth_supply',
  'sth_utxo_count',
  'sth_realized_cap',
  'sth_realized_price_ratio',
  'sth_realized_profit',
  'sth_neg_realized_loss',
  'sth_sopr',
  'sth_unrealized_profit',
  'sth_neg_unrealized_loss',
  'coinblocks_destroyed',
  'lth_sopr',
  'lth_supply',
  'realized_profit',
  'neg_realized_loss',
  'net_realized_pnl',
  'unrealized_profit',
  'neg_unrealized_loss',
  'net_unrealized_pnl',
  'lth_realized_cap',
];

async function testMetricFiltering(metricName) {
  const url = `https://bitview.space/api/vecs/dateindex-to-${metricName}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) return { metric: metricName, error: `HTTP ${response.status}` };
    
    const data = await response.json();
    if (!Array.isArray(data)) return { metric: metricName, error: 'Not an array' };
    
    // Simulate the UI filtering logic
    // Get last 2920 data points (8 years, like the default range)
    const start = Math.max(0, data.length - 2920);
    const end = data.length - 1;
    const slicedData = data.slice(start, end + 1).filter(v => typeof v === 'number' && !isNaN(v));
    
    if (slicedData.length === 0) {
      return { metric: metricName, filtered: true, reason: 'No valid data in range' };
    }
    
    const min = Math.min(...slicedData);
    const max = Math.max(...slicedData);
    
    // Check if it's a loss metric
    const isLossMetric = METRIC_SCALE_TYPES.USD_LOSS.includes(metricName);
    
    // Check filtering conditions (from UI code)
    if (min === max) {
      return { metric: metricName, filtered: true, reason: `Invalid range: min=${min}, max=${max}` };
    }
    
    if (!isLossMetric && (min <= 0 || max <= 0)) {
      return { metric: metricName, filtered: true, reason: `Non-positive range: min=${min}, max=${max}` };
    }
    
    return { 
      metric: metricName, 
      filtered: false, 
      min, 
      max, 
      validCount: slicedData.length,
      totalInRange: end - start + 1
    };
    
  } catch (error) {
    return { metric: metricName, error: error.message };
  }
}

async function testAllMetrics() {
  console.log('Testing which metrics would be filtered by UI logic...\n');
  console.log('='.repeat(80));
  
  const results = [];
  
  for (const metric of METRICS_LIST) {
    process.stdout.write(`Testing ${metric}... `);
    const result = await testMetricFiltering(metric);
    results.push(result);
    
    if (result.filtered) {
      console.log(`✗ FILTERED: ${result.reason}`);
    } else if (result.error) {
      console.log(`✗ ERROR: ${result.error}`);
    } else {
      console.log(`✓ PASSES (min=${result.min}, max=${result.max})`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\nSUMMARY:\n');
  
  const passed = results.filter(r => !r.filtered && !r.error);
  const filtered = results.filter(r => r.filtered);
  const errors = results.filter(r => r.error);
  
  console.log(`✓ Would Pass UI Filter: ${passed.length}`);
  passed.forEach(r => {
    console.log(`  - ${r.metric}`);
  });
  
  console.log(`\n✗ Would Be Filtered Out: ${filtered.length}`);
  filtered.forEach(r => {
    console.log(`  - ${r.metric}: ${r.reason}`);
  });
  
  if (errors.length > 0) {
    console.log(`\n✗ Errors: ${errors.length}`);
    errors.forEach(r => {
      console.log(`  - ${r.metric}: ${r.error}`);
    });
  }
}

testAllMetrics().catch(console.error);



