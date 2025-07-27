// Zone-based DCA allocation model
// Uses 0.25 std dev increments to create zones, then allocates based on rarity

export interface Zone {
  minZScore: number;
  maxZScore: number;
  dayCount: number;
  rarity: number; // percentage of days in this zone
}

export interface ZoneAllocation {
  zone: Zone;
  allocationMultiplier: number; // how much to multiply baseline budget
}

// Create zones with 0.25 std dev increments, no hard limits
export function createZones(zScores: number[], zoneSize: number = 0.25): Zone[] {
  if (!Array.isArray(zScores) || zScores.length === 0) return [];
  
  // Find the actual range of z-scores (no hard limits)
  const minZ = Math.min(...zScores.filter(z => isFinite(z)));
  const maxZ = Math.max(...zScores.filter(z => isFinite(z)));
  
  // Create zones starting from minZ, incrementing by zoneSize
  const zones: Zone[] = [];
  let currentMin = minZ;
  
  while (currentMin < maxZ) {
    const currentMax = currentMin + zoneSize;
    
    // Count days in this zone
    const dayCount = zScores.filter(z => 
      isFinite(z) && z >= currentMin && z < currentMax
    ).length;
    
    const rarity = dayCount / zScores.length;
    
    zones.push({
      minZScore: currentMin,
      maxZScore: currentMax,
      dayCount,
      rarity
    });
    
    currentMin = currentMax;
  }
  
  return zones;
}

// Calculate allocation multipliers based on linear rarity scaling
// Only increase allocation for undervalued zones (negative z-scores)
export function calculateZoneAllocations(
  zones: Zone[], 
  baselineMultiplier: number = 1.0
): ZoneAllocation[] {
  return zones.map(zone => {
    let allocationMultiplier = baselineMultiplier;
    
    // Only increase allocation for undervalued zones (negative z-scores)
    if (zone.maxZScore < 0) {
      // FIX: Use baseline + bonus approach instead of redistribution
      // Rarity-based bonus: rarer zones get higher bonus allocation
      // Formula: bonus = (1 - rarity) * maxBonus
      // This means: 1% rarity = 99% of max bonus, 50% rarity = 50% of max bonus
      const maxBonus = 5.0; // Maximum 5x allocation (configurable)
      const bonus = (1 - zone.rarity) * maxBonus;
      allocationMultiplier = baselineMultiplier + bonus;
    }
    
    return {
      zone,
      allocationMultiplier
    };
  });
}

// Main zone-based allocation function
export function zoneBasedAllocation(
  zScores: number[], 
  zoneSize: number = 0.25,
  baselineMultiplier: number = 1.0,
  maxBonus: number = 5.0
): number[] {
  if (!Array.isArray(zScores) || zScores.length === 0) return [];
  
  // Create zones
  const zones = createZones(zScores, zoneSize);
  
  // Calculate zone allocations with maxBonus parameter
  const zoneAllocations = zones.map(zone => {
    let allocationMultiplier = baselineMultiplier;
    
    // Only increase allocation for undervalued zones (negative z-scores)
    if (zone.maxZScore < 0) {
      // FIX: Use baseline + bonus approach instead of redistribution
      // Rarity-based bonus: rarer zones get higher bonus allocation
      const bonus = (1 - zone.rarity) * maxBonus;
      allocationMultiplier = baselineMultiplier + bonus;
    }
    
    return {
      zone,
      allocationMultiplier
    };
  });
  
  // Map each z-score to its allocation multiplier
  const allocations = zScores.map(zScore => {
    if (!isFinite(zScore)) return baselineMultiplier;
    
    // Find which zone this z-score belongs to
    const zoneAllocation = zoneAllocations.find(za => 
      zScore >= za.zone.minZScore && zScore < za.zone.maxZScore
    );
    
    return zoneAllocation ? zoneAllocation.allocationMultiplier : baselineMultiplier;
  });
  
  return allocations;
}

// Debug function to log zone information
export function logZoneInfo(zones: Zone[], allocations: ZoneAllocation[]): void {
  console.log('Zone-based allocation debug info (baseline + bonus approach):');
  zones.forEach((zone, i) => {
    const allocation = allocations[i];
    const bonus = allocation.allocationMultiplier - 1;
    console.log(`Zone ${i}: Z-score ${zone.minZScore.toFixed(2)} to ${zone.maxZScore.toFixed(2)}, ` +
                `${zone.dayCount} days (${(zone.rarity * 100).toFixed(1)}%), ` +
                `multiplier: ${allocation.allocationMultiplier.toFixed(2)}x (${bonus > 0 ? '+' : ''}${bonus.toFixed(2)} bonus)`);
  });
} 