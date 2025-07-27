// DCA module: regular DCA, tuned DCA, and models

import { softmax } from './models/softmax';
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

// Softmax model for allocation weights (legacy)
export function softmaxModel(zScores: number[], temperature: number = 1.0): number[] {
  return softmax(zScores, temperature);
}

// Zone-based model for allocation multipliers
export function zoneBasedModel(zScores: number[], zoneSize: number = 0.25, maxBonus: number = 5.0): number[] {
  return zoneBasedAllocation(zScores, zoneSize, 1.0, maxBonus);
}

// Tuned DCA calculation using a model (e.g., softmax or zone-based)
export function calculateTunedDCA(
  priceData: number[],
  zScores: number[],
  budgetPerDay: number,
  windowSize: number,
  model: (zScores: number[], ...args: any[]) => number[],
  ...modelArgs: any[]
): number[] {
  // Only consider the last windowSize days
  const data = windowSize === Infinity ? priceData : priceData.slice(-windowSize);
  const z = windowSize === Infinity ? zScores : zScores.slice(-windowSize);
  
  // Validate data alignment
  if (data.length !== z.length) {
    console.error('Data length mismatch:', { dataLength: data.length, zLength: z.length });
    return [];
  }
  
  // Get allocation multipliers from model
  const multipliers = model(z, ...modelArgs);
  
  // Validate multipliers array
  if (multipliers.length !== data.length) {
    console.error('Multipliers length mismatch:', { multipliersLength: multipliers.length, dataLength: data.length });
    return [];
  }
  
  // Calculate daily allocations: baseline budget * multiplier
  const dailyAllocations = multipliers.map(m => m * budgetPerDay);
  
  // Calculate BTC bought each day
  const btcBought = data.map((price, i) => {
    if (price <= 0 || isNaN(price)) return 0;
    return dailyAllocations[i] / price;
  });
  
  return btcBought;
}

// Add more models here as needed
export const dcaModels = {
  softmax: softmax,
  zoneBased: zoneBasedModel,
  // futureModel: (zScores: number[]) => { ... },
};

// Run all models and return their results for leaderboard
export function getAllTunedDCAResults(
  priceData: number[],
  zScores: number[],
  budgetPerDay: number,
  windowSize: number,
  modelArgs: any[] = []
): Record<string, number[]> {
  const results: Record<string, number[]> = {};
  for (const [name, model] of Object.entries(dcaModels)) {
    results[name] = calculateTunedDCA(priceData, zScores, budgetPerDay, windowSize, model, ...modelArgs);
  }
  return results;
} 