'use client';
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { ResizablePanel, ResizablePanelGroup, ResizableHandle } from "@/components/ui/resizable";
import dynamic from 'next/dynamic';
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });
import { fetchAllMetrics, type MetricData, calculateZScores } from '../../datamanager';
import { METRIC_GROUPS } from '../../datamanager/metricsConfig';
import * as Slider from '@radix-ui/react-slider';

// Debounce function for resize events
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): T {
  let timeout: NodeJS.Timeout;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

// Data downsampling function for performance
// IMPORTANT: This preserves statistical accuracy because:
// 1. Z-scores are calculated on FULL dataset first
// 2. Then we sample the results for display
// 3. Statistical relationships remain intact
// 4. Only visual resolution is reduced (which is imperceptible)
function downsampleData<T>(data: T[], maxPoints: number = 1000): T[] {
  if (data.length <= maxPoints) return data;
  
  const step = Math.ceil(data.length / maxPoints);
  const downsampled: T[] = [];
  
  // Always include the first point
  downsampled.push(data[0]);
  
  // Sample at regular intervals
  for (let i = step; i < data.length - step; i += step) {
    downsampled.push(data[i]);
  }
  
  // Always include the last point
  if (downsampled[downsampled.length - 1] !== data[data.length - 1]) {
    downsampled.push(data[data.length - 1]);
  }
  
  return downsampled;
}

export default function AIWorkbench() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const handlePrev = () => setSelectedIndex(i => Math.max(i - 1, 0));
  const handleNext = () => setSelectedIndex(i => Math.min(i + 1, METRIC_GROUPS.length - 1));
  const [metricData, setMetricData] = useState<MetricData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sliderRange, setSliderRange] = useState<[number, number] | null>(null);
  const [plotPanelKey, setPlotPanelKey] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  // Get current metric group
  const currentGroup = METRIC_GROUPS[selectedIndex];

  // Memoized data processing
  const processedData = useMemo(() => {
    if (!metricData || !sliderRange) return null;
    
    const [start, end] = sliderRange;
    const x = metricData.dates.slice(start, end + 1);
    
    // Determine if we need downsampling (more than 1000 points)
    const needsDownsampling = x.length > 1000;
    const maxPoints = 1000;
    
    // Pre-calculate all z-scores for current group metrics
    const zScores: Record<string, number[]> = {};
    const slicedMetrics: Record<string, number[]> = {};
    
    currentGroup.metrics.forEach(metric => {
      // Get the metric data
      const metricDataArray = metricData.metrics[metric.key] || [];
      slicedMetrics[metric.key] = metricDataArray.slice(start, end + 1);
      
      // Calculate z-scores if needed
      if (metric.zScore) {
        zScores[metric.key] = calculateZScores(metricDataArray, 1460).slice(start, end + 1);
      }
    });
    
    // Apply downsampling if needed
    if (needsDownsampling) {
      const downsampledX = downsampleData(x, maxPoints);
      const downsampledZScores: Record<string, number[]> = {};
      const downsampledMetrics: Record<string, number[]> = {};
      
      currentGroup.metrics.forEach(metric => {
        downsampledMetrics[metric.key] = downsampleData(slicedMetrics[metric.key], maxPoints);
        if (metric.zScore) {
          downsampledZScores[metric.key] = downsampleData(zScores[metric.key], maxPoints);
        }
      });
      
      return { 
        x: downsampledX, 
        zScores: downsampledZScores, 
        slicedMetrics: downsampledMetrics,
        downsampled: true 
      };
    }
    
    return { x, zScores, slicedMetrics, downsampled: false };
  }, [metricData, sliderRange, currentGroup]);

  // Memoized chart data
  const chartData = useMemo(() => {
    if (!processedData) return [];
    
    const { x, zScores, slicedMetrics } = processedData;
    const traces: any[] = [];
    
    // Add metric traces
    currentGroup.metrics.forEach(metric => {
      // Main metric trace
      traces.push({
        x,
        y: slicedMetrics[metric.key],
        name: metric.name,
        type: 'scatter' as const,
        mode: 'lines' as const,
        line: { color: metric.color, width: 1 },
        yaxis: metric.yaxis,
      });
      
      // Z-score trace if enabled
      if (metric.zScore && zScores[metric.key]) {
        traces.push({
          x,
          y: zScores[metric.key],
          name: `${metric.name} Z`,
          type: 'scatter' as const,
          mode: 'lines' as const,
          line: { color: metric.color, width: 1 },
          yaxis: 'y', // Z-scores always on left Y-axis
        });
      }
    });
    
    return traces;
  }, [processedData, currentGroup]);

  // Memoized chart layout
  const chartLayout = useMemo(() => ({
    autosize: true,
    autoresize: true,
    paper_bgcolor: 'black',
    plot_bgcolor: 'black',
    font: { color: 'white' },
    xaxis: {
      color: 'white',
      gridcolor: '#333',
      title: 'Date',
    },
    yaxis: {
      title: 'Z-Score',
      type: 'linear' as const,
      side: 'left' as const,
      color: 'white',
      gridcolor: '#333',
      showgrid: true,
      showline: false,
      zeroline: false,
    },
    yaxis2: {
      title: 'Value',
      type: 'log' as const,
      side: 'right' as const,
      color: 'white',
      gridcolor: '#333',
      tickformat: '.2s',
      showgrid: true,
      showline: false,
      zeroline: false,
      exponentformat: 'power',
      showexponent: 'all',
      dtick: 1,
      overlaying: 'y',
    },
    margin: { l: 40, r: 40, t: 20, b: 40 },
    legend: {
      orientation: 'h' as const,
      x: 0,
      y: 1.08,
      xanchor: 'left' as const,
      yanchor: 'bottom' as const,
      font: { color: 'white', size: 12 },
      itemwidth: 10,
    },
  }), []);

  // Debounced resize handler
  const debouncedResizeHandler = useCallback(
    debounce(() => setPlotPanelKey(k => k + 1), 100),
    []
  );

  useEffect(() => {
    setLoading(true);
    fetchAllMetrics().then((data: MetricData) => {
      setMetricData(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (metricData && metricData.dates.length > 1 && !sliderRange) {
      // Find the first index where the date is in 2013 or later
      let first2013Idx = 0;
      for (let i = 0; i < metricData.dates.length; i++) {
        const year = Number(metricData.dates[i].slice(0, 4));
        if (year >= 2013) {
          first2013Idx = i;
          break;
        }
      }
      setSliderRange([first2013Idx, metricData.dates.length - 1]);
    }
  }, [metricData]);

  useEffect(() => {
    if (!panelRef.current) return;
    const ro = new window.ResizeObserver(debouncedResizeHandler);
    ro.observe(panelRef.current);
    return () => ro.disconnect();
  }, [debouncedResizeHandler]);

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
      <header className="py-8 border-b border-white/20 w-full flex items-center justify-between px-8">
        <h1 className="text-3xl font-bold">AI Workbench</h1>
        {/* Metric group navigation - moved to top right */}
        <div className="flex items-center gap-2">
          <button onClick={handlePrev} disabled={selectedIndex === 0} className="px-3 py-1 rounded border border-white/20 bg-black text-white disabled:opacity-40">&lt;</button>
          <select
            value={selectedIndex}
            onChange={e => setSelectedIndex(Number(e.target.value))}
            className="bg-black border border-white/20 text-white rounded px-2 py-1"
          >
            {METRIC_GROUPS.map((group, i) => (
              <option key={group.name} value={i}>{group.name}</option>
            ))}
          </select>
          <button onClick={handleNext} disabled={selectedIndex === METRIC_GROUPS.length - 1} className="px-3 py-1 rounded border border-white/20 bg-black text-white disabled:opacity-40">&gt;</button>
        </div>
      </header>
      <div className="flex flex-col flex-1 p-4 gap-4">
        {/* 2 main panels: left (unified), right (vertical split) */}
        <ResizablePanelGroup direction="horizontal" className="flex-1 min-h-0 border border-white/20 bg-black">
          {/* Unified Left Panel */}
          <ResizablePanel defaultSize={50} minSize={20} className="flex-1 min-h-0 min-w-0 flex flex-col">
            <div ref={panelRef} className="flex-1 min-h-0 min-w-0 flex flex-col p-2 bg-black border-r border-white/20">
              {(() => {
                if (loading || !metricData) {
                  return <span className="text-white/60">Loading chart...</span>;
                }
                
                return (
                  <>
                    <div className="relative flex-1 min-h-0 w-full h-full">
                      <Plot
                        key={plotPanelKey}
                        divId="ai-workbench-plot"
                        data={chartData}
                        layout={chartLayout}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                        config={{ displayModeBar: false }}
                      />
                      {/* Performance indicator */}
                      {processedData?.downsampled && (
                        <div className="absolute top-2 right-2 bg-black/80 text-white/60 text-xs px-2 py-1 rounded">
                          Downsampled for performance
                        </div>
                      )}
                    </div>
                    {/* Minimalist time range slider below chart */}
                    {metricData && sliderRange && (
                      <div className="w-full flex justify-center items-center mt-2">
                        <Slider.Root
                          className="relative w-full max-w-2xl h-6 flex items-center"
                          min={0}
                          max={metricData.dates.length - 1}
                          step={1}
                          value={sliderRange}
                          onValueChange={([start, end]) => setSliderRange([start, end])}
                          minStepsBetweenThumbs={1}
                        >
                          <Slider.Track className="bg-[#444a] h-[3px] w-full rounded-full">
                            <Slider.Range className="bg-transparent" />
                          </Slider.Track>
                          <Slider.Thumb className="block w-2 h-2 bg-white border-2 border-white rounded-full shadow" />
                          <Slider.Thumb className="block w-2 h-2 bg-white border-2 border-white rounded-full shadow" />
                        </Slider.Root>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="border border-white/20 border-[1px]" />
          {/* Right side (vertical split) */}
          <ResizablePanel defaultSize={50} minSize={20} className="min-w-0">
            <ResizablePanelGroup direction="vertical" className="h-full min-h-0">
              {/* Top Right */}
              <ResizablePanel defaultSize={50} minSize={20} className="min-h-0">
                <div className="flex flex-col h-full w-full items-center justify-center p-2 bg-black border-b border-white/20">
                  <span className="text-white text-lg font-semibold">Top Right ({currentGroup.name})</span>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="border border-white/20 border-[1px]" />
              {/* Bottom Right */}
              <ResizablePanel defaultSize={50} minSize={20} className="min-h-0">
                <div className="flex flex-col h-full w-full items-center justify-center p-2 bg-black">
                  <span className="text-white text-lg font-semibold">Bottom Right ({currentGroup.name})</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
} 