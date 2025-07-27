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
}

export interface DCARankingConfig {
  budgetPerDay: number;
  windowSize: number;
  temperature: number;
  zoneSize: number;
  startDate?: string;
  endDate?: string;
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
    const { budgetPerDay, windowSize, temperature, zoneSize } = config;
    
    // FIX 1: Eliminate look-ahead bias - calculate z-scores only on windowed data
    const windowedMetricData = windowSize === Infinity ? metricData : metricData.slice(-windowSize);
    const windowedPriceData = windowSize === Infinity ? priceData : priceData.slice(-windowSize);
    const zScores = calculateZScores(windowedMetricData, windowSize);
    
    // Get the model function
    const model = dcaModels[modelName as keyof typeof dcaModels];
    if (!model) return null;
    
    // Calculate DCA results using windowed data for consistency
    let btcBought: number[];
    
    if (modelName === 'zoneBased') {
      // Use zone-based model with zoneSize and maxBonus parameters
      btcBought = calculateTunedDCA(
        windowedPriceData,
        zScores,
        budgetPerDay,
        windowSize,
        model,
        zoneSize,
        DCA_CONFIG.DEFAULT_MAX_BONUS
      );
      
      // Debug zone information for first few metrics
      if (metricKey === 'close' || metricKey === 'realized-price') {
        const zones = createZones(zScores, zoneSize);
        const zoneAllocations = calculateZoneAllocations(zones, 1.0);
        console.log(`Zone info for ${metricKey}:`);
        logZoneInfo(zones, zoneAllocations);
      }
    } else {
      // Use legacy models with temperature parameter
      btcBought = calculateTunedDCA(
        windowedPriceData,
        zScores,
        budgetPerDay,
        windowSize,
        model,
        temperature
      );
    }
    
    // FIX 2: Calculate accurate performance metrics
    const totalBTC = btcBought.reduce((sum, btc) => sum + btc, 0);
    
    // FIX: Use actual window size for total spent calculation
    // The total spent should be the sum of all daily allocations, not budgetPerDay * days
    const totalSpent = btcBought.reduce((sum, btc, i) => {
      const price = windowedPriceData[i];
      if (price > 0 && !isNaN(price)) {
        return sum + (btc * price); // Convert BTC back to dollars spent
      }
      return sum;
    }, 0);
    
    const finalPrice = windowedPriceData[windowedPriceData.length - 1];
    const currentValue = totalBTC * finalPrice;
    const profit = currentValue - totalSpent;
    const profitPercentage = totalSpent > 0 ? (profit / totalSpent) * 100 : 0;
    const avgPrice = totalBTC > 0 ? totalSpent / totalBTC : 0;
    
    // Debug logging for suspicious results
    if (Math.abs(profitPercentage) > 90) {
      console.log(`Suspicious result for ${metricKey} + ${modelName}:`, {
        totalBTC,
        totalSpent,
        currentValue,
        profit,
        profitPercentage,
        avgPrice,
        finalPrice,
        actualInvestmentDays: btcBought.filter(btc => btc > 0).length, // Use actual investment days
        windowedPriceDataLength: windowedPriceData.length,
        btcBoughtSample: btcBought.slice(0, 5),
        zScoresSample: zScores.slice(0, 5)
      });
    }
    
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
  
  const btcBought = calculateRegularDCA(windowedPriceData, budgetPerDay, windowSize);
  const totalBTC = btcBought.reduce((sum, btc) => sum + btc, 0);
  
  // FIX: Use actual window size for total spent, not counting non-zero days
  // Regular DCA invests every day, so totalSpent = budgetPerDay * windowSize
  const actualWindowSize = windowedPriceData.length;
  const totalSpent = budgetPerDay * actualWindowSize;
  
  const finalPrice = windowedPriceData[windowedPriceData.length - 1];
  const currentValue = totalBTC * finalPrice;
  const profit = currentValue - totalSpent;
  const profitPercentage = totalSpent > 0 ? (profit / totalSpent) * 100 : 0;
  const avgPrice = totalBTC > 0 ? totalSpent / totalBTC : 0;
  
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
  };
}

// Main function to generate DCA rankings
export function generateDCARankings(
  metricsData: Record<string, number[]>,
  priceData: number[],
  config: DCARankingConfig
): DCARankingResult[] {
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