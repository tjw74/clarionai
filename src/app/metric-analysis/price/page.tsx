'use client';

import { useState, useEffect, useMemo } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, Target } from 'lucide-react';
import dynamic from 'next/dynamic';

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
  const [panelSize, setPanelSize] = useState({ width: 800, height: 500 });

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

  // Fetch price data
  useEffect(() => {
    async function fetchPriceData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('https://bitcoinresearchkit.org/api/vecs/query?index=dateindex&ids=date,close,realized-price,true-market-mean,vaulted-price&format=json');
        
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
    if (!priceData) return [];

    return [
      {
        x: priceData.dates,
        y: priceData.prices,
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
        x: priceData.dates,
        y: priceData.realizedPrice,
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
        x: priceData.dates,
        y: priceData.trueMarketMean,
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
        x: priceData.dates,
        y: priceData.vaultedPrice,
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
  }, [priceData]);

  // Memoized chart layout
  const priceChartLayout = useMemo(() => ({
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
      gridcolor: '#374151',
      zerolinecolor: '#374151',
      showgrid: true,
      gridwidth: 1,
      tickfont: { color: '#FFFFFF', size: 12 },
      titlefont: { color: '#FFFFFF', size: 14 },
      type: 'date',
      tickformat: '%b %Y',
      tickangle: 0,
      showline: true,
      linecolor: '#374151',
      linewidth: 1
    },
    yaxis: {
      title: {
        text: '',
        font: { color: '#FFFFFF', size: 14 }
      },
      type: 'log',
      gridcolor: '#374151',
      zerolinecolor: '#374151',
      showgrid: true,
      gridwidth: 1,
      tickfont: { color: '#FFFFFF', size: 12 },
      titlefont: { color: '#FFFFFF', size: 14 },
      tickformat: ',.0s',
      tickprefix: '$',
      showline: true,
      linecolor: '#374151',
      linewidth: 1,
      side: 'right',
      // Log base 2 configuration
      dtick: 'L2',
      tickmode: 'auto',
      nticks: 8,
      // Set range to include full price range including $120k+ peak
      range: [Math.log10(0.01), Math.log10(200000)]
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
    // Professional styling
    modebar: {
      bgcolor: 'rgba(0,0,0,0.8)',
      color: '#FFFFFF',
      activecolor: '#33B1FF',
      orientation: 'h',  // 'h' for horizontal, 'v' for vertical
      x: 0,  // Position from left
      y: 1   // Position from top
    },
    // Responsive design
    autosize: true,
    // Smooth animations
    transition: {
      duration: 300,
      easing: 'cubic-in-out'
    }
  }), []);

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
          <h1 className="text-3xl font-bold">Price Analysis</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading price data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
          <h1 className="text-3xl font-bold">Price Analysis</h1>
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
        <h1 className="text-3xl font-bold">Price Analysis</h1>
      </header>

            <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-6 h-full">
          {/* Price Chart Panel - Grafana Style Resizable */}
          <div 
            className="relative bg-slate-950 border border-slate-800 rounded-lg" 
            style={{ 
              width: `${panelSize.width}px`, 
              height: `${panelSize.height}px`,
              minHeight: '400px', 
              minWidth: '600px' 
            }}
          >
            {/* Resize Handle - Bottom Right */}
            <div className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-10">
              <div className="w-full h-full flex items-end justify-end">
                <div className="w-3 h-3 bg-slate-600 rounded-sm opacity-50 hover:opacity-100 transition-opacity"></div>
              </div>
            </div>
            
            {/* Chart Container */}
            <div className="h-full w-full p-4 relative">
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
                  displayModeBar: 'hover',
                  modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
                  displaylogo: false,
                  modeBarButtonsToAdd: [],
                  toImageButtonOptions: {
                    format: 'png',
                    filename: 'bitcoin_price_chart',
                    height: undefined,
                    width: undefined,
                    scale: 1
                  }
                }}
                style={{ width: '100%', height: '100%' }}
                useResizeHandler={true}
              />
              {/* Custom CSS to move the modebar */}
              <style jsx>{`
                .js-plotly-plot .plotly .modebar {
                  top: 10px !important;
                  left: 10px !important;
                  right: auto !important;
                  bottom: auto !important;
                }
              `}</style>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 