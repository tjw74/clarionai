// Central config for all available and derived metrics
// Add new metrics here as needed

// DCA Configuration - central place for all DCA settings
export const DCA_CONFIG = {
  DEFAULT_BUDGET_PER_DAY: 10,
  DEFAULT_WINDOW_SIZE: 1460, // 4 years
  DEFAULT_ZONE_SIZE: 0.25,
  DEFAULT_MAX_BONUS: 1.5, // Reduced from 4.0 to 1.5 for more realistic allocations
  DEFAULT_DAILY_BUDGET_CAP: 60, // Maximum daily spend cap
} as const;

export const METRICS_LIST = [
  'close',
  'realized-price',
  '200d-sma',
  'true-market-mean',
  'vaulted-price',
  'marketcap',
  'realized-cap',
  'adjusted-spent-output-profit-ratio',
  'sell-side-risk-ratio',
  'liveliness',
  'short-term-holders-supply',
  'short-term-holders-utxo-count',
  'short-term-holders-realized-cap',
  'short-term-holders-realized-price-ratio',
  'short-term-holders-realized-profit',
  'short-term-holders-negative-realized-loss',
  'short-term-holders-adjusted-spent-output-profit-ratio',
  'short-term-holders-unrealized-profit',
  'short-term-holders-negative-unrealized-loss',
  'short-term-holders-coinblocks-destroyed',
  // New comprehensive profit/loss metrics
  'long-term-holders-adjusted-spent-output-profit-ratio',
  'realized-profit',
  'negative-realized-loss',
  'net-realized-profit-and-loss',
  'unrealized-profit',
  'negative-unrealized-loss',
  'net-unrealized-profit-and-loss',
  'long-term-holders-realized-cap',
];

// Create a combined list that includes both base and derived metrics
export const ALL_METRICS_LIST = [
  ...METRICS_LIST,
  'sth-market-cap',
  'sth-mvrv-ratio',
];

// Complete mapping of metric keys to user-friendly display names
export const METRIC_DISPLAY_NAMES: Record<string, string> = {
  // Price metrics
  'close': 'Price',
  'realized-price': 'Realized Price',
  '200d-sma': '200d SMA',
  'true-market-mean': 'True Market Mean',
  'vaulted-price': 'Vaulted Price',
  
  // Market cap metrics
  'marketcap': 'Market Cap',
  'realized-cap': 'Network Realized Cap',
  
  // SOPR metrics
  'adjusted-spent-output-profit-ratio': 'Network SOPR',
  'short-term-holders-adjusted-spent-output-profit-ratio': 'STH SOPR',
  'long-term-holders-adjusted-spent-output-profit-ratio': 'LTH SOPR',
  
  // Risk and activity metrics
  'sell-side-risk-ratio': 'Sell-Side Risk',
  'liveliness': 'Liveliness',
  
  // Supply metrics
  'short-term-holders-supply': 'STH Supply',
  'short-term-holders-utxo-count': 'STH UTXO Count',
  
  // Realized P&L metrics
  'realized-profit': 'Network Realized Profit',
  'negative-realized-loss': 'Network Realized Loss',
  'net-realized-profit-and-loss': 'Net Realized P&L',
  'short-term-holders-realized-profit': 'STH Realized Profit',
  'short-term-holders-negative-realized-loss': 'STH Realized Loss',
  
  // Unrealized P&L metrics
  'unrealized-profit': 'Network Unrealized Profit',
  'negative-unrealized-loss': 'Network Unrealized Loss',
  'net-unrealized-profit-and-loss': 'Net Unrealized P&L',
  'short-term-holders-unrealized-profit': 'STH Unrealized Profit',
  'short-term-holders-negative-unrealized-loss': 'STH Unrealized Loss',
  
  // Realized cap metrics
  'short-term-holders-realized-cap': 'STH Realized Cap',
  'long-term-holders-realized-cap': 'LTH Realized Cap',
  
  // Other metrics
  'short-term-holders-realized-price-ratio': 'STH Realized Price Ratio',
  'short-term-holders-coinblocks-destroyed': 'STH Coins Destroyed',
  
  // Derived metrics
  'sth-market-cap': 'STH Market Cap',
  'sth-mvrv-ratio': 'STH MVRV Ratio',
};

// Metric groups configuration
export const METRIC_GROUPS = [
  {
    name: 'Price Models',
    description: 'Core price metrics and models',
    metrics: [
      {
        key: 'close',
        name: 'Price',
        color: '#33B1FF',
        yaxis: 'y2', // Right Y-axis (logarithmic)
        zScore: true,
      },
      {
        key: 'realized-price',
        name: 'Realized Price',
        color: '#00bcd4',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'true-market-mean',
        name: 'True Market Mean',
        color: '#ff9800',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'vaulted-price',
        name: 'Vaulted Price',
        color: '#8bc34a',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: '200d-sma',
        name: '200d SMA',
        color: '#e91e63',
        yaxis: 'y2',
        zScore: true,
      },
    ],
  },
  {
    name: 'Profit & Loss',
    description: 'Comprehensive profit and loss metrics for network and holders',
    metrics: [
      // Network-wide SOPR metrics
      {
        key: 'adjusted-spent-output-profit-ratio',
        name: 'Network SOPR',
        color: '#2196F3',
        yaxis: 'y',
        zScore: true,
      },
      {
        key: 'short-term-holders-adjusted-spent-output-profit-ratio',
        name: 'STH SOPR',
        color: '#03A9F4',
        yaxis: 'y',
        zScore: true,
      },
      {
        key: 'long-term-holders-adjusted-spent-output-profit-ratio',
        name: 'LTH SOPR',
        color: '#00BCD4',
        yaxis: 'y',
        zScore: true,
      },
      // Network-wide realized P&L
      {
        key: 'realized-profit',
        name: 'Network Realized Profit',
        color: '#4CAF50',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'negative-realized-loss',
        name: 'Network Realized Loss',
        color: '#f44336',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'net-realized-profit-and-loss',
        name: 'Net Realized P&L',
        color: '#9C27B0',
        yaxis: 'y2',
        zScore: true,
      },
      // Network-wide unrealized P&L
      {
        key: 'unrealized-profit',
        name: 'Network Unrealized Profit',
        color: '#8BC34A',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'negative-unrealized-loss',
        name: 'Network Unrealized Loss',
        color: '#FF5722',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'net-unrealized-profit-and-loss',
        name: 'Net Unrealized P&L',
        color: '#795548',
        yaxis: 'y2',
        zScore: true,
      },
      // STH specific metrics
      {
        key: 'short-term-holders-realized-profit',
        name: 'STH Realized Profit',
        color: '#4CAF50',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'short-term-holders-negative-realized-loss',
        name: 'STH Realized Loss',
        color: '#f44336',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'short-term-holders-unrealized-profit',
        name: 'STH Unrealized Profit',
        color: '#8BC34A',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'short-term-holders-negative-unrealized-loss',
        name: 'STH Unrealized Loss',
        color: '#FF5722',
        yaxis: 'y2',
        zScore: true,
      },
      // Realized cap metrics
      {
        key: 'realized-cap',
        name: 'Network Realized Cap',
        color: '#607D8B',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'short-term-holders-realized-cap',
        name: 'STH Realized Cap',
        color: '#795548',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'long-term-holders-realized-cap',
        name: 'LTH Realized Cap',
        color: '#9E9E9E',
        yaxis: 'y2',
        zScore: true,
      },
    ],
  },
  {
    name: 'Network Activity',
    description: 'Network and on-chain activity metrics',
    metrics: [
      {
        key: 'liveliness',
        name: 'Liveliness',
        color: '#2196F3',
        yaxis: 'y',
        zScore: true,
      },
      {
        key: 'short-term-holders-supply',
        name: 'STH Supply',
        color: '#FF9800',
        yaxis: 'y2',
        zScore: true,
      },
      {
        key: 'short-term-holders-utxo-count',
        name: 'STH UTXO Count',
        color: '#607D8B',
        yaxis: 'y',
        zScore: true,
      },
      {
        key: 'sell-side-risk-ratio',
        name: 'Sell-Side Risk',
        color: '#E91E63',
        yaxis: 'y',
        zScore: true,
      },
      {
        key: 'short-term-holders-coinblocks-destroyed',
        name: 'STH Coins Destroyed',
        color: '#795548',
        yaxis: 'y',
        zScore: true,
      },
    ],
  },
];

// Derived metrics with formulas
export const DERIVED_METRICS = [
  {
    name: 'MVRV Ratio',
    formula: (metrics: Record<string, number[]>) => {
      const mc = metrics['marketcap'];
      const rc = metrics['realized-cap'];
      if (!mc || !rc || mc.length !== rc.length) return [];
      return mc.map((v, i) => {
        if (typeof v !== 'number' || typeof rc[i] !== 'number' || isNaN(v) || isNaN(rc[i]) || rc[i] === 0) {
          return NaN;
        }
        return v / rc[i];
      });
    },
  },
  {
    name: 'Mayer Multiple',
    formula: (metrics: Record<string, number[]>) => {
      const price = metrics['close'];
      const sma = metrics['200d-sma'];
      if (!price || !sma || price.length !== sma.length) return [];
      return price.map((v, i) => {
        if (typeof v !== 'number' || typeof sma[i] !== 'number' || isNaN(v) || isNaN(sma[i]) || sma[i] === 0) {
          return NaN;
        }
        return v / sma[i];
      });
    },
  },
  {
    name: 'STH Market Cap',
    formula: (metrics: Record<string, number[]>) => {
      const sthSupply = metrics['short-term-holders-supply'];
      const price = metrics['close'];
      if (!sthSupply || !price || sthSupply.length !== price.length) return [];
      return sthSupply.map((supply, i) => {
        if (typeof supply !== 'number' || typeof price[i] !== 'number' || isNaN(supply) || isNaN(price[i])) {
          return NaN;
        }
        return supply * price[i];
      });
    },
  },
  {
    name: 'STH MVRV Ratio',
    formula: (metrics: Record<string, number[]>) => {
      const sthMarketCap = metrics['short-term-holders-supply']?.map((supply, i) => {
        const price = metrics['close']?.[i];
        if (typeof supply !== 'number' || typeof price !== 'number' || isNaN(supply) || isNaN(price)) {
          return NaN;
        }
        return supply * price;
      }) || [];
      const sthRealizedCap = metrics['short-term-holders-realized-cap'];
      if (!sthMarketCap || !sthRealizedCap || sthMarketCap.length !== sthRealizedCap.length) return [];
      return sthMarketCap.map((marketCap, i) => {
        if (typeof marketCap !== 'number' || typeof sthRealizedCap[i] !== 'number' || isNaN(marketCap) || isNaN(sthRealizedCap[i]) || sthRealizedCap[i] === 0) {
          return NaN;
        }
        return marketCap / sthRealizedCap[i];
      });
    },
  },
]; 

// Metric correlation with Bitcoin price
// TRUE = positive correlation (higher = more expensive)
// FALSE = negative correlation (higher = cheaper)
export const METRIC_CORRELATION: Record<string, boolean> = {
  // POSITIVE CORRELATION (higher = more expensive)
  'close': true,
  'realized-price': true,
  '200d-sma': true,
  'true-market-mean': true,
  'vaulted-price': true,
  'marketcap': true,
  'realized-cap': true,
  'adjusted-spent-output-profit-ratio': true,
  'short-term-holders-adjusted-spent-output-profit-ratio': true,
  'long-term-holders-adjusted-spent-output-profit-ratio': true,
  'realized-profit': true,
  'unrealized-profit': true,
  'short-term-holders-realized-profit': true,
  'short-term-holders-unrealized-profit': true,
  'long-term-holders-realized-cap': true,
  'short-term-holders-realized-price-ratio': true,
  'short-term-holders-supply': true,
  'short-term-holders-utxo-count': true,
  'short-term-holders-realized-cap': true,
  'sth-market-cap': true,
  'sth-mvrv-ratio': true,
  
  // NEGATIVE CORRELATION (higher = cheaper)
  'negative-realized-loss': false,
  'negative-unrealized-loss': false,
  'short-term-holders-negative-realized-loss': false,
  'short-term-holders-negative-unrealized-loss': false,
  'sell-side-risk-ratio': false,
  'liveliness': false,
  'short-term-holders-coinblocks-destroyed': false,
  
  // NEUTRAL (depends on sign)
  'net-realized-profit-and-loss': true, // Treat as positive for now
  'net-unrealized-profit-and-loss': true, // Treat as positive for now
}; 