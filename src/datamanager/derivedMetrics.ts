import { DERIVED_METRICS } from './metricsConfig';

// Handles calculation of derived metrics (e.g., MVRV Ratio)
// Extensible for new derived metrics as they are added

export function calculateDerivedMetrics(metrics: Record<string, number[]>): Record<string, number[]> {
  const derived: Record<string, number[]> = {};
  // Create a working copy that includes both base metrics and derived metrics as they're calculated
  const workingMetrics = { ...metrics };
  
  for (const { name, formula } of DERIVED_METRICS) {
    try {
      const result = formula(workingMetrics);
      derived[name] = result;
      // Merge back into working metrics so subsequent derived metrics can reference this one
      workingMetrics[name] = result;
    } catch (error) {
      console.error(`Error calculating derived metric ${name}:`, error);
      derived[name] = [];
      workingMetrics[name] = [];
    }
  }
  return derived;
} 