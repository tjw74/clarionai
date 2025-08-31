# Bitcoin Research Kit API

## Base URL
- Default: https://bitview.space

## Endpoints

### Query Multiple Metrics
```bash
curl "https://bitview.space/api/vecs/query?index=dateindex&ids=date,close,realized-price,marketcap&format=json"
```

### Query with Date Range
```bash
curl "https://bitview.space/api/vecs/query?index=dateindex&ids=date,close,realized-price&from=-100&format=json"
```

**Response format:**
```json
[
  ["2009-01-03", "2009-01-04", ...],  // dates (row 0)
  [0, 0, ...],                        // close prices (row 1)  
  [0, 0, ...],                        // realized prices (row 2)
  [0, 0, ...]                         // marketcap (row 3)
]
```

**Key benefits:**
- Row 0 = dates, rows 1+ = metrics in requested order
- Perfect alignment guaranteed across all metrics
- Single API call for multiple metrics
- No `from` parameter = full history
- Add any metrics to `ids=` comma-separated

### Get Available Metric IDs
```bash
curl "https://bitview.space/api/vecs/ids"
```

Common metrics: `close`, `realized-price`, `marketcap`, `realized-cap`, `200d-sma`, `true-market-mean`, `vaulted-price`, `liveliness`, etc.

### Get Recent Data
```bash
curl "https://bitview.space/api/vecs/dateindex-to-close?from=-10"
```

### Get Recent Dates
```bash
curl "https://bitview.space/api/vecs/dateindex-to-date?from=-10"
```

**Note:** Use `/api/vecs/query` for multiple metrics to ensure perfect alignment. 