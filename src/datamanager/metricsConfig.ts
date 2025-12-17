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
  // New comprehensive profit/loss metrics
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

// Create a combined list that includes both base and derived metrics
export const ALL_METRICS_LIST = [
  ...METRICS_LIST,
  'sth-market-cap',
  'sth-mvrv-ratio',
  'mvrv-ratio-delta-30d',
  'mvrv-ratio-delta-90d',
  'mvrv-ratio-delta-155d',
  'mvrv-ratio-delta-180d',
];

// Metric scale types for axis assignment
export const METRIC_SCALE_TYPES = {
  USD_LARGE: ['market_cap', 'realized_cap'], // Billions/Trillions - Log scale
  USD_PRICE: ['price_close', 'price_high', 'realized_price', 'price_200d_sma', 'true_market_mean', 'vaulted_price', 'sth_realized_price'], // Thousands - Log scale
  RATIO: ['mvrv-ratio', 'adjusted_sopr', 'sell_side_risk_ratio'], // 0-10 range - Linear scale
  Z_SCORE: ['*_z'], // -3 to +3 range - Linear scale
  PERCENTAGE: ['liveliness'], // 0-100% - Linear scale
  COUNT: ['sth_utxo_count'], // Large integers - Log scale
  SUPPLY: ['sth_supply', 'lth_supply'], // Supply metrics - Large numbers - Log scale
  USD_LOSS: ['sth_neg_realized_loss', 'sth_neg_unrealized_loss', 'neg_realized_loss', 'neg_unrealized_loss'], // Loss metrics - can be negative - Linear scale
} as const;

// Complete mapping of metric keys to user-friendly display names
export const METRIC_DISPLAY_NAMES: Record<string, string> = {
  // Price metrics
  'price_close': 'Price',
  'price_high': 'Price High',
  'realized_price': 'Realized Price',
  'price_200d_sma': '200d SMA',
  'true_market_mean': 'True Market Mean',
  'vaulted_price': 'Vaulted Price',
  'sth_realized_price': 'STH Realized Price',
  
  // Market cap metrics
  'market_cap': 'Market Cap',
  'realized_cap': 'Network Realized Cap',
  
  // SOPR metrics
  'adjusted_sopr': 'Network SOPR',
  'sth_sopr': 'STH SOPR',
  'lth_sopr': 'LTH SOPR',
  
  // Risk and activity metrics
  'sell_side_risk_ratio': 'Sell-Side Risk',
  'liveliness': 'Liveliness',
  
  // Supply metrics
  'sth_supply': 'STH Supply',
  'lth_supply': 'LTH Supply',
  'sth_utxo_count': 'STH UTXO Count',
  
  // Realized P&L metrics
  'realized_profit': 'Network Realized Profit',
  'neg_realized_loss': 'Network Realized Loss',
  'net_realized_pnl': 'Net Realized P&L',
  'sth_realized_profit': 'STH Realized Profit',
  'sth_neg_realized_loss': 'STH Realized Loss',
  
  // Unrealized P&L metrics
  'unrealized_profit': 'Network Unrealized Profit',
  'neg_unrealized_loss': 'Network Unrealized Loss',
  'net_unrealized_pnl': 'Net Unrealized P&L',
  'sth_unrealized_profit': 'STH Unrealized Profit',
  'sth_neg_unrealized_loss': 'STH Unrealized Loss',
  
  // Realized cap metrics
  'sth_realized_cap': 'STH Realized Cap',
  'lth_realized_cap': 'LTH Realized Cap',
  
  // Other metrics
  'sth_realized_price_ratio': 'STH Realized Price Ratio',
  'coinblocks_destroyed': 'STH Coins Destroyed',
  
  // Derived metrics
  'sth_market_cap': 'STH Market Cap',
  'sth_mvrv_ratio': 'STH MVRV Ratio',
  'mvrv-ratio': 'MVRV Ratio',
  'mvrv-ratio-delta-30d': 'MVRV Delta 30d',
  'mvrv-ratio-delta-90d': 'MVRV Delta 90d',
  'mvrv-ratio-delta-155d': 'MVRV Delta 155d',
  'mvrv-ratio-delta-180d': 'MVRV Delta 180d',
};

// Metric groups configuration
export const METRIC_GROUPS = [
  {
    name: 'Price Models',
    description: 'Core price metrics and models',
    metrics: [
      {
        key: 'price_close',
        name: 'Price',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_realized_price',
        name: 'STH Realized Price',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'realized_price',
        name: 'Realized Price',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'true_market_mean',
        name: 'True Market Mean',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'vaulted_price',
        name: 'Vaulted Price',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'price_200d_sma',
        name: '200d SMA',
        yaxis: 'y2',
        zScore: false,
      },

    ],
  },
  {
    name: 'MVRV Ratio',
    description: 'Market cap, realized cap, and their ratio',
    metrics: [
      {
        key: 'market_cap',
        name: 'Market Cap',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'realized_cap',
        name: 'Network Realized Cap',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'mvrv-ratio',
        name: 'MVRV Ratio',
        yaxis: 'y2',
        zScore: false,
      },
    ],
  },
  {
    name: 'STH Metrics',
    description: 'Short-Term Holder metrics and analysis',
    metrics: [
      {
        key: 'sth_realized_price',
        name: 'STH Realized Price',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_supply',
        name: 'STH Supply',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_utxo_count',
        name: 'STH UTXO Count',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_realized_cap',
        name: 'STH Realized Cap',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_realized_price_ratio',
        name: 'STH Realized Price Ratio',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_realized_profit',
        name: 'STH Realized Profit',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_neg_realized_loss',
        name: 'STH Realized Loss',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_sopr',
        name: 'STH SOPR',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_unrealized_profit',
        name: 'STH Unrealized Profit',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'sth_neg_unrealized_loss',
        name: 'STH Unrealized Loss',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'coinblocks_destroyed',
        name: 'STH Coins Destroyed',
        yaxis: 'y2',
        zScore: false,
      },
    ],
  },
  {
    name: 'LTH Metrics',
    description: 'Long-Term Holder metrics and analysis',
    metrics: [
      {
        key: 'lth_sopr',
        name: 'LTH SOPR',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'lth_supply',
        name: 'LTH Supply',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'lth_realized_cap',
        name: 'LTH Realized Cap',
        yaxis: 'y2',
        zScore: false,
      },
    ],
  },
  {
    name: 'Network Metrics',
    description: 'Network-wide profit/loss and activity metrics',
    metrics: [
      {
        key: 'adjusted_sopr',
        name: 'Network SOPR',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'realized_profit',
        name: 'Network Realized Profit',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'neg_realized_loss',
        name: 'Network Realized Loss',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'net_realized_pnl',
        name: 'Net Realized P&L',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'unrealized_profit',
        name: 'Network Unrealized Profit',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'neg_unrealized_loss',
        name: 'Network Unrealized Loss',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'net_unrealized_pnl',
        name: 'Net Unrealized P&L',
        yaxis: 'y2',
        zScore: false,
      },
    ],
  },
  {
    name: 'Risk & Activity',
    description: 'Risk ratios and network activity metrics',
    metrics: [
      {
        key: 'sell_side_risk_ratio',
        name: 'Sell-Side Risk',
        yaxis: 'y2',
        zScore: false,
      },
      {
        key: 'liveliness',
        name: 'Liveliness',
        yaxis: 'y2',
        zScore: false,
      },
    ],
  },
];

// Derived metrics with formulas
export const DERIVED_METRICS = [
  {
    name: 'mvrv-ratio',
    formula: (metrics: Record<string, number[]>) => {
      const mc = metrics['market_cap'];
      const rc = metrics['realized_cap'];
      console.log('MVRV calculation inputs:', {
        market_cap: mc ? mc.length : 0,
        realizedCap: rc ? rc.length : 0,
        market_capSample: mc ? mc.slice(-5) : [],
        realizedCapSample: rc ? rc.slice(-5) : []
      });
      if (!mc || !rc || mc.length !== rc.length) {
        console.warn('MVRV calculation failed: missing or mismatched data');
        return [];
      }
      const result = mc.map((v, i) => {
        if (typeof v !== 'number' || typeof rc[i] !== 'number' || isNaN(v) || isNaN(rc[i]) || rc[i] === 0) {
          return NaN;
        }
        return v / rc[i];
      });
      console.log('MVRV calculation result:', {
        length: result.length,
        sample: result.slice(0, 5),
        validCount: result.filter(r => !isNaN(r)).length
      });
      return result;
    },
  },
  {
    name: 'Mayer Multiple',
    formula: (metrics: Record<string, number[]>) => {
      const price = metrics['price_close'];
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
      const sthSupply = metrics['sth_supply'];
      const price = metrics['price_close'];
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
      const sthMarketCap = metrics['sth_supply']?.map((supply, i) => {
        const price = metrics['price_close']?.[i];
        if (typeof supply !== 'number' || typeof price !== 'number' || isNaN(supply) || isNaN(price)) {
          return NaN;
        }
        return supply * price;
      }) || [];
      const sthRealizedCap = metrics['sth_realized_cap'];
      if (!sthMarketCap || !sthRealizedCap || sthMarketCap.length !== sthRealizedCap.length) return [];
      return sthMarketCap.map((marketCap, i) => {
        if (typeof marketCap !== 'number' || typeof sthRealizedCap[i] !== 'number' || isNaN(marketCap) || isNaN(sthRealizedCap[i]) || sthRealizedCap[i] === 0) {
          return NaN;
        }
        return marketCap / sthRealizedCap[i];
      });
    },
  },
  {
    name: 'mvrv-ratio-delta-30d',
    formula: (metrics: Record<string, number[]>) => {
      const mvrv = metrics['mvrv-ratio'];
      if (!mvrv || mvrv.length === 0) return [];
      return mvrv.map((v, i) => {
        if (i < 30 || typeof v !== 'number' || isNaN(v)) return NaN;
        const past = mvrv[i - 30];
        if (typeof past !== 'number' || isNaN(past) || past === 0) return NaN;
        return ((v - past) / past) * 100; // percentage change
      });
    },
  },
  {
    name: 'mvrv-ratio-delta-90d',
    formula: (metrics: Record<string, number[]>) => {
      const mvrv = metrics['mvrv-ratio'];
      if (!mvrv || mvrv.length === 0) return [];
      return mvrv.map((v, i) => {
        if (i < 90 || typeof v !== 'number' || isNaN(v)) return NaN;
        const past = mvrv[i - 90];
        if (typeof past !== 'number' || isNaN(past) || past === 0) return NaN;
        return ((v - past) / past) * 100; // percentage change
      });
    },
  },
  {
    name: 'mvrv-ratio-delta-155d',
    formula: (metrics: Record<string, number[]>) => {
      const mvrv = metrics['mvrv-ratio'];
      if (!mvrv || mvrv.length === 0) return [];
      return mvrv.map((v, i) => {
        if (i < 155 || typeof v !== 'number' || isNaN(v)) return NaN;
        const past = mvrv[i - 155];
        if (typeof past !== 'number' || isNaN(past) || past === 0) return NaN;
        return ((v - past) / past) * 100; // percentage change
      });
    },
  },
  {
    name: 'mvrv-ratio-delta-180d',
    formula: (metrics: Record<string, number[]>) => {
      const mvrv = metrics['mvrv-ratio'];
      if (!mvrv || mvrv.length === 0) return [];
      return mvrv.map((v, i) => {
        if (i < 180 || typeof v !== 'number' || isNaN(v)) return NaN;
        const past = mvrv[i - 180];
        if (typeof past !== 'number' || isNaN(past) || past === 0) return NaN;
        return ((v - past) / past) * 100; // percentage change
      });
    },
  },
]; 

// Metric correlation with Bitcoin price
// TRUE = positive correlation (higher = more expensive)
// FALSE = negative correlation (higher = cheaper)
export const METRIC_CORRELATION: Record<string, boolean> = {
  // POSITIVE CORRELATION (higher = more expensive)
  'price_close': true,
  'price_high': true,
  'realized_price': true,
  'price_200d_sma': true,
  'true_market_mean': true,
  'vaulted_price': true,
  'market_cap': true,
  'realized_cap': true,
  'adjusted_sopr': true,
  'sth_sopr': true,
  'lth_sopr': true,
  'realized_profit': true,
  'unrealized_profit': true,
  'sth_realized_profit': true,
  'sth_unrealized_profit': true,
  'lth_realized_cap': true,
  'sth_realized_price_ratio': true,
  'sth_supply': true,
  'lth_supply': true,
  'sth_utxo_count': true,
  'sth_realized_cap': true,
  'sth_market_cap': true,
  'sth_mvrv_ratio': true,
  
  // NEGATIVE CORRELATION (higher = cheaper)
  'neg_realized_loss': false,
  'neg_unrealized_loss': false,
  'sth_neg_realized_loss': false,
  'sth_neg_unrealized_loss': false,
  'sell_side_risk_ratio': false,
  'liveliness': false,
  'coinblocks_destroyed': false,
  
  // NEUTRAL (depends on sign)
  'net_realized_pnl': true, // Treat as positive for now
  'net_unrealized_pnl': true, // Treat as positive for now
}; 