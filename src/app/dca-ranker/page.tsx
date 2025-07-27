'use client';

import { useState } from 'react';
import { useDCARankings } from '@/hooks/useDCARankings';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, DollarSign, Bitcoin } from 'lucide-react';
import { DCA_CONFIG } from '@/datamanager/metricsConfig';

interface DCARankerConfig {
  budgetPerDay: number;
  windowSize: number;
  temperature: number;
  zoneSize: number;
}

export default function DCARanker() {
  const [config, setConfig] = useState<DCARankerConfig>({
    budgetPerDay: DCA_CONFIG.DEFAULT_BUDGET_PER_DAY,
    windowSize: DCA_CONFIG.DEFAULT_WINDOW_SIZE,
    temperature: DCA_CONFIG.DEFAULT_TEMPERATURE,
    zoneSize: DCA_CONFIG.DEFAULT_ZONE_SIZE,
  });

  const { rankings, topPerformers, stats, loading, error } = useDCARankings(config);

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
                <p className="text-xs text-gray-400 mt-1">4-year backtest</p>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="block text-sm font-medium text-gray-400 mb-2">Window Size (days)</label>
                <select
                  value={config.windowSize}
                  onChange={(e) => setConfig(prev => ({ ...prev, windowSize: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                >
                  <option value={730}>2 Years</option>
                  <option value={1460}>4 Years</option>
                  <option value={2920}>8 Years</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Temperature</label>
                <input
                  type="number"
                  value={config.temperature}
                  onChange={(e) => setConfig(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-white"
                  min="0.1"
                  max="5"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 