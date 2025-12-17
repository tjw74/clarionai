# Metric Verification Report

**Date:** Generated during testing  
**Purpose:** Verify all metrics in METRICS_LIST are working correctly

## Executive Summary

✅ **ALL 31 METRICS ARE WORKING** when tested directly against the BitView API.

- **Working Metrics:** 31/31 (100%)
- **Failed Metrics:** 0/31 (0%)
- **Database Usage:** No database - app fetches directly from BitView API in real-time

## Test Methodology

1. **Individual Metric Testing:** Tested each metric individually via direct API calls
2. **Batch Fetching Testing:** Simulated the app's batch fetching approach (batches of 10)
3. **Data Validation:** Verified each metric returns valid data (not all nulls/zeros)

## Detailed Results

### ✅ All Metrics Working (31/31)

| Metric | Valid Values | Total Values | Status | Sample Value |
|--------|--------------|--------------|--------|--------------|
| `price_close` | 5,598 | 6,148 | ✅ WORKING | 102,155.6 |
| `price_high` | 5,598 | 6,148 | ✅ WORKING | 102,252.2 |
| `realized_price` | 5,563 | 6,148 | ✅ WORKING | 55,960.95 |
| `price_200d_sma` | 5,598 | 6,148 | ✅ WORKING | 110,194.65 |
| `true_market_mean` | 5,563 | 6,148 | ✅ WORKING | 81,921.74 |
| `vaulted_price` | 5,548 | 6,148 | ✅ WORKING | 152,173.38 |
| `market_cap` | 5,598 | 6,148 | ✅ WORKING | 2,037,516,865,141.69 |
| `realized_cap` | 5,563 | 6,148 | ✅ WORKING | 1,116,153,935,495.93 |
| `adjusted_sopr` | 5,563 | 6,148 | ✅ WORKING | 1.0052 |
| `sell_side_risk_ratio` | 5,563 | 6,148 | ✅ WORKING | 0.0095 |
| `liveliness` | 6,144 | 6,148 | ✅ WORKING | 0.6323 |
| `sth_realized_price` | 5,563 | 6,148 | ✅ WORKING | 112,318.71 |
| `sth_supply` | 6,147 | 6,148 | ✅ WORKING | 480,124,795,979,663 |
| `sth_utxo_count` | 6,147 | 6,148 | ✅ WORKING | 18,073,205 |
| `sth_realized_cap` | 5,563 | 6,148 | ✅ WORKING | 539,265,205,823.64 |
| `sth_realized_price_ratio` | 6,147 | 6,148 | ✅ WORKING | 0.9095 |
| `sth_realized_profit` | 5,550 | 6,148 | ✅ WORKING | 11,445,160.21 |
| `sth_neg_realized_loss` | 5,456 | 6,148 | ✅ WORKING | -41,718,613.82 |
| `sth_sopr` | 5,563 | 6,148 | ✅ WORKING | 0.9955 |
| `sth_unrealized_profit` | 5,494 | 6,148 | ✅ WORKING | 252,281,899.4 |
| `sth_neg_unrealized_loss` | 5,401 | 6,148 | ✅ WORKING | -49,045,142,380.11 |
| `coinblocks_destroyed` | 5,893 | 6,148 | ✅ WORKING | 405,895,985.06 |
| `lth_sopr` | 5,392 | 6,148 | ✅ WORKING | 1.0757 |
| `lth_supply` | 5,997 | 6,148 | ✅ WORKING | 1,514,398,132,906,956 |
| `realized_profit` | 5,563 | 6,148 | ✅ WORKING | 63,603,635.67 |
| `neg_realized_loss` | 5,456 | 6,148 | ✅ WORKING | -42,659,414.19 |
| `net_realized_pnl` | 5,563 | 6,148 | ✅ WORKING | 20,893,394.66 |
| `unrealized_profit` | 5,511 | 6,148 | ✅ WORKING | 804,070,074,305.39 |
| `neg_unrealized_loss` | 5,466 | 6,148 | ✅ WORKING | -52,030,240,547.01 |
| `net_unrealized_pnl` | 5,562 | 6,148 | ✅ WORKING | 752,039,833,758.38 |
| `lth_realized_cap` | 5,413 | 6,148 | ✅ WORKING | 576,888,729,672.29 |

## API URL Pattern

The app constructs URLs as:
```
https://bitview.space/api/vecs/dateindex-to-{metricId}
```

Where `{metricId}` comes from `METRICS_LIST` in `metricsConfig.ts`.

**All metric names in METRICS_LIST are correct and match the BitView API.**

## Database Confirmation

✅ **No database is used for metrics storage.**

- The app fetches data directly from the BitView API in real-time
- The only database found is IndexedDB for client-side vault storage (encryption keys)
- All metrics are fetched via `fetchAllMetrics()` function which calls `/api/bitview` route

## Why Some Metrics Might Not Appear in UI

Even though all metrics work at the API level, they might not appear in the UI due to:

1. **Data Filtering:** The `getAxisAssignment` function filters out metrics that:
   - Have no data or empty data arrays
   - Have all NaN values after filtering
   - Have invalid ranges (min === max)
   - Have non-positive ranges (for non-loss metrics)

2. **Default Hidden Traces:** Some metrics are hidden by default based on selected groups

3. **Time Range:** Metrics might have nulls/zeros in the selected time range even if they have data overall

4. **UI Group Selection:** Metrics are organized into groups, and only selected groups are displayed

## Recommendations

Since all metrics are working at the API level, the issue is likely in:

1. **UI Data Processing:** Check if metrics are being filtered out during data processing
2. **Default Visibility:** Verify which metrics are visible by default vs hidden
3. **Time Range Selection:** Some metrics might have data gaps in certain time ranges
4. **Error Handling:** Check browser console for any errors during metric fetching/processing

## Test Files Generated

- `test-metrics-verification.js` - Individual metric testing script
- `test-batch-fetching.js` - Batch fetching simulation script  
- `metric-test-results.json` - Detailed JSON results for all metrics

## Conclusion

**All 31 metrics are working correctly at the API level.** The issue with metrics not appearing in the web app is likely related to:

1. UI filtering logic
2. Default visibility settings
3. Time range selection
4. Data processing/transformation

**No changes to metric names or API URLs are needed** - all metrics are correctly configured.



