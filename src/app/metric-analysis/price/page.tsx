'use client';

import { useState, useEffect, useMemo } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, Target } from 'lucide-react';
import dynamic from 'next/dynamic';
import * as Slider from '@radix-ui/react-slider';
import { fetchAllMetrics } from '@/datamanager';
import { getApiUrl } from '@/lib/config';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function PriceAnalysis() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<{ 
    dates: string[]; 
    prices: number[];
    realizedPrice?: number[];
    trueMarketMean?: number[];
    vaultedPrice?: number[];
  } | null>(null);
  
  // Dashboard time range (default for all panels)
  const [dashboardTimeRange, setDashboardTimeRange] = useState<[number, number] | null>(null);

  // Fetch price data
  useEffect(() => {
    async function fetchPriceData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/bitview?index=dateindex&ids=date,price_close,realized_price,true_market_mean,vaulted_price&format=json');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price data: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length < 5) {
          throw new Error('Invalid data format');
        }

        const [dates, close, realizedPrice, trueMarketMean, vaultedPrice] = data;
        setPriceData({
          dates,
          prices: close,
          realizedPrice,
          trueMarketMean,
          vaultedPrice
        });
        
        // Initialize dashboard time range to last 8 years
        setDashboardTimeRange([Math.max(0, dates.length - 2920), dates.length - 1]);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch price data');
      } finally {
        setLoading(false);
      }
    }

    fetchPriceData();
  }, []);

  // Handle dashboard time range change
  const handleDashboardTimeChange = (newRange: [number, number]) => {
    setDashboardTimeRange(newRange);
  };

  // Get effective time range for the chart
  const effectiveTimeRange = dashboardTimeRange;

  // Memoized chart data for price chart
  const priceChartData = useMemo(() => {
    if (!priceData || !effectiveTimeRange) return [];

    const [start, end] = effectiveTimeRange;
    
    const dates = priceData.dates.slice(start, end + 1);
    const prices = priceData.prices.slice(start, end + 1);
    const realizedPrice = priceData.realizedPrice?.slice(start, end + 1);
    const trueMarketMean = priceData.trueMarketMean?.slice(start, end + 1);
    const vaultedPrice = priceData.vaultedPrice?.slice(start, end + 1);

    return [
      {
        x: dates,
        y: prices,
        type: 'scatter',
        mode: 'lines',
        name: 'Bitcoin Price',
        line: { 
          color: '#33B1FF', 
          width: 2,
          shape: 'linear'
        },
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
        y: realizedPrice,
        type: 'scatter',
        mode: 'lines',
        name: 'Realized Price',
        line: { 
          color: '#F59E0B', 
          width: 1.5,
          shape: 'linear'
        },
        hovertemplate: 
          '<b>Realized Price</b><br>' +
          'Date: %{x}<br>' +
          'Price: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#F59E0B',
          font: { color: '#FFFFFF', size: 12 }
        }
      },
      {
        x: dates,
        y: trueMarketMean,
        type: 'scatter',
        mode: 'lines',
        name: 'True Market Mean',
        line: { 
          color: '#10B981', 
          width: 1.5,
          shape: 'linear'
        },
        hovertemplate: 
          '<b>True Market Mean</b><br>' +
          'Date: %{x}<br>' +
          'Price: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#10B981',
          font: { color: '#FFFFFF', size: 12 }
        }
      },
      {
        x: dates,
        y: vaultedPrice,
        type: 'scatter',
        mode: 'lines',
        name: 'Vaulted Price',
        line: { 
          color: '#8B5CF6', 
          width: 1.5,
          shape: 'linear'
        },
        hovertemplate: 
          '<b>Vaulted Price</b><br>' +
          'Date: %{x}<br>' +
          'Price: $%{y:,.0f}<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#8B5CF6',
          font: { color: '#FFFFFF', size: 12 }
        }
      }
    ];
  }, [priceData, effectiveTimeRange]);

  // Memoized chart layout
  const priceChartLayout = useMemo(() => {
    // Get the date range for the current slider selection
    let xaxisRange = undefined;
    
    if (priceData && effectiveTimeRange) {
      const [start, end] = effectiveTimeRange;
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
        showline: true,
        linecolor: '#374151',
        linewidth: 1,
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
        tickformat: ',.0s',
        tickprefix: '$',
        showline: true,
        linecolor: '#374151',
        linewidth: 1,
        side: 'right',
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

      // Responsive design
      autosize: true,
      // Smooth animations
      transition: {
        duration: 300,
        easing: 'cubic-in-out'
      }
    };
  }, [priceData, effectiveTimeRange]);

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading price data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-red-400">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">

      <div className="flex-1 p-6">
        <div className="h-full w-full">
          {/* Price Chart Panel - Full Page */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-lg h-[calc(100vh-8rem)] w-full">
            {/* Chart Container */}
            <div className="h-full w-full p-4 flex flex-col">
              <div className="flex-1 relative">
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
              
              {/* Time range slider at bottom */}
              {priceData && effectiveTimeRange && (
                <div className="w-full flex justify-center items-center mt-4">
                  <Slider.Root
                    className="relative w-full max-w-2xl h-6 flex items-center"
                    min={0}
                    max={priceData.dates.length - 1}
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
        </div>
      </div>
    </div>
  );
} 