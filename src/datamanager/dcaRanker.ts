import { calculateRegularDCA, calculateTunedDCA, dcaModels } from './dca';
import { calculateZScores } from './zScore';
import { METRICS_LIST, METRIC_DISPLAY_NAMES, DCA_CONFIG } from './metricsConfig';
import { logZoneInfo, createZones, calculateZoneAllocations } from './models/zoneBased';

export interface DCARankingResult {
  metricKey: string;
  metricName: string;
  modelName: string;
  totalBTC: number;
  totalSpent: number;
  currentValue: number;
  profit: number;
  profitPercentage: number;
  avgPrice: number;
  finalPrice: number;
  performance: 'outperform' | 'underperform' | 'neutral';
  // Daily data for charting
  dailyAllocations: number[];
  btcBought: number[];
  dates: string[];
  prices: number[];
  metricValues: number[];
  zScores: number[];
}

export interface DCARankingConfig {
  budgetPerDay: number;
  windowSize: number;
  zoneSize: number;
  dailyBudgetCap: number; // Added daily budget cap
}

// Calculate profitability for a single metric + model combination
function calculateMetricModelProfitability(
  metricData: number[],
  priceData: number[],
  metricKey: string,
  modelName: string,
  config: DCARankingConfig
): DCARankingResult | null {
  try {
    const { budgetPerDay, windowSize, zoneSize, dailyBudgetCap } = config;
    
    // FIX 1: Eliminate look-ahead bias - calculate z-scores only on windowed data
    const windowedMetricData = windowSize === Infinity ? metricData : metricData.slice(-windowSize);
    const windowedPriceData = windowSize === Infinity ? priceData : priceData.slice(-windowSize);
    
    // Use fixed window z-scores (not rolling) to ensure consistent patterns
    const zScores = calculateZScores(windowedMetricData, windowSize);
    
    // Get the model function
    const model = dcaModels[modelName as keyof typeof dcaModels];
    if (!model) return null;
    
    // Calculate DCA results using windowed data for consistency
    let btcBought: number[];
    let dailyAllocations: number[];
    
    // Use zone-based model with zoneSize, maxBonus, dailyBudgetCap, and metricKey parameters
    const result = calculateTunedDCA(
      windowedPriceData,
      zScores,
      budgetPerDay,
      windowSize,
      dcaModels.zoneBased, // Use zone-based model directly
      dailyBudgetCap, // Pass daily budget cap first
      zoneSize,
      DCA_CONFIG.DEFAULT_MAX_BONUS,
      metricKey // Pass metric key for correlation handling
    );
    btcBought = result.btcBought;
    dailyAllocations = result.dailyAllocations;
    

    
    // FIX 2: Calculate accurate performance metrics
    const totalBTC = btcBought.reduce((sum, btc) => sum + btc, 0);
    
    // Use the daily allocations that were actually used to calculate btcBought
    const totalSpent = dailyAllocations.reduce((sum, allocation) => sum + allocation, 0);
    
    // Validation: Ensure btcBought and dailyAllocations have the same length
    if (btcBought.length !== dailyAllocations.length) {
      console.error(`Length mismatch for ${metricKey} + ${modelName}:`, {
        btcBoughtLength: btcBought.length,
        dailyAllocationsLength: dailyAllocations.length
      });
      return null;
    }
    

    

    
    const finalPrice = windowedPriceData[windowedPriceData.length - 1];
    const currentValue = totalBTC * finalPrice;
    const profit = currentValue - totalSpent;
    const profitPercentage = totalSpent > 0 ? (profit / totalSpent) * 100 : 0;
    const avgPrice = totalBTC > 0 ? totalSpent / totalBTC : 0;


    

    
    // Determine performance category
    let performance: 'outperform' | 'underperform' | 'neutral';
    if (profitPercentage > 5) {
      performance = 'outperform';
    } else if (profitPercentage < -5) {
      performance = 'underperform';
    } else {
      performance = 'neutral';
    }
    
          return {
        metricKey,
        metricName: METRIC_DISPLAY_NAMES[metricKey] || metricKey,
        modelName,
        totalBTC,
        totalSpent,
        currentValue,
        profit,
        profitPercentage,
        avgPrice,
        finalPrice,
        performance,
        // Add daily data for charting
        dailyAllocations,
        btcBought,
        dates: windowedPriceData.map((_, i) => {
          // Generate dates for the windowed period
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - windowedPriceData.length + i);
          return startDate.toISOString().split('T')[0];
        }),
        prices: windowedPriceData,
        metricValues: windowedMetricData,
        zScores: zScores,
      };
  } catch (error) {
    console.error(`Error calculating profitability for ${metricKey} + ${modelName}:`, error);
    return null;
  }
}

// Calculate regular DCA baseline for comparison
function calculateRegularDCABaseline(
  priceData: number[],
  config: DCARankingConfig
): DCARankingResult {
  const { budgetPerDay, windowSize } = config;
  
  // Use windowed price data for consistency with tuned DCA
  const windowedPriceData = windowSize === Infinity ? priceData : priceData.slice(-windowSize);
  
  // Calculate regular DCA using the same windowed data
  const btcBought = calculateRegularDCA(windowedPriceData, budgetPerDay, windowSize);
  const totalBTC = btcBought.reduce((sum, btc) => sum + btc, 0);
  
  // Regular DCA invests budgetPerDay every day for the entire window
  const actualWindowSize = windowedPriceData.length;
  const totalSpent = budgetPerDay * actualWindowSize;
  
  const finalPrice = windowedPriceData[windowedPriceData.length - 1];
  const currentValue = totalBTC * finalPrice;
  const profit = currentValue - totalSpent;
  const profitPercentage = totalSpent > 0 ? (profit / totalSpent) * 100 : 0;
  const avgPrice = totalBTC > 0 ? totalSpent / totalBTC : 0;
  
  console.log('Regular DCA calculation:', {
    windowedPriceDataLength: windowedPriceData.length,
    totalBTC,
    totalSpent,
    currentValue,
    profit,
    profitPercentage,
    avgPrice,
    finalPrice,
    firstPrice: windowedPriceData[0],
    lastPrice: windowedPriceData[windowedPriceData.length - 1]
  });
  
  // Generate daily data for regular DCA
  const regularDailyAllocations = new Array(windowedPriceData.length).fill(budgetPerDay);
  const regularBtcBought = windowedPriceData.map(price => budgetPerDay / price);
  const regularDates = windowedPriceData.map((_, i) => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - windowedPriceData.length + i);
    return startDate.toISOString().split('T')[0];
  });

  return {
    metricKey: 'regular-dca',
    metricName: 'Regular DCA',
    modelName: 'baseline',
    totalBTC,
    totalSpent,
    currentValue,
    profit,
    profitPercentage,
    avgPrice,
    finalPrice,
    performance: profitPercentage > 0 ? 'outperform' : 'underperform',
    // Daily data for charting
    dailyAllocations: regularDailyAllocations,
    btcBought: regularBtcBought,
    dates: regularDates,
    prices: windowedPriceData,
    metricValues: [], // Regular DCA doesn't use metrics
    zScores: [], // Regular DCA doesn't use z-scores
  };
}

// Main function to generate DCA rankings
export function generateDCARankings(
  metricsData: Record<string, number[]>,
  priceData: number[],
  config: DCARankingConfig
): DCARankingResult[] {
  const { budgetPerDay, windowSize, zoneSize, dailyBudgetCap } = config;
  const results: DCARankingResult[] = [];
  
  // Validate input data
  if (!priceData || priceData.length === 0) {
    console.error('No price data available for DCA calculations');
    return results;
  }
  
  console.log('DCA Ranking Debug Info:', {
    priceDataLength: priceData.length,
    metricsCount: Object.keys(metricsData).length,
    config: config,
    firstPrice: priceData[0],
    lastPrice: priceData[priceData.length - 1]
  });
  
  // Add regular DCA baseline
  const baseline = calculateRegularDCABaseline(priceData, config);
  results.push(baseline);
  
  console.log('Regular DCA Baseline:', {
    totalBTC: baseline.totalBTC,
    totalSpent: baseline.totalSpent,
    profitPercentage: baseline.profitPercentage
  });
  
  // Calculate rankings for each metric + model combination
  for (const metricKey of METRICS_LIST) {
    const metricData = metricsData[metricKey];
    if (!metricData || metricData.length === 0) {
      console.warn(`No data for metric: ${metricKey}`);
      continue;
    }
    
    // Validate metric data alignment
    if (metricData.length !== priceData.length) {
      console.error(`Data length mismatch for ${metricKey}:`, {
        metricLength: metricData.length,
        priceLength: priceData.length
      });
      continue;
    }
    
    // Test each available model
    for (const modelName of Object.keys(dcaModels)) {
      const result = calculateMetricModelProfitability(
        metricData,
        priceData,
        metricKey,
        modelName,
        config
      );
      
      if (result) {
        results.push(result);
      } else {
        console.warn(`Failed to calculate profitability for ${metricKey} + ${modelName}`);
      }
    }
  }
  
  console.log(`Generated ${results.length} DCA ranking results`);
  
  // Sort by profit percentage (descending)
  return results.sort((a, b) => b.profitPercentage - a.profitPercentage);
}

// Get top performing combinations
export function getTopPerformers(
  rankings: DCARankingResult[],
  count: number = 10
): DCARankingResult[] {
  return rankings.slice(0, count);
}

// Get performance statistics
export function getPerformanceStats(rankings: DCARankingResult[]) {
  const outperform = rankings.filter(r => r.performance === 'outperform').length;
  const underperform = rankings.filter(r => r.performance === 'underperform').length;
  const neutral = rankings.filter(r => r.performance === 'neutral').length;
  
  return {
    total: rankings.length,
    outperform,
    underperform,
    neutral,
    outperformPercentage: (outperform / rankings.length) * 100,
    avgProfitPercentage: rankings.reduce((sum, r) => sum + r.profitPercentage, 0) / rankings.length,
  };
} 