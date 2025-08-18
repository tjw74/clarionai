'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLatestMetrics } from "@/hooks/useLatestMetrics";

// Helper function to format currency values
function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A';
  
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  
  let formattedValue: string;
  if (absValue >= 1e12) {
    formattedValue = `$${(absValue / 1e12).toFixed(2)}T`;
  } else if (absValue >= 1e9) {
    formattedValue = `$${(absValue / 1e9).toFixed(2)}B`;
  } else if (absValue >= 1e6) {
    formattedValue = `$${(absValue / 1e6).toFixed(2)}M`;
  } else if (absValue >= 1e3) {
    formattedValue = `$${(absValue / 1e3).toFixed(2)}K`;
  } else {
    formattedValue = `$${absValue.toFixed(2)}`;
  }
  
  return isNegative ? `-${formattedValue}` : formattedValue;
}

// Helper function to format price
function formatPrice(value: number | null): string {
  if (value === null) return 'N/A';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Helper function to format percentage
function formatPercentage(value: number | null): string {
  if (value === null) return 'N/A';
  return `${value.toFixed(2)}%`;
}

// Helper function to get color for percentage changes
function getChangeColor(value: number | null): string {
  if (value === null) return 'text-gray-400';
  return value >= 0 ? 'text-green-400' : 'text-red-400';
}

export default function Home() {
  const { 
    price, 
    priceChange30d,
    ath,
    loading, 
    error 
  } = useLatestMetrics();

  // Calculate drawdown from ATH using high price - if current price (close) is higher than ATH (high), drawdown is 0%
  // If current price (close) is lower than ATH (high), calculate the percentage drop as a negative value
  const drawdown = price && ath ? 
    (price >= ath ? 0 : -((ath - price) / ath) * 100) : null;

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="h-16 w-full flex items-center justify-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white">Loading metrics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="h-16 w-full flex items-center justify-center">
          <h1 className="text-3xl font-bold">Dashboard</h1>
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </header>
      
      <div className="flex-1 p-8">
        {/* Two data cards per row layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Market Overview Card */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-200">Market Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-20 flex flex-row items-center justify-between">
              <div className="flex flex-row items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-400">Price:</span>
                  <span className="text-lg font-bold tracking-tight">{formatPrice(price)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-400">ATH:</span>
                  <span className="text-base font-semibold">{formatPrice(ath)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-400">From ATH:</span>
                  <span className="text-base font-semibold">{formatPercentage(drawdown)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-400">30d Change:</span>
                  <span className={`text-base font-semibold ${getChangeColor(priceChange30d)}`}>
                    {priceChange30d !== null ? `${priceChange30d >= 0 ? '+' : ''}${priceChange30d.toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Placeholder for second card in first row */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold text-gray-200">Coming Soon</CardTitle>
            </CardHeader>
            <CardContent className="p-4 h-20 flex flex-col justify-center items-center">
              <div className="text-gray-400 text-center">
                <div className="text-xl mb-1">📊</div>
                <div className="text-xs">Additional data cards will be added here</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
