'use client';

import { useState, useEffect, useMemo } from 'react';
import { useDCARankings } from '@/hooks/useDCARankings';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, DollarSign, Bitcoin } from 'lucide-react';
import { DCA_CONFIG } from '@/datamanager/metricsConfig';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

interface DCARankerConfig {
  budgetPerDay: number;
  windowSize: number;
  zoneSize: number;
  dailyBudgetCap: number; // Added daily budget cap
}

export default function DCARanker() {
  const [config, setConfig] = useState<DCARankerConfig>({
    budgetPerDay: DCA_CONFIG.DEFAULT_BUDGET_PER_DAY,
    windowSize: 30, // Default to 30 days for faster testing
    zoneSize: DCA_CONFIG.DEFAULT_ZONE_SIZE,
    dailyBudgetCap: DCA_CONFIG.DEFAULT_DAILY_BUDGET_CAP, // Added daily budget cap
  });

  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [selectedStrategyIndex, setSelectedStrategyIndex] = useState(0);
  const [hiddenTraces, setHiddenTraces] = useState<Set<string>>(new Set()); // Track hidden traces by name

  const { rankings, topPerformers: fetchedTopPerformers, stats, loading, error } = useDCARankings(config);

  // Update topPerformers when fetched data changes
  useEffect(() => {
    if (fetchedTopPerformers.length > 0) {
      setTopPerformers(fetchedTopPerformers);
    }
  }, [fetchedTopPerformers]);

  // Memoized chart data for top chart
  const topChartData = useMemo(() => {
    if (!topPerformers[selectedStrategyIndex]) return [];
    
    const traces = [
      // Price line (left Y-axis)
      {
        x: topPerformers[selectedStrategyIndex]?.dates?.slice(-config.windowSize) || [],
        y: topPerformers[selectedStrategyIndex]?.prices?.slice(-config.windowSize) || [],
        type: 'scatter',
        mode: 'lines',
        name: 'Bitcoin Price',
        line: { color: '#33B1FF', width: 2 },
        yaxis: 'y',
        hovertemplate: 'Date: %{x}<br>Price: $%{y:,.0f}<extra></extra>'
      },
      // On-chain metric (right Y-axis)
      {
        x: topPerformers[selectedStrategyIndex]?.dates?.slice(-config.windowSize) || [],
        y: topPerformers[selectedStrategyIndex]?.metricValues?.slice(-config.windowSize) || [],
        type: 'scatter',
        mode: 'lines',
        name: `${topPerformers[selectedStrategyIndex]?.metricName} (Metric)`,
        line: { color: '#F59E0B', width: 1 },
        yaxis: 'y2',
        hovertemplate: 'Date: %{x}<br>Metric: %{y:,.2f}<extra></extra>'
      },
      // Z-score (right Y-axis, secondary)
      {
        x: topPerformers[selectedStrategyIndex]?.dates?.slice(-config.windowSize) || [],
        y: topPerformers[selectedStrategyIndex]?.zScores?.slice(-config.windowSize) || [],
        type: 'scatter',
        mode: 'lines',
        name: `${topPerformers[selectedStrategyIndex]?.metricName} (Z-Score)`,
        line: { color: '#EF4444', width: 1, dash: 'dash' },
        yaxis: 'y3',
        hovertemplate: 'Date: %{x}<br>Z-Score: %{y:,.2f}<extra></extra>'
      }
    ];
    
    // Filter out hidden traces
    return traces.filter((trace: any) => !hiddenTraces.has(trace.name));
  }, [topPerformers, selectedStrategyIndex, config.windowSize, hiddenTraces]);

  // Memoized chart data for bottom chart
  const bottomChartData = useMemo(() => {
    if (!topPerformers[selectedStrategyIndex]) return [];
    
    const traces = [
      // Purchase amounts (bars)
      {
        x: topPerformers[selectedStrategyIndex]?.dates?.slice(-config.windowSize) || [],
        y: topPerformers[selectedStrategyIndex]?.dailyAllocations?.slice(-config.windowSize) || [],
        type: 'bar',
        name: 'Daily Purchase',
        marker: { color: '#10B981' },
        hovertemplate: 'Date: %{x}<br>Purchase: $%{y:,.0f}<extra></extra>'
      },
      // $10 baseline line
      {
        x: topPerformers[selectedStrategyIndex]?.dates?.slice(-config.windowSize) || [],
        y: new Array(Math.min(config.windowSize, topPerformers[selectedStrategyIndex]?.dates?.length || 0)).fill(10),
        type: 'scatter',
        mode: 'lines',
        name: '$10 Baseline',
        line: { color: '#6B7280', width: 1, dash: 'dot' },
        hovertemplate: 'Date: %{x}<br>Baseline: $10<extra></extra>'
      }
    ];
    
    // Filter out hidden traces
    return traces.filter((trace: any) => !hiddenTraces.has(trace.name));
  }, [topPerformers, selectedStrategyIndex, config.windowSize, hiddenTraces]);

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

  // Helper function to get performance color
  const getPerformanceColor = (performance: string): string => {
    switch (performance) {
      case 'outperform': return 'text-green-400';
      case 'underperform': return 'text-red-400';
      default: return 'text-yellow-400';
    }
  };

  // Helper function to get performance icon
  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'outperform': return <TrendingUp className="w-4 h-4" />;
      case 'underperform': return <TrendingDown className="w-4 h-4" />;
      default: return <Minus className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
          <h1 className="text-3xl font-bold">DCA Ranker</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Calculating DCA rankings...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
          <h1 className="text-3xl font-bold">DCA Ranker</h1>
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
        <h1 className="text-3xl font-bold">DCA Ranker</h1>
      </header>

      <div className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">DCA Strategy Rankings</h2>
            <p className="text-gray-300 leading-relaxed">
              Rankings of metric + model combinations by profitability. Each combination uses on-chain signals 
              to adjust DCA allocation based on rarity zones, showing which strategies would have performed best historically.
            </p>
          </div>

          {/* Performance Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Strategies</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Outperformers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400">{stats.outperform}</div>
                <p className="text-xs text-gray-400 mt-1">{stats.outperformPercentage.toFixed(1)}% of total</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Avg Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stats.avgProfitPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercentage(stats.avgProfitPercentage)}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-950 border-slate-800 text-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Daily Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(config.budgetPerDay)}</div>
                <p className="text-xs text-gray-400 mt-1">
                  {config.windowSize === 30 ? '30-day backtest' : 
                   config.windowSize === 730 ? '2-year backtest' :
                   config.windowSize === 1460 ? '4-year backtest' :
                   config.windowSize === 2920 ? '8-year backtest' :
                   `${config.windowSize}-day backtest`}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performers Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-6">Top Performing Strategies</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Metric</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-400">Model</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-400">Profit %</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-400">Total BTC</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-400">Avg Price</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-400">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {topPerformers.map((result, index) => (
                    <tr key={`${result.metricKey}-${result.modelName}`} className="border-b border-slate-800 hover:bg-slate-900/50">
                      <td className="py-3 px-4 font-medium">#{index + 1}</td>
                      <td className="py-3 px-4">{result.metricName}</td>
                      <td className="py-3 px-4 text-gray-400">{result.modelName}</td>
                      <td className={`py-3 px-4 text-right font-medium ${getPerformanceColor(result.performance)}`}>
                        {formatPercentage(result.profitPercentage)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Bitcoin className="w-3 h-3" />
                          {result.totalBTC.toFixed(4)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">{formatCurrency(result.avgPrice)}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {getPerformanceIcon(result.performance)}
                          <span className={getPerformanceColor(result.performance)}>
                            {result.performance}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Configuration Panel */}
          <div className="mt-8 bg-slate-950 border border-slate-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Strategy Configuration</h3>
            <p className="text-gray-300 mb-4">
              Adjust parameters to see how different configurations affect strategy rankings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Daily Budget</label>
                <input
                  type="number"
                  value={config.budgetPerDay}
                  onChange={(e) => setConfig(prev => ({ ...prev, budgetPerDay: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                  min="1"
                  max="10000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Daily Budget Cap</label>
                <input
                  type="number"
                  value={config.dailyBudgetCap}
                  onChange={(e) => setConfig(prev => ({ ...prev, dailyBudgetCap: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                  min="10"
                  max="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Window Size (days)</label>
                <select
                  value={config.windowSize}
                  onChange={(e) => setConfig(prev => ({ ...prev, windowSize: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                >
                  <option value={30}>30 Days</option>
                  <option value={730}>2 Years</option>
                  <option value={1460}>4 Years</option>
                  <option value={2920}>8 Years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Zone Size</label>
                <input
                  type="number"
                  value={config.zoneSize}
                  onChange={(e) => setConfig(prev => ({ ...prev, zoneSize: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                  min="0.1"
                  max="2.0"
                  step="0.05"
                />
              </div>
            </div>
          </div>

          {/* DCA Purchase Chart */}
          {topPerformers.length > 0 && (
            <div className="mt-8 bg-slate-950 border border-slate-800 rounded-lg px-10 py-6">
              <h3 className="text-lg font-semibold mb-4">DCA Purchase Analysis</h3>
              <p className="text-gray-300 mb-4">
                Visualize daily purchase amounts compared to Bitcoin price for the selected strategy.
              </p>
              
              {/* Strategy Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Select Strategy</label>
                <select
                  value={selectedStrategyIndex}
                  onChange={(e) => setSelectedStrategyIndex(Number(e.target.value))}
                  className="w-full md:w-80 bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                >
                  {topPerformers.map((strategy, index) => (
                    <option key={index} value={index}>
                      Rank #{index + 1}: {strategy.metricName} ({strategy.modelName})
                    </option>
                  ))}
                </select>
              </div>

                                  {/* Top Chart: Bitcoin Price + On-chain Metric + Z-Score */}
                    <div className="w-full h-96 mb-6 -mx-8">
                      {/* Custom Legend for Top Chart */}
                      <div className="flex items-center justify-start gap-4 mb-2 px-2">
                        <button
                          onClick={() => {
                            setHiddenTraces(prev => {
                              const newHidden = new Set(prev);
                              if (newHidden.has('Bitcoin Price')) {
                                newHidden.delete('Bitcoin Price');
                              } else {
                                newHidden.add('Bitcoin Price');
                              }
                              return newHidden;
                            });
                          }}
                          className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                            hiddenTraces.has('Bitcoin Price') 
                              ? 'text-white/40 hover:text-white/60' 
                              : 'text-white hover:text-white/80'
                          }`}
                        >
                          <div 
                            className={`w-3 h-3 rounded-full transition-opacity ${
                              hiddenTraces.has('Bitcoin Price') ? 'opacity-40' : 'opacity-100'
                            }`}
                            style={{ backgroundColor: '#33B1FF' }}
                          />
                          <span className="text-sm">Bitcoin Price</span>
                        </button>
                        <button
                          onClick={() => {
                            setHiddenTraces(prev => {
                              const newHidden = new Set(prev);
                              const metricName = `${topPerformers[selectedStrategyIndex]?.metricName} (Metric)`;
                              if (newHidden.has(metricName)) {
                                newHidden.delete(metricName);
                              } else {
                                newHidden.add(metricName);
                              }
                              return newHidden;
                            });
                          }}
                          className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                            hiddenTraces.has(`${topPerformers[selectedStrategyIndex]?.metricName} (Metric)`) 
                              ? 'text-white/40 hover:text-white/60' 
                              : 'text-white hover:text-white/80'
                          }`}
                        >
                          <div 
                            className={`w-3 h-3 rounded-full transition-opacity ${
                              hiddenTraces.has(`${topPerformers[selectedStrategyIndex]?.metricName} (Metric)`) ? 'opacity-40' : 'opacity-100'
                            }`}
                            style={{ backgroundColor: '#F59E0B' }}
                          />
                          <span className="text-sm">{topPerformers[selectedStrategyIndex]?.metricName} (Metric)</span>
                        </button>
                        <button
                          onClick={() => {
                            setHiddenTraces(prev => {
                              const newHidden = new Set(prev);
                              const zscoreName = `${topPerformers[selectedStrategyIndex]?.metricName} (Z-Score)`;
                              if (newHidden.has(zscoreName)) {
                                newHidden.delete(zscoreName);
                              } else {
                                newHidden.add(zscoreName);
                              }
                              return newHidden;
                            });
                          }}
                          className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                            hiddenTraces.has(`${topPerformers[selectedStrategyIndex]?.metricName} (Z-Score)`) 
                              ? 'text-white/40 hover:text-white/60' 
                              : 'text-white hover:text-white/80'
                          }`}
                        >
                          <div 
                            className={`w-3 h-3 rounded-full transition-opacity ${
                              hiddenTraces.has(`${topPerformers[selectedStrategyIndex]?.metricName} (Z-Score)`) ? 'opacity-40' : 'opacity-100'
                            }`}
                            style={{ backgroundColor: '#EF4444' }}
                          />
                          <span className="text-sm">{topPerformers[selectedStrategyIndex]?.metricName} (Z-Score)</span>
                        </button>
                      </div>
                      <Plot
                        data={topChartData}
                        layout={{
                          title: {
                            text: `${topPerformers[selectedStrategyIndex]?.metricName} - Price, Metric & Z-Score Analysis`,
                            font: { color: '#FFFFFF', size: 16 }
                          },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { color: '#FFFFFF' },
                          xaxis: {
                            title: 'Date',
                            gridcolor: '#374151',
                            zerolinecolor: '#374151',
                            showgrid: true,
                            gridwidth: 1,
                            tickfont: { color: '#FFFFFF' },
                            titlefont: { color: '#FFFFFF' }
                          },
                          yaxis: {
                            title: 'Bitcoin Price (USD)',
                            type: 'log',
                            gridcolor: '#374151',
                            zerolinecolor: '#374151',
                            side: 'left',
                            showgrid: true,
                            gridwidth: 1,
                            tickfont: { color: '#FFFFFF' },
                            titlefont: { color: '#FFFFFF' }
                          },
                          yaxis2: {
                            title: `${topPerformers[selectedStrategyIndex]?.metricName} (Metric)`,
                            type: 'log',
                            gridcolor: 'transparent',
                            zerolinecolor: 'transparent',
                            side: 'right',
                            overlaying: 'y',
                            position: 0.95,
                            tickfont: { color: '#FFFFFF' },
                            titlefont: { color: '#FFFFFF' }
                          },
                          yaxis3: {
                            title: `${topPerformers[selectedStrategyIndex]?.metricName} (Z-Score)`,
                            type: 'linear',
                            gridcolor: 'transparent',
                            zerolinecolor: 'transparent',
                            side: 'right',
                            overlaying: 'y',
                            position: 1,
                            tickfont: { color: '#FFFFFF' },
                            titlefont: { color: '#FFFFFF' }
                          },
                          showlegend: false,
                          margin: { l: 80, r: 120, t: 80, b: 60 },
                          height: 384,
                          hovermode: 'x unified'
                        }}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>

                    {/* Bottom Chart: Tuned DCA Purchase Amounts */}
                    <div className="w-full h-96 mb-6 -mx-8">
                      {/* Custom Legend for Bottom Chart */}
                      <div className="flex items-center justify-start gap-4 mb-2 px-2">
                        <button
                          onClick={() => {
                            setHiddenTraces(prev => {
                              const newHidden = new Set(prev);
                              if (newHidden.has('Daily Purchase')) {
                                newHidden.delete('Daily Purchase');
                              } else {
                                newHidden.add('Daily Purchase');
                              }
                              return newHidden;
                            });
                          }}
                          className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                            hiddenTraces.has('Daily Purchase') 
                              ? 'text-white/40 hover:text-white/60' 
                              : 'text-white hover:text-white/80'
                          }`}
                        >
                          <div 
                            className={`w-3 h-3 rounded-full transition-opacity ${
                              hiddenTraces.has('Daily Purchase') ? 'opacity-40' : 'opacity-100'
                            }`}
                            style={{ backgroundColor: '#10B981' }}
                          />
                          <span className="text-sm">Daily Purchase</span>
                        </button>
                        <button
                          onClick={() => {
                            setHiddenTraces(prev => {
                              const newHidden = new Set(prev);
                              if (newHidden.has('$10 Baseline')) {
                                newHidden.delete('$10 Baseline');
                              } else {
                                newHidden.add('$10 Baseline');
                              }
                              return newHidden;
                            });
                          }}
                          className={`flex items-center gap-2 px-2 py-1 rounded transition-colors ${
                            hiddenTraces.has('$10 Baseline') 
                              ? 'text-white/40 hover:text-white/60' 
                              : 'text-white hover:text-white/80'
                          }`}
                        >
                          <div 
                            className={`w-3 h-3 rounded-full transition-opacity ${
                              hiddenTraces.has('$10 Baseline') ? 'opacity-40' : 'opacity-100'
                            }`}
                            style={{ backgroundColor: '#6B7280' }}
                          />
                          <span className="text-sm">$10 Baseline</span>
                        </button>
                      </div>
                      <Plot
                        data={bottomChartData}
                        layout={{
                          title: {
                            text: `${topPerformers[selectedStrategyIndex]?.metricName} - Tuned DCA Daily Purchase Amounts`,
                            font: { color: '#FFFFFF', size: 16 }
                          },
                          plot_bgcolor: 'rgba(0,0,0,0)',
                          paper_bgcolor: 'rgba(0,0,0,0)',
                          font: { color: '#FFFFFF' },
                          xaxis: {
                            title: 'Date',
                            gridcolor: '#374151',
                            zerolinecolor: '#374151',
                            showgrid: true,
                            gridwidth: 1,
                            tickfont: { color: '#FFFFFF' },
                            titlefont: { color: '#FFFFFF' }
                          },
                          yaxis: {
                            title: 'Daily Purchase Amount (USD)',
                            gridcolor: '#374151',
                            zerolinecolor: '#374151',
                            showgrid: true,
                            gridwidth: 1,
                            tickfont: { color: '#FFFFFF' },
                            titlefont: { color: '#FFFFFF' },
                            tickformat: ',.0f',
                            tickprefix: '$'
                          },
                          showlegend: false,
                          margin: { l: 80, r: 80, t: 80, b: 60 },
                          height: 384,
                          hovermode: 'x unified'
                        }}
                        config={{ responsive: true, displayModeBar: false }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 