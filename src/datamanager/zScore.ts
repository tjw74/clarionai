// Handles rolling window z-score calculations for all metrics
// Default window: 4 years (1460 days); options: 2yr (730), 4yr (1460), 8yr (2920), all

export function calculateZScores(
  metricData: number[],
  windowSize: number
): number[] {
  if (!Array.isArray(metricData) || metricData.length === 0) return [];
  
  const zScores: number[] = new Array(metricData.length);
  
  for (let i = 0; i < metricData.length; i++) {
    // Handle Infinity window size (all time) properly
    const start = windowSize === Infinity ? 0 : Math.max(0, i - windowSize + 1);
    
    // Early exit for invalid current value
    if (typeof metricData[i] !== 'number' || isNaN(metricData[i])) {
      zScores[i] = NaN;
      continue;
    }
    
    // Calculate mean and std in a single pass
    let sum = 0;
    let count = 0;
    
    for (let j = start; j <= i; j++) {
      const val = metricData[j];
      if (typeof val === 'number' && !isNaN(val)) {
        sum += val;
        count++;
      }
    }
    
    if (count < 2) {
      zScores[i] = NaN;
      continue;
    }
    
    const mean = sum / count;
    
    // Calculate standard deviation
    let sumSquaredDiff = 0;
    for (let j = start; j <= i; j++) {
      const val = metricData[j];
      if (typeof val === 'number' && !isNaN(val)) {
        const diff = val - mean;
        sumSquaredDiff += diff * diff;
      }
    }
    
    const std = Math.sqrt(sumSquaredDiff / count);
    zScores[i] = std === 0 ? 0 : (metricData[i] - mean) / std;
  }
  
  return zScores;
}

// Helper for window size options (in days)
export const Z_SCORE_WINDOWS = {
  '2yr': 730,
  '4yr': 1460,
  '8yr': 2920,
  'all': Infinity,
}; 