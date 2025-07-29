'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import * as Slider from '@radix-ui/react-slider';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

// Make the grid responsive
const ResponsiveGridLayout = WidthProvider(Responsive);

export default function SOPRAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ 
    dates: string[]; 
    prices: number[];
    aSOPR?: number[];
  } | null>(null);
  const [panel1SliderRange, setPanel1SliderRange] = useState<[number, number] | null>(null);
  const [panel2SliderRange, setPanel2SliderRange] = useState<[number, number] | null>(null);

  // Grid layout configuration
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'panel1', x: 0, y: 0, w: 12, h: 8, minW: 6, minH: 4 },
      { i: 'panel2', x: 0, y: 8, w: 12, h: 8, minW: 6, minH: 4 }
    ],
    md: [
      { i: 'panel1', x: 0, y: 0, w: 10, h: 6, minW: 4, minH: 3 },
      { i: 'panel2', x: 0, y: 6, w: 10, h: 6, minW: 4, minH: 3 }
    ],
    sm: [
      { i: 'panel1', x: 0, y: 0, w: 6, h: 4, minW: 2, minH: 2 },
      { i: 'panel2', x: 0, y: 4, w: 6, h: 4, minW: 2, minH: 2 }
    ],
    xs: [
      { i: 'panel1', x: 0, y: 0, w: 4, h: 3, minW: 2, minH: 2 },
      { i: 'panel2', x: 0, y: 3, w: 4, h: 3, minW: 2, minH: 2 }
    ],
    xxs: [
      { i: 'panel1', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1 },
      { i: 'panel2', x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1 }
    ]
  });

  // Fetch price data
  useEffect(() => {
    async function fetchPriceData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('https://bitcoinresearchkit.org/api/vecs/query?index=dateindex&ids=date,close,short-term-holders-adjusted-spent-output-profit-ratio&format=json');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price data: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length < 3) {
          throw new Error('Invalid data format');
        }

        const [dates, close, sthSOPR] = data;
        setPriceData({
          dates,
          prices: close,
          aSOPR: sthSOPR
        });
        
        // Initialize slider ranges to full dataset
        setPanel1SliderRange([0, dates.length - 1]);
        setPanel2SliderRange([0, dates.length - 1]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch price data');
      } finally {
        setLoading(false);
      }
    }

    fetchPriceData();
  }, []);

  // Handle layout changes
  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  // Memoized chart data for panel 1
  const panel1ChartData = useMemo(() => {
    if (!priceData || !panel1SliderRange) return [];

    const [start, end] = panel1SliderRange;
    
    const dates = priceData.dates.slice(start, end + 1);
    const prices = priceData.prices.slice(start, end + 1);
    const aSOPR = priceData.aSOPR?.slice(start, end + 1) || [];

    // Get latest values for legend
    const latestPrice = prices[prices.length - 1];
    const latestSOPR = aSOPR[aSOPR.length - 1];
    
    return [
      {
        x: dates,
        y: prices,
        type: 'scatter',
        mode: 'lines',
        name: `Bitcoin Price: $${latestPrice?.toLocaleString() || 'N/A'}`,
        line: { 
          color: '#33B1FF', 
          width: 2,
          shape: 'linear'
        },
        yaxis: 'y',
        hovertemplate: 
          '<b>Bitcoin Price</b><br>' +
          'Date: %{x}<br>' +
          'Price: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#33B1FF',
          font: { color: '#FFFFFF', size: 12 }
        }
      },
      {
        x: dates,
        y: aSOPR,
        type: 'scatter',
        mode: 'lines',
        name: `STH SOPR: ${latestSOPR?.toFixed(3) || 'N/A'}`,
        line: { 
          color: '#F59E0B', 
          width: 1.5,
          shape: 'linear'
        },
        yaxis: 'y2',
        hovertemplate: 
          '<b>STH SOPR</b><br>' +
          'Date: %{x}<br>' +
          'Value: %{y:,.2f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#F59E0B',
          font: { color: '#FFFFFF', size: 12 }
        }
      }
    ];
  }, [priceData, panel1SliderRange]);

  // Memoized chart data for panel 2
  const panel2ChartData = useMemo(() => {
    if (!priceData || !panel2SliderRange) return [];

    const [start, end] = panel2SliderRange;
    
    const aSOPR = priceData.aSOPR?.slice(start, end + 1) || [];

    // Calculate distribution bins
    const minSOPR = Math.min(...aSOPR);
    const maxSOPR = Math.max(...aSOPR);
    const binCount = 50;
    const binSize = (maxSOPR - minSOPR) / binCount;
    
    const bins = Array(binCount).fill(0);
    const binCenters = [];
    
    for (let i = 0; i < binCount; i++) {
      binCenters.push(minSOPR + (i + 0.5) * binSize);
    }
    
    // Count values in each bin
    aSOPR.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minSOPR) / binSize), binCount - 1);
      bins[binIndex]++;
    });
    
    return [
      {
        x: binCenters,
        y: bins,
        type: 'bar',
        name: 'SOPR Distribution',
        marker: {
          color: '#F59E0B',
          opacity: 0.8
        },
        hovertemplate: 
          '<b>SOPR Distribution</b><br>' +
          'SOPR Value: %{x:.3f}<br>' +
          'Frequency: %{y}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#F59E0B',
          font: { color: '#FFFFFF', size: 12 }
        }
      }
    ];
  }, [priceData, panel2SliderRange]);

  // Memoized chart layout for panel 1
  const panel1ChartLayout = useMemo(() => {
    // Get the date range for the current slider selection
    let xaxisRange = undefined;
    
    if (priceData && panel1SliderRange) {
      const [start, end] = panel1SliderRange;
      const startDate = priceData.dates[start];
      const endDate = priceData.dates[end];
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
        showline: false,
        range: xaxisRange
      },
      yaxis: {
        title: {
          text: '',
          font: { color: '#FFFFFF', size: 14 }
        },
        type: 'log',
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        zerolinecolor: 'rgba(55, 65, 81, 0.3)',
        showgrid: true,
        gridwidth: 0.5,
        tickfont: { color: '#FFFFFF', size: 12 },
        titlefont: { color: '#FFFFFF', size: 14 },
        tickformat: ',.0f',
        tickprefix: '$',
        showline: false,
        side: 'left',
        // Log base 2 configuration
        dtick: 'L2',
        tickmode: 'auto',
        nticks: 8,
        // Auto-adapt to metric values
        autorange: true
      },
      yaxis2: {
        title: {
          text: '',
          font: { color: '#FFFFFF', size: 14 }
        },
        type: 'linear',
        gridcolor: 'transparent',
        zerolinecolor: 'transparent',
        side: 'right',
        tickfont: { color: '#FFFFFF', size: 12 },
        titlefont: { color: '#FFFFFF', size: 14 },
        showline: false,
        overlaying: 'y',
        anchor: 'free',
        position: 1
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

      // Responsive design
      autosize: true,
      // Smooth animations
      transition: {
        duration: 300,
        easing: 'cubic-in-out'
      }
    };
  }, [priceData, panel1SliderRange]);

  // Memoized chart layout for panel 2
  const panel2ChartLayout = useMemo(() => {
    return {
      plot_bgcolor: 'rgba(0,0,0,0)',
      paper_bgcolor: 'rgba(0,0,0,0)',
      font: { 
        color: '#FFFFFF',
        family: 'Inter, system-ui, sans-serif'
      },
      xaxis: {
        title: {
          text: 'SOPR Value',
          font: { color: '#FFFFFF', size: 14 }
        },
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        zerolinecolor: 'rgba(55, 65, 81, 0.3)',
        showgrid: true,
        gridwidth: 0.5,
        tickfont: { color: '#FFFFFF', size: 12 },
        titlefont: { color: '#FFFFFF', size: 14 },
        showline: false
      },
      yaxis: {
        title: {
          text: 'Frequency',
          font: { color: '#FFFFFF', size: 14 }
        },
        type: 'linear',
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        zerolinecolor: 'rgba(55, 65, 81, 0.3)',
        showgrid: true,
        gridwidth: 0.5,
        tickfont: { color: '#FFFFFF', size: 12 },
        titlefont: { color: '#FFFFFF', size: 14 },
        showline: false
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

      // Responsive design
      autosize: true,
      // Smooth animations
      transition: {
        duration: 300,
        easing: 'cubic-in-out'
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
          <h1 className="text-3xl font-bold">SOPR Analysis</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading SOPR data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
          <h1 className="text-3xl font-bold">SOPR Analysis</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
      <header className="py-8 border-b border-white/20 w-full flex justify-center">
        <h1 className="text-3xl font-bold">SOPR Analysis</h1>
      </header>

      <div className="flex-1 p-6">
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
          {/* Panel 1 */}
          <div key="panel1" className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="h-full w-full p-4 flex flex-col">
              <div className="flex-1">
                <Plot
                  data={panel1ChartData}
                  layout={{
                    ...panel1ChartLayout,
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
              
              {/* Time range slider inside panel */}
              {priceData && panel1SliderRange && (
                <div className="w-full flex justify-center items-center mt-4">
                  <Slider.Root
                    className="relative w-full max-w-2xl h-6 flex items-center"
                    min={0}
                    max={priceData.dates.length - 1}
                    step={1}
                    value={panel1SliderRange}
                    onValueChange={([start, end]) => setPanel1SliderRange([start, end])}
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

          {/* Panel 2 */}
          <div key="panel2" className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="h-full w-full p-4 flex flex-col">
              <div className="flex-1">
                <Plot
                  data={panel2ChartData}
                  layout={{
                    ...panel2ChartLayout,
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
              
              {/* Time range slider inside panel */}
              {priceData && panel2SliderRange && (
                <div className="w-full flex justify-center items-center mt-4">
                  <Slider.Root
                    className="relative w-full max-w-2xl h-6 flex items-center"
                    min={0}
                    max={priceData.dates.length - 1}
                    step={1}
                    value={panel2SliderRange}
                    onValueChange={([start, end]) => setPanel2SliderRange([start, end])}
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
        </ResponsiveGridLayout>
      </div>
    </div>
  );
} 