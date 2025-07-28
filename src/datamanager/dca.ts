// DCA module: regular DCA and tuned DCA

import { zoneBasedAllocation } from './models/zoneBased';

// Regular DCA calculation
export function calculateRegularDCA(
  priceData: number[],
  budgetPerDay: number,
  windowSize: number
): number[] {
  // Only consider the last windowSize days
  const data = windowSize === Infinity ? priceData : priceData.slice(-windowSize);
  const dailyBuy = budgetPerDay;
  const btcBought = data.map((price) => (price > 0 ? dailyBuy / price : 0));
  return btcBought;
}

// Zone-based model for allocation multipliers
export function zoneBasedModel(
  zScores: number[], 
  zoneSize: number = 0.25, 
  maxBonus: number = 5.0,
  dailyBudgetCap: number = 60,
  metricKey?: string
): number[] {
  return zoneBasedAllocation(zScores, zoneSize, 1.0, maxBonus, dailyBudgetCap, metricKey);
}

// Tuned DCA calculation
export function calculateTunedDCA(
  priceData: number[],
  zScores: number[],
  budgetPerDay: number,
  windowSize: number,
  model: (zScores: number[], ...args: any[]) => number[],
  dailyBudgetCap: number = 60,
  ...modelArgs: any[]
): { btcBought: number[], dailyAllocations: number[] } {
  // Only consider the last windowSize days
  const data = windowSize === Infinity ? priceData : priceData.slice(-windowSize);
  const z = windowSize === Infinity ? zScores : zScores.slice(-windowSize);
  
  // Validate data alignment
  if (data.length !== z.length) {
    console.error('Data length mismatch:', { dataLength: data.length, zLength: z.length });
    return { btcBought: [], dailyAllocations: [] };
  }
  
  // Get allocation multipliers from model
  const multipliers = model(z, ...modelArgs);
  
  // Validate multipliers array
  if (multipliers.length !== data.length) {
    console.error('Multipliers length mismatch:', { multipliersLength: multipliers.length, dataLength: data.length });
    return { btcBought: [], dailyAllocations: [] };
  }
  
  // Calculate daily allocations: baseline budget * multiplier
  const dailyAllocations = multipliers.map(m => m * budgetPerDay);
  
  // Apply daily budget cap
  const cappedDailyAllocations = dailyAllocations.map(allocation => 
    Math.min(allocation, dailyBudgetCap)
  );
  
  // Calculate BTC bought each day
  const btcBought = data.map((price, i) => {
    if (price <= 0 || isNaN(price)) return 0;
    return cappedDailyAllocations[i] / price;
  });
  
  return { btcBought, dailyAllocations: cappedDailyAllocations };
}

// Available models
export const dcaModels = {
  zoneBased: zoneBasedModel,
};

// Run all models and return their results
export function getAllTunedDCAResults(
  priceData: number[],
  zScores: number[],
  budgetPerDay: number,
  windowSize: number,
  modelArgs: any[] = []
): Record<string, { btcBought: number[], dailyAllocations: number[] }> {
  const results: Record<string, { btcBought: number[], dailyAllocations: number[] }> = {};
  for (const [name, model] of Object.entries(dcaModels)) {
    results[name] = calculateTunedDCA(priceData, zScores, budgetPerDay, windowSize, model, ...modelArgs);
  }
  return results;
} 