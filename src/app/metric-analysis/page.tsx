'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Minus, BarChart3, Activity, Target } from 'lucide-react';
import { ALL_METRICS_LIST, METRIC_DISPLAY_NAMES, METRIC_GROUPS } from '@/datamanager/metricsConfig';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

export default function MetricAnalysis() {
  const [selectedMetric, setSelectedMetric] = useState<string>('close');
  const [timeframe, setTimeframe] = useState<string>('1y');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to get metric group info
  const getMetricGroup = (metricKey: string) => {
    for (const group of METRIC_GROUPS) {
      const metric = group.metrics.find(m => m.key === metricKey);
      if (metric) {
        return { group, metric };
      }
    }
    return null;
  };

  // Helper function to format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Helper function to format percentage
  const formatPercentage = (value: number): string => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
          <h1 className="text-3xl font-bold">Metric Analysis</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading metric analysis...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
          <h1 className="text-3xl font-bold">Metric Analysis</h1>
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
        <h1 className="text-3xl font-bold">Metric Analysis</h1>
      </header>

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Comprehensive Metric Analytics</h2>
            <p className="text-gray-300 leading-relaxed">
              Deep dive into specific metrics with detailed charts, statistics, and insights. 
              Analyze historical patterns, correlations, and performance indicators.
            </p>
          </div>

          {/* Controls Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Analysis Controls</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Metric</label>
                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                  <SelectTrigger className="w-full bg-slate-900 border border-slate-700 text-white">
                    <SelectValue placeholder="Choose a metric" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border border-slate-700">
                    {METRIC_GROUPS.map((group) => (
                      <div key={group.name}>
                        <div className="px-2 py-1 text-xs font-medium text-gray-400 uppercase tracking-wide">
                          {group.name}
                        </div>
                        {group.metrics.map((metric) => (
                          <SelectItem 
                            key={metric.key} 
                            value={metric.key}
                            className="text-white hover:bg-slate-800"
                          >
                            {metric.name}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Timeframe</label>
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-full bg-slate-900 border border-slate-700 text-white">
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border border-slate-700">
                    <SelectItem value="1m" className="text-white hover:bg-slate-800">1 Month</SelectItem>
                    <SelectItem value="3m" className="text-white hover:bg-slate-800">3 Months</SelectItem>
                    <SelectItem value="6m" className="text-white hover:bg-slate-800">6 Months</SelectItem>
                    <SelectItem value="1y" className="text-white hover:bg-slate-800">1 Year</SelectItem>
                    <SelectItem value="2y" className="text-white hover:bg-slate-800">2 Years</SelectItem>
                    <SelectItem value="all" className="text-white hover:bg-slate-800">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Current Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,123</div>
                <p className="text-xs text-green-400 mt-1">+2.34% today</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">30-Day Change</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">+12.5%</div>
                <p className="text-xs text-gray-400 mt-1">vs previous period</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Volatility</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-400">Medium</div>
                <p className="text-xs text-gray-400 mt-1">Standard deviation: 15.2%</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">Bullish</div>
                <p className="text-xs text-gray-400 mt-1">Above 200-day SMA</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Chart Area */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">
              {METRIC_DISPLAY_NAMES[selectedMetric]} - Historical Analysis
            </h3>
            <div className="h-96 bg-slate-900 rounded border border-slate-700 flex items-center justify-center">
              <div className="text-gray-400 text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chart visualization coming soon...</p>
                <p className="text-sm mt-2">Selected: {METRIC_DISPLAY_NAMES[selectedMetric]}</p>
              </div>
            </div>
          </div>

          {/* Additional Analysis Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Correlation Analysis */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Correlation Analysis
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
                  <span className="text-sm">Bitcoin Price</span>
                  <span className="text-green-400 font-medium">+0.89</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
                  <span className="text-sm">Market Cap</span>
                  <span className="text-green-400 font-medium">+0.92</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
                  <span className="text-sm">Trading Volume</span>
                  <span className="text-yellow-400 font-medium">+0.45</span>
                </div>
              </div>
            </div>

            {/* Statistical Summary */}
            <div className="bg-slate-950 border border-slate-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Statistical Summary
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
                  <span className="text-sm">Mean</span>
                  <span className="font-medium">$42,156</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
                  <span className="text-sm">Median</span>
                  <span className="font-medium">$41,890</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
                  <span className="text-sm">Standard Deviation</span>
                  <span className="font-medium">$8,234</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-900 rounded border border-slate-700">
                  <span className="text-sm">Range</span>
                  <span className="font-medium">$28,450 - $69,200</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 