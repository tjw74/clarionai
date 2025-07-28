'use client';

import { useState, useEffect, useMemo } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import * as Slider from '@radix-ui/react-slider';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function SOPRAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ 
    dates: string[]; 
    prices: number[];
    aSOPR?: number[];
  } | null>(null);
  const [panelSize, setPanelSize] = useState({ width: 800, height: 500 });
  const [panelPosition, setPanelPosition] = useState({ x: 0, y: 0 });
  const [sliderRange, setSliderRange] = useState<[number, number] | null>(null);

  // Resize functionality
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.cursor-se-resize')) return;

      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startWidth = panelSize.width;
      const startHeight = panelSize.height;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        setPanelSize({
          width: Math.max(600, startWidth + deltaX),
          height: Math.max(400, startHeight + deltaY)
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [panelSize.width, panelSize.height]);

  // Drag functionality
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.cursor-move')) return;

      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startPosX = panelPosition.x;
      const startPosY = panelPosition.y;

      const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        setPanelPosition({
          x: startPosX + deltaX,
          y: startPosY + deltaY
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [panelPosition.x, panelPosition.y]);

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
        
        // Initialize slider range to full dataset
        setSliderRange([0, dates.length - 1]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch price data');
      } finally {
        setLoading(false);
      }
    }

    fetchPriceData();
  }, []);

  // Memoized chart data for price chart
  const priceChartData = useMemo(() => {
    if (!priceData || !sliderRange) return [];

    const [start, end] = sliderRange;
    
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
  }, [priceData, sliderRange]);

  // Memoized chart layout
  const priceChartLayout = useMemo(() => {
    // Get the date range for the current slider selection
    let xaxisRange = undefined;
    
    if (priceData && sliderRange) {
      const [start, end] = sliderRange;
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
  }, [priceData, sliderRange]);

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
        <div className="grid grid-cols-1 gap-6 h-full">
          {/* SOPR Chart Panel - Grafana Style Resizable */}
          <div 
            className="relative bg-slate-950 border border-slate-800 rounded-lg" 
            style={{ 
              width: `${panelSize.width}px`, 
              height: `${panelSize.height}px`,
              minHeight: '400px', 
              minWidth: '600px',
              transform: `translate(${panelPosition.x}px, ${panelPosition.y}px)`
            }}
          >
            {/* Drag Handle - Top Right */}
            <div className="absolute top-0 right-0 w-4 h-4 cursor-move z-10">
              <div className="w-full h-full flex items-start justify-end">
                <div className="w-3 h-3 flex items-start justify-end">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-60 hover:opacity-100 transition-opacity">
                    <circle cx="10" cy="2" r="1.5" fill="#334155"/>
                    <circle cx="8" cy="4" r="1.5" fill="#334155"/>
                    <circle cx="10" cy="4" r="1.5" fill="#334155"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Resize Handle - Bottom Right */}
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10">
              <div className="w-full h-full flex items-end justify-end">
                <div className="w-3 h-3 flex items-end justify-end">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="opacity-60 hover:opacity-100 transition-opacity">
                    <circle cx="10" cy="10" r="1.5" fill="#334155"/>
                    <circle cx="8" cy="8" r="1.5" fill="#334155"/>
                    <circle cx="10" cy="8" r="1.5" fill="#334155"/>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Chart Container */}
            <div className="h-full w-full p-4 flex flex-col">
              <div className="flex-1">
                <Plot
                  data={priceChartData}
                  layout={{
                    ...priceChartLayout,
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
              {priceData && sliderRange && (
                <div className="w-full flex justify-center items-center mt-4">
                  <Slider.Root
                    className="relative w-full max-w-2xl h-6 flex items-center"
                    min={0}
                    max={priceData.dates.length - 1}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 