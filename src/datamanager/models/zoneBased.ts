// Zone-based DCA allocation model
// Simple logic: only apply multipliers when undervalued, otherwise use baseline

import { METRIC_CORRELATION } from '../metricsConfig';

// Simple zone-based allocation function
export function zoneBasedAllocation(
  zScores: number[],
  zoneSize: number = 0.25,
  baselineMultiplier: number = 1.0,
  maxBonus: number = 5.0,
  dailyBudgetCap: number = 60,
  metricKey?: string
): number[] {
  if (!Array.isArray(zScores) || zScores.length === 0) return [];

  // Get correlation direction for this metric
  const isPositiveCorrelation = metricKey ? METRIC_CORRELATION[metricKey] ?? true : true;

  // SIMPLE LOGIC: Only apply multiplier when undervalued, otherwise use baseline
  const allocations = zScores.map(zScore => {
    if (!isFinite(zScore)) return baselineMultiplier;
    
    // Determine if this z-score indicates undervaluation based on correlation
    let isUndervalued = false;
    
    if (isPositiveCorrelation) {
      // For positive correlation metrics: negative z-score = undervalued
      isUndervalued = zScore < 0;
    } else {
      // For negative correlation metrics: positive z-score = undervalued
      isUndervalued = zScore > 0;
    }
    
    if (isUndervalued) {
      // UNDERVALUED: Apply multiplier based on how extreme the z-score is
      const undervaluedRatio = Math.min(Math.abs(zScore) / 2.0, 1.0); // Cap at 2 std devs
      const bonus = undervaluedRatio * maxBonus;
      return baselineMultiplier + bonus;
    } else {
      // OVERVALUED: Use baseline multiplier (no reduction)
      return baselineMultiplier;
    }
  });

  return allocations;
}

// Legacy functions for compatibility (not used in new logic)
export interface Zone {
  minZScore: number;
  maxZScore: number;
  dayCount: number;
  rarity: number;
}

export interface ZoneAllocation {
  zone: Zone;
  allocationMultiplier: number;
}

export function createZones(zScores: number[], zoneSize: number = 0.25): Zone[] {
  // Legacy function - not used in new simple logic
  return [];
}

export function calculateZoneAllocations(
  zones: Zone[],
  baselineMultiplier: number = 1.0,
  maxBonus: number = 5.0
): ZoneAllocation[] {
  // Legacy function - not used in new simple logic
  return [];
}

export function logZoneInfo(zones: Zone[], allocations: ZoneAllocation[]): void {
  // Legacy function - not used in new simple logic
} 