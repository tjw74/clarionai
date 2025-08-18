# Multi-Axis Solution for AI Workbench Scale Conflicts

## Problem Description

The AI Workbench was experiencing a critical usability issue where metrics with vastly different scales (e.g., Price ranging from $10 to $100k+ and STH SOPR ranging from ~0.8 to ~1.2) were being plotted on the same Y-axis. This rendered smaller-scale metrics effectively invisible and unusable.

## Root Cause Analysis

The original implementation used a simple left/right axis assignment system that didn't consider:
1. **Actual data ranges** - Only used predefined metric categories
2. **Scale compatibility** - No detection of metrics that can't share the same scale
3. **Dynamic axis creation** - Limited to exactly two Y-axes (y and y2)

## Solution Overview

Implemented a **dynamic multi-axis system** that automatically:
1. **Analyzes actual data ranges** for all selected metrics
2. **Detects scale conflicts** using intelligent algorithms
3. **Creates additional axes** (y3, y4, etc.) as needed
4. **Groups compatible metrics** on the same axis
5. **Positions axes intelligently** to avoid overlap

## Technical Implementation

### 1. Enhanced Axis Assignment Logic

```typescript
const getAxisAssignment = useCallback((metrics: string[]) => {
  // Analyze actual data ranges for scale conflict detection
  if (!metricData || !sliderRange) {
    // Fallback to simple left/right assignment
    return { leftAxisMetrics, rightAxisMetrics, axisGroups: [] };
  }
  
  // Create axis groups based on scale compatibility
  const axisGroups: Array<{
    axisId: string;
    metrics: string[];
    side: 'left' | 'right';
    scale: 'log' | 'linear';
    range: { min: number; max: number };
  }> = [];
  
  // ... intelligent grouping logic
}, [metricData, sliderRange]);
```

### 2. Scale Compatibility Detection

The system uses two main criteria to determine if metrics can share an axis:

#### For Log Scale Metrics:
- **Range ratio check**: `max/min <= 1e6` (6 orders of magnitude)
- **Magnitude difference check**: `|log10(max1/min1) - log10(max2/min2)| <= 3`

#### For Linear Scale Metrics:
- **Range difference check**: `combined_range <= individual_range * 100`
- **Magnitude difference check**: Similar to log scale

### 3. Dynamic Axis Creation

```typescript
// Position axes to avoid overlap
if (index === 0) {
  base.yaxis = axisConfig; // Primary axis
} else if (index === 1) {
  axisConfig.overlaying = 'y'; // Overlay on primary
  base.yaxis2 = axisConfig;
} else {
  // Additional axes with proper positioning
  axisConfig.overlaying = 'y';
  axisConfig.anchor = 'free';
  axisConfig.position = calculatePosition(index, group.side);
  base[group.axisId] = axisConfig;
}
```

### 4. Intelligent Axis Positioning

- **Left side axes**: Positioned at `0.05 - (index * 0.02)`
- **Right side axes**: Positioned at `0.95 + (index * 0.02)`
- **Overlay strategy**: All additional axes overlay the primary axis for consistent grid alignment

## Benefits

### 1. **Automatic Scale Conflict Resolution**
- No more invisible metrics due to scale differences
- Each metric gets its own appropriate scale range
- Human-readable visualization for all metrics

### 2. **Intelligent Grouping**
- Metrics with similar scales are automatically grouped
- Reduces visual clutter by minimizing unnecessary axes
- Maintains logical relationships between related metrics

### 3. **Dynamic Adaptation**
- Automatically adjusts to any combination of metrics
- No manual configuration required
- Scales with the number of selected metrics

### 4. **Backward Compatibility**
- Falls back to original logic when data isn't available
- Maintains existing functionality for edge cases
- No breaking changes to existing features

## Example Scenarios

### Scenario 1: Price + STH SOPR
- **Before**: Both on same axis, SOPR invisible
- **After**: 
  - Axis 1 (y): Price (log scale, $10 - $100k)
  - Axis 2 (y2): STH SOPR (linear scale, 0.8 - 1.2)

### Scenario 2: Multiple Price Metrics
- **Before**: All price metrics on same axis, potential overlap
- **After**: 
  - Axis 1 (y): Price, Realized Price, 200d SMA (log scale)
  - Axis 2 (y2): MVRV Ratio (linear scale)

### Scenario 3: Complex Multi-Metric Selection
- **Before**: Limited to 2 axes, potential conflicts
- **After**: 
  - Axis 1 (y): Market Cap, Realized Cap (log scale)
  - Axis 2 (y2): MVRV Ratio, SOPR (linear scale)
  - Axis 3 (y3): UTXO Count (log scale, separate range)

## Configuration

### Metric Scale Types
The system automatically categorizes metrics based on `METRIC_SCALE_TYPES`:

```typescript
export const METRIC_SCALE_TYPES = {
  USD_LARGE: ['marketcap', 'realized-cap'], // Log scale
  USD_PRICE: ['close', 'realized-price'],   // Log scale
  RATIO: ['mvrv-ratio', 'sopr'],           // Linear scale
  PERCENTAGE: ['liveliness'],              // Linear scale
  COUNT: ['utxo-count'],                   // Log scale
};
```

### Customization Options
- **Scale thresholds**: Adjustable via constants in the grouping logic
- **Axis positioning**: Configurable positioning algorithms
- **Grouping criteria**: Extensible compatibility rules

## Performance Considerations

### Optimization Strategies
1. **Memoization**: Axis assignment is memoized and only recalculates when metrics or data changes
2. **Efficient grouping**: O(n²) complexity for small metric sets, optimized for typical use cases
3. **Lazy evaluation**: Axis creation only happens when needed

### Memory Usage
- **Minimal overhead**: Axis groups are lightweight objects
- **Efficient storage**: Reuses existing data structures
- **Garbage collection friendly**: No persistent memory leaks

## Testing and Validation

### Test Cases
1. **Single metric selection**: Should use single axis
2. **Compatible metrics**: Should group on same axis
3. **Incompatible metrics**: Should create separate axes
4. **Mixed scale types**: Should handle log/linear combinations
5. **Edge cases**: Invalid data, empty selections, etc.

### Validation Methods
- Console logging for debugging axis assignment
- Visual inspection of chart rendering
- Performance monitoring for large metric sets

## Future Enhancements

### Potential Improvements
1. **User customization**: Allow manual axis grouping overrides
2. **Smart defaults**: Learn from user preferences
3. **Advanced positioning**: More sophisticated axis layout algorithms
4. **Responsive design**: Adapt axis positioning for different screen sizes

### Extensibility
- **Plugin system**: Allow custom grouping algorithms
- **Metric metadata**: Enhanced scale type definitions
- **Visual themes**: Customizable axis appearance

## Conclusion

This multi-axis solution provides a robust, automatic way to handle scale conflicts in the AI Workbench. It eliminates the usability issue while maintaining performance and adding intelligent grouping capabilities. The system is designed to be maintainable, extensible, and backward-compatible.

The solution transforms the chart from a limited two-axis system to a dynamic, intelligent multi-axis system that automatically adapts to any combination of metrics, ensuring all data is always visible and human-readable.
