#!/usr/bin/env node

// Test script to verify all metrics from METRICS_LIST
// This will check which metrics return valid data vs nulls/zeros/errors

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

async function testMetric(metricName) {
  const url = `https://bitview.space/api/vecs/dateindex-to-${metricName}`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        metric: metricName,
        status: 'ERROR',
        httpStatus: response.status,
        error: `HTTP ${response.status}`,
        data: null
      };
    }
    
    const text = await response.text();
    
    // Check if it's an error message
    if (text.includes('No vec named') || text.includes('Maybe you meant')) {
      return {
        metric: metricName,
        status: 'NOT_FOUND',
        error: text.substring(0, 200),
        data: null
      };
    }
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return {
        metric: metricName,
        status: 'PARSE_ERROR',
        error: 'Failed to parse JSON',
        data: null
      };
    }
    
    if (!Array.isArray(data)) {
      return {
        metric: metricName,
        status: 'INVALID_FORMAT',
        error: 'Response is not an array',
        data: null
      };
    }
    
    // Analyze the data
    const totalValues = data.length;
    const nullCount = data.filter(v => v === null).length;
    const zeroCount = data.filter(v => v === 0 || v === 0.0).length;
    const validCount = data.filter(v => v !== null && v !== 0 && v !== 0.0 && !isNaN(v)).length;
    const hasData = validCount > 0;
    
    // Get sample values
    const firstValid = data.find(v => v !== null && v !== 0 && v !== 0.0 && !isNaN(v));
    const lastValid = [...data].reverse().find(v => v !== null && v !== 0 && v !== 0.0 && !isNaN(v));
    
    return {
      metric: metricName,
      status: hasData ? 'WORKING' : 'NO_DATA',
      totalValues,
      nullCount,
      zeroCount,
      validCount,
      firstValid,
      lastValid,
      sample: data.slice(-5), // Last 5 values
      data: hasData ? 'HAS_DATA' : 'ALL_NULLS_OR_ZEROS'
    };
    
  } catch (error) {
    return {
      metric: metricName,
      status: 'EXCEPTION',
      error: error.message,
      data: null
    };
  }
}

async function testAllMetrics() {
  console.log('Testing all metrics from METRICS_LIST...\n');
  console.log(`Total metrics to test: ${METRICS_LIST.length}\n`);
  console.log('='.repeat(80));
  
  const results = [];
  
  for (const metric of METRICS_LIST) {
    process.stdout.write(`Testing ${metric}... `);
    const result = await testMetric(metric);
    results.push(result);
    
    if (result.status === 'WORKING') {
      console.log(`✓ WORKING (${result.validCount}/${result.totalValues} valid values)`);
    } else if (result.status === 'NO_DATA') {
      console.log(`✗ NO DATA (all nulls/zeros)`);
    } else if (result.status === 'NOT_FOUND') {
      console.log(`✗ NOT FOUND`);
    } else {
      console.log(`✗ ${result.status}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('\nSUMMARY:\n');
  
  const working = results.filter(r => r.status === 'WORKING');
  const noData = results.filter(r => r.status === 'NO_DATA');
  const notFound = results.filter(r => r.status === 'NOT_FOUND');
  const errors = results.filter(r => r.status === 'ERROR' || r.status === 'EXCEPTION' || r.status === 'PARSE_ERROR' || r.status === 'INVALID_FORMAT');
  
  console.log(`✓ WORKING: ${working.length}`);
  working.forEach(r => {
    console.log(`  - ${r.metric} (${r.validCount}/${r.totalValues} valid, sample: ${r.lastValid})`);
  });
  
  console.log(`\n✗ NO DATA (all nulls/zeros): ${noData.length}`);
  noData.forEach(r => {
    console.log(`  - ${r.metric} (${r.nullCount} nulls, ${r.zeroCount} zeros)`);
  });
  
  console.log(`\n✗ NOT FOUND: ${notFound.length}`);
  notFound.forEach(r => {
    const errorMsg = r.error ? r.error.substring(0, 100) : 'Unknown error';
    console.log(`  - ${r.metric}`);
    console.log(`    ${errorMsg}`);
  });
  
  console.log(`\n✗ ERRORS: ${errors.length}`);
  errors.forEach(r => {
    console.log(`  - ${r.metric}: ${r.error || r.status}`);
  });
  
  console.log(`\n${'='.repeat(80)}`);
  console.log(`\nTotal: ${results.length} metrics`);
  console.log(`Working: ${working.length} (${((working.length / results.length) * 100).toFixed(1)}%)`);
  console.log(`Not Working: ${noData.length + notFound.length + errors.length} (${(((noData.length + notFound.length + errors.length) / results.length) * 100).toFixed(1)}%)`);
  
  // Save detailed results to file
  const fs = require('fs');
  fs.writeFileSync('metric-test-results.json', JSON.stringify(results, null, 2));
  console.log('\nDetailed results saved to: metric-test-results.json');
}

testAllMetrics().catch(console.error);







