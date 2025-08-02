'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, Target, Calendar, Clock } from 'lucide-react';
import dynamic from 'next/dynamic';
import * as Slider from '@radix-ui/react-slider';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    sopr?: number[];
    aSOPR?: number[];
  } | null>(null);
  
  // Dashboard time range (default for all panels)
  const [dashboardTimeRange, setDashboardTimeRange] = useState<[number, number] | null>(null);
  
  // Panel slider ranges (null = use dashboard, [start,end] = override)
  const [panel1SliderRange, setPanel1SliderRange] = useState<[number, number] | null>(null);
  const [panel2SliderRange, setPanel2SliderRange] = useState<[number, number] | null>(null);
  const [panel3SliderRange, setPanel3SliderRange] = useState<[number, number] | null>(null);
  const [panel4SliderRange, setPanel4SliderRange] = useState<[number, number] | null>(null);

  // Time picker state
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Grid layout configuration
  const [layouts, setLayouts] = useState({
    lg: [
      { i: 'panel1', x: 0, y: 0, w: 8, h: 8, minW: 4, minH: 4 },
      { i: 'panel2', x: 8, y: 0, w: 4, h: 8, minW: 2, minH: 4 },
      { i: 'panel3', x: 0, y: 8, w: 8, h: 8, minW: 4, minH: 4 },
      { i: 'panel4', x: 8, y: 8, w: 4, h: 8, minW: 2, minH: 4 }
    ],
    md: [
      { i: 'panel1', x: 0, y: 0, w: 7, h: 6, minW: 4, minH: 3 },
      { i: 'panel2', x: 7, y: 0, w: 3, h: 6, minW: 2, minH: 3 },
      { i: 'panel3', x: 0, y: 6, w: 7, h: 6, minW: 4, minH: 3 },
      { i: 'panel4', x: 7, y: 6, w: 3, h: 6, minW: 2, minH: 3 }
    ],
    sm: [
      { i: 'panel1', x: 0, y: 0, w: 4, h: 4, minW: 2, minH: 2 },
      { i: 'panel2', x: 4, y: 0, w: 2, h: 4, minW: 1, minH: 2 },
      { i: 'panel3', x: 0, y: 4, w: 4, h: 4, minW: 2, minH: 2 },
      { i: 'panel4', x: 4, y: 4, w: 2, h: 4, minW: 1, minH: 2 }
    ],
    xs: [
      { i: 'panel1', x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'panel2', x: 3, y: 0, w: 1, h: 3, minW: 1, minH: 2 },
      { i: 'panel3', x: 0, y: 3, w: 3, h: 3, minW: 2, minH: 2 },
      { i: 'panel4', x: 3, y: 3, w: 1, h: 3, minW: 1, minH: 2 }
    ],
    xxs: [
      { i: 'panel1', x: 0, y: 0, w: 2, h: 2, minW: 1, minH: 1 },
      { i: 'panel2', x: 2, y: 0, w: 1, h: 2, minW: 1, minH: 1 },
      { i: 'panel3', x: 0, y: 2, w: 2, h: 2, minW: 1, minH: 1 },
      { i: 'panel4', x: 2, y: 2, w: 1, h: 2, minW: 1, minH: 1 }
    ]
  });

  // Fetch price data
  useEffect(() => {
    async function fetchPriceData() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('https://bitcoinresearchkit.org/api/vecs/query?index=dateindex&ids=date,close,spent-output-profit-ratio,short-term-holders-adjusted-spent-output-profit-ratio&format=json');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price data: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length < 4) {
          throw new Error('Invalid data format');
        }

        const [dates, close, sopr, sthSOPR] = data;
        setPriceData({
          dates,
          prices: close,
          sopr: sopr,
          aSOPR: sthSOPR
        });
        
        // Initialize dashboard time range to last 8 years
        setDashboardTimeRange([Math.max(0, dates.length - 2920), dates.length - 1]);
        
        // Set initial date inputs
        setStartDate(dates[Math.max(0, dates.length - 2920)]);
        setEndDate(dates[dates.length - 1]);
        
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
    // Reset panel overrides when dashboard time changes
    setPanel1SliderRange(null);
    setPanel2SliderRange(null);
    
    // Update date inputs
    if (priceData) {
      setStartDate(priceData.dates[newRange[0]]);
      setEndDate(priceData.dates[newRange[1]]);
    }
  };

  // Handle custom date change
  const handleCustomDateChange = () => {
    if (!priceData || !startDate || !endDate) return;
    
    const startIndex = priceData.dates.indexOf(startDate);
    const endIndex = priceData.dates.indexOf(endDate);
    
    if (startIndex !== -1 && endIndex !== -1) {
      handleDashboardTimeChange([startIndex, endIndex]);
    }
  };

  // Handle layout changes
  const onLayoutChange = (currentLayout: any, allLayouts: any) => {
    setLayouts(allLayouts);
  };

  // Get effective time range for each panel
  const panel1EffectiveRange = panel1SliderRange || dashboardTimeRange;
  const panel2EffectiveRange = panel2SliderRange || dashboardTimeRange;
  const panel3EffectiveRange = panel3SliderRange || dashboardTimeRange;
  const panel4EffectiveRange = panel4SliderRange || dashboardTimeRange;

  // Format date range for display
  const formatDateRange = () => {
    if (!dashboardTimeRange || !priceData) return 'Select time range';
    
    const start = priceData.dates[dashboardTimeRange[0]];
    const end = priceData.dates[dashboardTimeRange[1]];
    
    return `${start} to ${end}`;
  };

  // Memoized chart data for panel 1
  const panel1ChartData = useMemo(() => {
    if (!priceData || !panel1EffectiveRange) return [];

    const [start, end] = panel1EffectiveRange;
    
    const dates = priceData.dates.slice(start, end + 1);
    const prices = priceData.prices.slice(start, end + 1);
    const sopr = priceData.sopr?.slice(start, end + 1) || [];

    // Get latest values for legend
    const latestPrice = prices[prices.length - 1];
    const latestSOPR = sopr[sopr.length - 1];
    
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
        y: sopr,
        type: 'scatter',
        mode: 'lines',
        name: `SOPR: ${latestSOPR?.toFixed(3) || 'N/A'}`,
        line: { 
          color: '#F59E0B', 
          width: 1.5,
          shape: 'linear',
          opacity: 0.5
        },
        yaxis: 'y2',
        hovertemplate: 
          '<b>SOPR</b><br>' +
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
  }, [priceData, panel1EffectiveRange]);

  // Memoized chart data for panel 2
  const panel2ChartData = useMemo(() => {
    if (!priceData || !panel2EffectiveRange) return [];

    const [start, end] = panel2EffectiveRange;
    
    const sopr = priceData.sopr?.slice(start, end + 1) || [];

    // Calculate distribution bins
    const minSOPR = Math.min(...sopr);
    const maxSOPR = Math.max(...sopr);
    const binCount = 50;
    const binSize = (maxSOPR - minSOPR) / binCount;
    
    const bins = Array(binCount).fill(0);
    const binCenters = [];
    
    for (let i = 0; i < binCount; i++) {
      binCenters.push(minSOPR + (i + 0.5) * binSize);
    }
    
    // Count values in each bin
    sopr.forEach(value => {
      const binIndex = Math.min(Math.floor((value - minSOPR) / binSize), binCount - 1);
      bins[binIndex]++;
    });

    // Get current SOPR value (latest value)
    const currentSOPR = sopr[sopr.length - 1];
    
    // Find which bin contains the current value
    const currentBinIndex = Math.min(Math.floor((currentSOPR - minSOPR) / binSize), binCount - 1);
    
    // Calculate cumulative distribution
    const cumulative = [];
    let sum = 0;
    const total = bins.reduce((a, b) => a + b, 0);
    
    for (let i = 0; i < bins.length; i++) {
      sum += bins[i];
      cumulative.push((sum / total) * 100);
    }
    
    return [
      {
        x: binCenters,
        y: bins,
        type: 'bar',
        name: 'SOPR Distribution',
        marker: {
          color: binCenters.map((_, index) => 
            index === currentBinIndex ? '#33B1FF' : '#F59E0B'
          ),
          opacity: 0.8,
          line: {
            color: binCenters.map((_, index) => 
              index === currentBinIndex ? '#33B1FF' : 'transparent'
            ),
            width: binCenters.map((_, index) => 
              index === currentBinIndex ? 2 : 0
            )
          }
        },
        hovertemplate: 
          '<b>SOPR Distribution</b><br>' +
          'SOPR Value: %{x:.3f}<br>' +
          'Frequency: %{y}<br>' +
          (binCenters.map((_, index) => index === currentBinIndex ? '<br><b>Current Value</b>' : '')) +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#F59E0B',
          font: { color: '#FFFFFF', size: 12 }
        }
      },
      // Cumulative distribution line
      {
        x: binCenters,
        y: cumulative,
        type: 'scatter',
        mode: 'lines',
        name: 'Cumulative %',
        line: {
          color: '#FFFFFF',
          width: 1.5
        },
        yaxis: 'y2',
        hovertemplate: 
          '<b>Cumulative Distribution</b><br>' +
          'SOPR Value: %{x:.3f}<br>' +
          'Cumulative %: %{y:.1f}%<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#FFFFFF',
          font: { color: '#FFFFFF', size: 12 }
        }
      }
    ];
  }, [priceData, panel2EffectiveRange]);

  // Memoized chart data for panel 3 (STH SOPR Time Series)
  const panel3ChartData = useMemo(() => {
    if (!priceData || !panel3EffectiveRange) return [];

    const [start, end] = panel3EffectiveRange;
    
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
          shape: 'linear',
          opacity: 0.5
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
  }, [priceData, panel3EffectiveRange]);

  // Memoized chart data for panel 4 (STH SOPR Distribution)
  const panel4ChartData = useMemo(() => {
    if (!priceData || !panel4EffectiveRange) return [];

    const [start, end] = panel4EffectiveRange;
    
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

    // Get current SOPR value (latest value)
    const currentSOPR = aSOPR[aSOPR.length - 1];
    
    // Find which bin contains the current value
    const currentBinIndex = Math.min(Math.floor((currentSOPR - minSOPR) / binSize), binCount - 1);
    
    // Calculate cumulative distribution
    const cumulative = [];
    let sum = 0;
    const total = bins.reduce((a, b) => a + b, 0);
    
    for (let i = 0; i < bins.length; i++) {
      sum += bins[i];
      cumulative.push((sum / total) * 100);
    }
    
    return [
      {
        x: binCenters,
        y: bins,
        type: 'bar',
        name: 'STH SOPR Distribution',
        marker: {
          color: binCenters.map((_, index) => 
            index === currentBinIndex ? '#33B1FF' : '#F59E0B'
          ),
          opacity: 0.8,
          line: {
            color: binCenters.map((_, index) => 
              index === currentBinIndex ? '#33B1FF' : 'transparent'
            ),
            width: binCenters.map((_, index) => 
              index === currentBinIndex ? 2 : 0
            )
          }
        },
        hovertemplate: 
          '<b>STH SOPR Distribution</b><br>' +
          'STH SOPR Value: %{x:.3f}<br>' +
          'Frequency: %{y}<br>' +
          (binCenters.map((_, index) => index === currentBinIndex ? '<br><b>Current Value</b>' : '')) +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#F59E0B',
          font: { color: '#FFFFFF', size: 12 }
        }
      },
      // Cumulative distribution line
      {
        x: binCenters,
        y: cumulative,
        type: 'scatter',
        mode: 'lines',
        name: 'Cumulative %',
        line: {
          color: '#FFFFFF',
          width: 1.5
        },
        yaxis: 'y2',
        hovertemplate: 
          '<b>Cumulative Distribution</b><br>' +
          'STH SOPR Value: %{x:.3f}<br>' +
          'Cumulative %: %{y:.1f}%<br>' +
          '<extra></extra>',
        hoverlabel: {
          bgcolor: 'rgba(0, 0, 0, 0.8)',
          bordercolor: '#FFFFFF',
          font: { color: '#FFFFFF', size: 12 }
        }
      }
    ];
  }, [priceData, panel4EffectiveRange]);

  // Memoized chart layout for panel 1
  const panel1ChartLayout = useMemo(() => {
    // Get the date range for the current slider selection
    let xaxisRange = undefined;
    
    if (priceData && panel1EffectiveRange) {
      const [start, end] = panel1EffectiveRange;
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
  }, [priceData, panel1EffectiveRange]);

  // Memoized chart layout for panel 2
  const panel2ChartLayout = useMemo(() => {
    // Calculate the actual range of SOPR values for the selected time period
    let xaxisRange = undefined;
    
    if (priceData && panel2EffectiveRange) {
      const [start, end] = panel2EffectiveRange;
      const aSOPR = priceData.aSOPR?.slice(start, end + 1) || [];
      
      if (aSOPR.length > 0) {
        const minSOPR = Math.min(...aSOPR);
        const maxSOPR = Math.max(...aSOPR);
        const padding = (maxSOPR - minSOPR) * 0.05; // Add 5% padding
        xaxisRange = [minSOPR - padding, maxSOPR + padding];
      }
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
          text: 'SOPR Value',
          font: { color: '#FFFFFF', size: 14 }
        },
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        zerolinecolor: 'rgba(55, 65, 81, 0.3)',
        showgrid: true,
        gridwidth: 0.5,
        tickfont: { color: '#FFFFFF', size: 12 },
        titlefont: { color: '#FFFFFF', size: 14 },
        showline: false,
        range: xaxisRange,
        autorange: !xaxisRange // Auto-range if no specific range is set
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
        showline: false,
        autorange: true
      },
      yaxis2: {
        title: {
          text: 'Cumulative %',
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
        position: 1,
        range: [0, 100]
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
  }, [priceData, panel2EffectiveRange]);

  // Memoized chart layout for panel 3 (STH SOPR Time Series)
  const panel3ChartLayout = useMemo(() => {
    // Get the date range for the current slider selection
    let xaxisRange = undefined;
    
    if (priceData && panel3EffectiveRange) {
      const [start, end] = panel3EffectiveRange;
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
  }, [priceData, panel3EffectiveRange]);

  // Memoized chart layout for panel 4 (STH SOPR Distribution)
  const panel4ChartLayout = useMemo(() => {
    // Calculate the actual range of STH SOPR values for the selected time period
    let xaxisRange = undefined;
    
    if (priceData && panel4EffectiveRange) {
      const [start, end] = panel4EffectiveRange;
      const aSOPR = priceData.aSOPR?.slice(start, end + 1) || [];
      
      if (aSOPR.length > 0) {
        const minSOPR = Math.min(...aSOPR);
        const maxSOPR = Math.max(...aSOPR);
        const padding = (maxSOPR - minSOPR) * 0.05; // Add 5% padding
        xaxisRange = [minSOPR - padding, maxSOPR + padding];
      }
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
          text: 'STH SOPR Value',
          font: { color: '#FFFFFF', size: 14 }
        },
        gridcolor: 'rgba(55, 65, 81, 0.3)',
        zerolinecolor: 'rgba(55, 65, 81, 0.3)',
        showgrid: true,
        gridwidth: 0.5,
        tickfont: { color: '#FFFFFF', size: 12 },
        titlefont: { color: '#FFFFFF', size: 14 },
        showline: false,
        range: xaxisRange,
        autorange: !xaxisRange // Auto-range if no specific range is set
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
        showline: false,
        autorange: true
      },
      yaxis2: {
        title: {
          text: 'Cumulative %',
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
        position: 1,
        range: [0, 100]
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
  }, [priceData, panel4EffectiveRange]);

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
      <header className="py-8 border-b border-white/20 w-full flex justify-between items-center px-6">
        <div className="flex-1"></div>
        <h1 className="text-3xl font-bold">SOPR</h1>
        <div className="flex-1 flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="bg-slate-950 border-slate-700 text-white hover:bg-slate-900">
                <Clock className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 bg-slate-950 border-slate-700 text-white">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Time Range</h4>
                  <p className="text-sm text-slate-400">
                    Select a time range for all panels
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <label htmlFor="start-date" className="text-sm font-medium">From</label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="col-span-2 bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <label htmlFor="end-date" className="text-sm font-medium">To</label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="col-span-2 bg-slate-900 border-slate-600 text-white"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Quick Ranges</h4>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 1), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      1 day
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 7), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      7 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 30), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      30 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 90), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      90 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 180), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      180 days
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 365), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      1yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 730), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      2yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 1095), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      3yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 1460), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      4yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 1825), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      5yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 2190), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      6yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 2555), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      7yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 2920), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      8yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 3285), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      9yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([Math.max(0, (priceData?.dates.length || 0) - 3650), (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      10yr
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDashboardTimeChange([0, (priceData?.dates.length || 0) - 1])}
                      className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                    >
                      All
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCustomDateChange}
                    className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
                  >
                    Apply
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
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
              <div className="flex-1" onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>
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
              {priceData && (
                <div className="w-full flex justify-center items-center mt-4">
                  <Slider.Root
                    className="relative w-full max-w-2xl h-6 flex items-center"
                    min={0}
                    max={priceData.dates.length - 1}
                    step={1}
                    value={panel1EffectiveRange || [0, 0]}
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
              <div className="flex-1" onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>
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
              {priceData && (
                <div className="w-full flex justify-center items-center mt-4">
                  <Slider.Root
                    className="relative w-full max-w-2xl h-6 flex items-center"
                    min={0}
                    max={priceData.dates.length - 1}
                    step={1}
                    value={panel2EffectiveRange || [0, 0]}
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

          {/* Panel 3 */}
          <div key="panel3" className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="h-full w-full p-4 flex flex-col">
              <div className="flex-1" onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>
                <Plot
                  data={panel3ChartData}
                  layout={{
                    ...panel3ChartLayout,
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
              {priceData && (
                <div className="w-full flex justify-center items-center mt-4">
                  <Slider.Root
                    className="relative w-full max-w-2xl h-6 flex items-center"
                    min={0}
                    max={priceData.dates.length - 1}
                    step={1}
                    value={panel3EffectiveRange || [0, 0]}
                    onValueChange={([start, end]) => setPanel3SliderRange([start, end])}
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

          {/* Panel 4 */}
          <div key="panel4" className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
            <div className="h-full w-full p-4 flex flex-col">
              <div className="flex-1" onMouseDown={(e) => e.stopPropagation()} onMouseMove={(e) => e.stopPropagation()}>
                <Plot
                  data={panel4ChartData}
                  layout={{
                    ...panel4ChartLayout,
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
              {priceData && (
                <div className="w-full flex justify-center items-center mt-4">
                  <Slider.Root
                    className="relative w-full max-w-2xl h-6 flex items-center"
                    min={0}
                    max={priceData.dates.length - 1}
                    step={1}
                    value={panel4EffectiveRange || [0, 0]}
                    onValueChange={([start, end]) => setPanel4SliderRange([start, end])}
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