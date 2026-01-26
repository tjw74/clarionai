import { DERIVED_METRICS } from './metricsConfig';

// Handles calculation of derived metrics (e.g., MVRV Ratio)
// Extensible for new derived metrics as they are added

export function calculateDerivedMetrics(metrics: Record<string, number[]>): Record<string, number[]> {
  const derived: Record<string, number[]> = {};
  // Create a working copy that includes both base metrics and derived metrics as they're calculated
  const workingMetrics = { ...metrics };
  
  // Get the date length from the first available metric to ensure proper array length
  const dateLength = Object.values(metrics).find(arr => Array.isArray(arr) && arr.length > 0)?.length || 0;
  
  for (const { name, formula } of DERIVED_METRICS) {
    try {
      const result = formula(workingMetrics);
      // Validate result is an array with correct length
      if (Array.isArray(result) && result.length === dateLength) {
        derived[name] = result;
        // Merge back into working metrics so subsequent derived metrics can reference this one
        workingMetrics[name] = result;
      } else {
        console.error(`Derived metric ${name} returned invalid array: length=${result?.length}, expected=${dateLength}`);
        // Fill with NaN to match date length
        derived[name] = new Array(dateLength).fill(NaN);
        workingMetrics[name] = new Array(dateLength).fill(NaN);
      }
    } catch (error) {
      console.error(`Error calculating derived metric ${name}:`, error);
      // Fill with NaN to match date length instead of empty array
      derived[name] = new Array(dateLength).fill(NaN);
      workingMetrics[name] = new Array(dateLength).fill(NaN);
    }
  }
  return derived;
} 