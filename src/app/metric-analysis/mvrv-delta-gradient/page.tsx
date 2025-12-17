'use client';

import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import * as Slider from '@radix-ui/react-slider';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { fetchAllMetrics, calculateDerivedMetrics, type MetricData } from '@/datamanager';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Make the grid responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

export default function MVRVDeltaGradientAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricData, setMetricData] = useState<MetricData | null>(null);
  
  // Dashboard time range (default for all panels)
  const [dashboardTimeRange, setDashboardTimeRange] = useState<[number, number] | null>(null);

  // Grid layout configuration - all panels same size
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'panel1', x: 0, y: 0, w: 12, h: 8, minW: 6, minH: 4 },
      { i: 'panel2', x: 0, y: 8, w: 12, h: 8, minW: 6, minH: 4 },
      { i: 'panel3', x: 0, y: 16, w: 12, h: 8, minW: 6, minH: 4 },
      { i: 'panel4', x: 0, y: 24, w: 12, h: 8, minW: 6, minH: 4 }
    ],
    md: [
      { i: 'panel1', x: 0, y: 0, w: 10, h: 6, minW: 5, minH: 3 },
      { i: 'panel2', x: 0, y: 6, w: 10, h: 6, minW: 5, minH: 3 },
      { i: 'panel3', x: 0, y: 12, w: 10, h: 6, minW: 5, minH: 3 },
      { i: 'panel4', x: 0, y: 18, w: 10, h: 6, minW: 5, minH: 3 }
    ],
    sm: [
      { i: 'panel1', x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 2 },
      { i: 'panel2', x: 0, y: 4, w: 6, h: 4, minW: 3, minH: 2 },
      { i: 'panel3', x: 0, y: 8, w: 6, h: 4, minW: 3, minH: 2 },
      { i: 'panel4', x: 0, y: 12, w: 6, h: 4, minW: 3, minH: 2 }
    ],
    xs: [
      { i: 'panel1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
      { i: 'panel2', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 2 },
      { i: 'panel3', x: 0, y: 6, w: 4, h: 3, minW: 2, minH: 2 },
      { i: 'panel4', x: 0, y: 9, w: 4, h: 3, minW: 2, minH: 2 }
    ],
    xxs: [
      { i: 'panel1', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1 },
      { i: 'panel2', x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1 },
      { i: 'panel3', x: 0, y: 4, w: 2, h: 2, minW: 1, minH: 1 },
      { i: 'panel4', x: 0, y: 6, w: 2, h: 2, minW: 1, minH: 1 }
    ]
  });

  // Fetch metric data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const data = await fetchAllMetrics();
        
        // Calculate derived metrics (including MVRV delta gradients)
        const derivedMetrics = calculateDerivedMetrics(data.metrics);
        
        // Merge derived metrics with base metrics
        const allMetrics = { ...data.metrics, ...derivedMetrics };
        
        setMetricData({
          dates: data.dates,
          metrics: allMetrics
        });
        
        // Initialize dashboard time range to last 8 years
        setDashboardTimeRange([Math.max(0, data.dates.length - 2920), data.dates.length - 1]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch metric data');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle dashboard time range change
  const handleDashboardTimeChange = (newRange: [number, number]) => {
    setDashboardTimeRange(newRange);
  };

  // Handle layout changes
  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  // Get effective time range for the charts
  const effectiveTimeRange = dashboardTimeRange;

  // Helper function to create chart data with MV, RV, and MVRV Ratio
  const createChartData = () => {
    if (!metricData || !effectiveTimeRange) return [];

    const [start, end] = effectiveTimeRange;
    const dates = metricData.dates.slice(start, end + 1);
    const marketCap = metricData.metrics['market_cap']?.slice(start, end + 1) || [];
    const realizedCap = metricData.metrics['realized_cap']?.slice(start, end + 1) || [];
    const mvrvRatio = metricData.metrics['mvrv-ratio']?.slice(start, end + 1) || [];

    // Grafana colors
    const grafanaBlue = '#5794F2';
    const grafanaYellow = '#FADE2A';

    return [
      {
        x: dates,
        y: marketCap,
        type: 'scatter',
        mode: 'lines',
        name: 'MV (Market Cap)',
        line: { 
          color: grafanaBlue, 
          width: 1,
          shape: 'linear'
        },
        yaxis: 'y',
        hovertemplate: 
          '<b>Market Cap</b><br>' +
          'Date: %{x}<br>' +
          'Value: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: grafanaBlue,
          font: { color: '#FFFFFF', size: 12 }
        }
      },
      {
        x: dates,
        y: realizedCap,
        type: 'scatter',
        mode: 'lines',
        name: 'RV (Realized Cap)',
        line: { 
          color: grafanaYellow, 
          width: 1,
          shape: 'linear'
        },
        yaxis: 'y',
        hovertemplate: 
          '<b>Realized Cap</b><br>' +
          'Date: %{x}<br>' +
          'Value: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: grafanaYellow,
          font: { color: '#FFFFFF', size: 12 }
        }
      },
      {
        x: dates,
        y: mvrvRatio,
        type: 'scatter',
        mode: 'lines',
        name: 'MVRV Ratio',
        line: { 
          color: 'rgba(255, 255, 255, 0.5)', 
          width: 1,
          shape: 'linear',
          dash: 'dot'
        },
        yaxis: 'y2',
        hovertemplate: 
          '<b>MVRV Ratio</b><br>' +
          'Date: %{x}<br>' +
          'Ratio: %{y:.3f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: 'rgba(255, 255, 255, 0.5)',
          font: { color: '#FFFFFF', size: 12 }
        }
      }
    ];
  };

  // Memoized chart data - all charts use the same data
  const chartData = useMemo(() => createChartData(), [metricData, effectiveTimeRange]);

  // Shared chart layout
  const chartLayout = useMemo(() => {
    let xaxisRange = undefined;
    
    if (metricData && effectiveTimeRange) {
      const [start, end] = effectiveTimeRange;
      const startDate = metricData.dates[start];
      const endDate = metricData.dates[end];
      xaxisRange = [startDate, endDate];
    }

    return {
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: { 
        color: '#FFFFFF',
        family: 'Inter, system-ui, sans-serif'
      },
      xaxis: {
        title: {
          text: '',
          font: { color: '#FFFFFF', size: 14 }
        },
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        zerolinecolor: 'rgba(55, 65, 81, 0.3)',
        showgrid: true,
        gridwidth: 0.5,
        tickfont: { color: '#FFFFFF', size: 12 },
        titlefont: { color: '#FFFFFF', size: 14 },
        type: 'date',
        tickformat: '%b %Y',
        tickangle: 0,
        showline: true,
        linecolor: '#374151',
        linewidth: 1,
        range: xaxisRange
      },
      yaxis: {
        title: {
          text: 'Market Cap / Realized Cap (USD)',
          font: { color: '#FFFFFF', size: 14 }
        },
        type: 'log',
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        zerolinecolor: 'rgba(55, 65, 81, 0.3)',
        showgrid: true,
        gridwidth: 0.5,
        tickfont: { color: '#FFFFFF', size: 12 },
        titlefont: { color: '#FFFFFF', size: 14 },
        tickformat: ',.0s',
        tickprefix: '$',
        showline: true,
        linecolor: '#374151',
        linewidth: 1,
        side: 'left',
        autorange: true,
        tickmode: 'auto',
        nticks: 8
      },
      yaxis2: {
        title: {
          text: 'MVRV Ratio',
          font: { color: '#FFFFFF', size: 14 }
        },
        type: 'linear',
        gridcolor: 'transparent',
        zerolinecolor: 'transparent',
        showgrid: false,
        tickfont: { color: '#FFFFFF', size: 12 },
        titlefont: { color: '#FFFFFF', size: 14 },
        tickformat: '.2f',
        showline: false,
        side: 'right',
        overlaying: 'y',
        anchor: 'free',
        position: 1,
        autorange: true,
        tickmode: 'auto',
        nticks: 8
      },
      showlegend: true,
      legend: {
        x: 0,
        y: 1.02,
        xanchor: 'left',
        yanchor: 'bottom',
        orientation: 'h',
        font: { color: '#FFFFFF', size: 14 },
        bgcolor: 'rgba(0,0,0,0)',
        bordercolor: 'rgba(0,0,0,0)',
        itemwidth: 20
      },
      margin: { 
        l: 80, 
        r: 80, 
        t: 80, 
        b: 60 
      },
      hovermode: 'closest',
      hoverdistance: 100,
      xaxis_rangeslider_visible: false,
      autosize: true,
      transition: {
        duration: 300,
        easing: 'cubic-in-out'
      }
    };
  }, [metricData, effectiveTimeRange]);

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="h-16 w-full flex items-center justify-center">
          <h1 className="text-3xl font-bold">MVRV Delta Gradient</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading metric data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="h-16 w-full flex items-center justify-center">
          <h1 className="text-3xl font-bold">MVRV Delta Gradient</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
      <header className="h-16 w-full flex items-center justify-center">
        <h1 className="text-3xl font-bold">MVRV Delta Gradient</h1>
      </header>

      <div className="flex-1 p-6 overflow-y-auto">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          onLayoutChange={onLayoutChange}
          isDraggable={true}
          isResizable={true}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          useCSSTransforms={true}
          preventCollision={false}
          compactType="vertical"
          style={{
            minHeight: 'calc(100vh - 200px)',
            background: 'transparent'
          }}
        >
          {/* Panel 1 - 30d */}
          <div key="panel1" className="bg-black border border-white/20 rounded-lg overflow-hidden">
            <div className="h-full w-full p-4 flex flex-col">
              <div className="text-lg font-semibold mb-2 text-center">30-Day MVRV Delta Gradient</div>
              <div className="flex-1 relative" onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>
                <Plot
                  data={chartData}
                  layout={{
                    ...chartLayout,
                    autosize: true,
                    width: undefined,
                    height: undefined
                  }}
                  config={{ 
                    responsive: true, 
                    displayModeBar: false,
                    displaylogo: false
                  }}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                />
              </div>
            </div>
          </div>

          {/* Panel 2 - 90d */}
          <div key="panel2" className="bg-black border border-white/20 rounded-lg overflow-hidden">
            <div className="h-full w-full p-4 flex flex-col">
              <div className="text-lg font-semibold mb-2 text-center">90-Day MVRV Delta Gradient</div>
              <div className="flex-1 relative" onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>
                <Plot
                  data={chartData}
                  layout={{
                    ...chartLayout,
                    autosize: true,
                    width: undefined,
                    height: undefined
                  }}
                  config={{ 
                    responsive: true, 
                    displayModeBar: false,
                    displaylogo: false
                  }}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                />
              </div>
            </div>
          </div>

          {/* Panel 3 - 155d */}
          <div key="panel3" className="bg-black border border-white/20 rounded-lg overflow-hidden">
            <div className="h-full w-full p-4 flex flex-col">
              <div className="text-lg font-semibold mb-2 text-center">155-Day MVRV Delta Gradient</div>
              <div className="flex-1 relative" onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>
                <Plot
                  data={chartData}
                  layout={{
                    ...chartLayout,
                    autosize: true,
                    width: undefined,
                    height: undefined
                  }}
                  config={{ 
                    responsive: true, 
                    displayModeBar: false,
                    displaylogo: false
                  }}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                />
              </div>
            </div>
          </div>

          {/* Panel 4 - 180d */}
          <div key="panel4" className="bg-black border border-white/20 rounded-lg overflow-hidden">
            <div className="h-full w-full p-4 flex flex-col">
              <div className="text-lg font-semibold mb-2 text-center">180-Day MVRV Delta Gradient</div>
              <div className="flex-1 relative" onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>
                <Plot
                  data={chartData}
                  layout={{
                    ...chartLayout,
                    autosize: true,
                    width: undefined,
                    height: undefined
                  }}
                  config={{ 
                    responsive: true, 
                    displayModeBar: false,
                    displaylogo: false
                  }}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={true}
                />
              </div>
            </div>
          </div>
        </ResponsiveGridLayout>
        
        {/* Time range slider at bottom */}
        {metricData && effectiveTimeRange && (
          <div className="w-full flex justify-center items-center mt-6">
            <Slider.Root
              className="relative w-full max-w-2xl h-6 flex items-center"
              min={0}
              max={metricData.dates.length - 1}
              step={1}
              value={effectiveTimeRange}
              onValueChange={([start, end]) => handleDashboardTimeChange([start, end])}
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
      </div>
    </div>
  );
}
