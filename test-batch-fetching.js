#!/usr/bin/env node

// Test script to verify batch fetching (how the app actually fetches metrics)
// This simulates the fetchAllMetrics function behavior

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

async function testBatchFetching() {
  console.log('Testing batch fetching (simulating fetchAllMetrics behavior)...\n');
  console.log('='.repeat(80));
  
  // First, get dates
  console.log('Step 1: Fetching dates...');
  const dateUrl = 'https://bitview.space/api/vecs/dateindex-to-date';
  const dateResponse = await fetch(dateUrl);
  const dates = await dateResponse.json();
  console.log(`✓ Fetched ${dates.length} dates\n`);
  
  // Fetch metrics in batches of 10 (like the app does)
  const batchSize = 10;
  const metrics = {};
  const batchResults = [];
  
  for (let i = 0; i < METRICS_LIST.length; i += batchSize) {
    const batch = METRICS_LIST.slice(i, i + batchSize);
    const batchWithDate = ['date', ...batch];
    const idsParam = batchWithDate.join(',');
    
    // Construct URL like the app does: /api/bitview?index=dateindex&ids=date,metric1,metric2...
    // But we're testing directly against bitview.space
    console.log(`Batch ${Math.floor(i/batchSize) + 1}: Testing ${batch.length} metrics`);
    console.log(`  Metrics: ${batch.join(', ')}`);
    
    // For batch fetching, the app fetches each metric separately and combines
    // Let's test this approach
    const batchPromises = batch.map(async (metric) => {
      const url = `https://bitview.space/api/vecs/dateindex-to-${metric}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          return { metric, status: 'ERROR', httpStatus: response.status };
        }
        const data = await response.json();
        const validCount = data.filter(v => v !== null && v !== 0 && v !== 0.0 && !isNaN(v)).length;
        return { metric, status: 'OK', validCount, totalCount: data.length };
      } catch (error) {
        return { metric, status: 'ERROR', error: error.message };
      }
    });
    
    const results = await Promise.all(batchPromises);
    batchResults.push({ batchNum: Math.floor(i/batchSize) + 1, results });
    
    results.forEach(r => {
      if (r.status === 'OK') {
        console.log(`    ✓ ${r.metric}: ${r.validCount}/${r.totalCount} valid values`);
        metrics[r.metric] = 'OK';
      } else {
        console.log(`    ✗ ${r.metric}: ${r.status} ${r.error || r.httpStatus || ''}`);
        metrics[r.metric] = r.status;
      }
    });
    
    console.log('');
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('='.repeat(80));
  console.log('\nBATCH FETCHING SUMMARY:\n');
  
  const working = Object.entries(metrics).filter(([_, status]) => status === 'OK');
  const failed = Object.entries(metrics).filter(([_, status]) => status !== 'OK');
  
  console.log(`✓ Working: ${working.length}/${METRICS_LIST.length}`);
  console.log(`✗ Failed: ${failed.length}/${METRICS_LIST.length}`);
  
  if (failed.length > 0) {
    console.log('\nFailed metrics:');
    failed.forEach(([metric, status]) => {
      console.log(`  - ${metric}: ${status}`);
    });
  }
  
  // Test the actual API endpoint format the app uses
  console.log('\n' + '='.repeat(80));
  console.log('\nTesting app API endpoint format...\n');
  console.log('The app uses: /api/bitview?index=dateindex&ids=date,metric1,metric2&format=json');
  console.log('This gets proxied to: https://bitview.space/api/vecs/dateindex-to-{metric}\n');
  
  // Test a small batch through the app's API format
  const testBatch = ['date', 'price_close', 'realized_price', 'market_cap'];
  console.log(`Testing batch: ${testBatch.join(', ')}`);
  
  // Simulate what the app's API route does - it fetches each metric separately
  for (const metricId of testBatch) {
    const url = `https://bitview.space/api/vecs/dateindex-to-${metricId}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (Array.isArray(data)) {
        const validCount = data.filter(v => v !== null && v !== 0 && v !== 0.0 && !isNaN(v)).length;
        console.log(`  ✓ ${metricId}: ${validCount}/${data.length} valid values`);
      } else {
        console.log(`  ✗ ${metricId}: Invalid format`);
      }
    } catch (error) {
      console.log(`  ✗ ${metricId}: ${error.message}`);
    }
  }
}

testBatchFetching().catch(console.error);







