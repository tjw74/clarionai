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

// Helper function to format ratio
function formatRatio(value: number | null): string {
  if (value === null) return 'N/A';
  return value.toFixed(2);
}

// Helper function to format percentage changes
function formatPercentageChange(value: number | null): string {
  if (value === null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

// Helper function to get color for percentage changes
function getChangeColor(value: number | null): string {
  if (value === null) return 'text-gray-400';
  return value >= 0 ? 'text-green-400' : 'text-red-400';
}

export default function Home() {
  const { 
    price, 
    marketCap, 
    realizedCap, 
    mvrvRatio,
    unrealizedProfit,
    unrealizedLoss,
    realizedProfit,
    realizedLoss,
    priceChange30d,
    priceChange90d,
    priceChange180d,
    marketCapChange30d,
    marketCapChange90d,
    marketCapChange180d,
    realizedCapChange30d,
    realizedCapChange90d,
    realizedCapChange180d,
    mvrvChange30d,
    mvrvChange90d,
    mvrvChange180d,
    unrealizedProfitChange30d,
    unrealizedProfitChange90d,
    unrealizedProfitChange180d,
    unrealizedLossChange30d,
    unrealizedLossChange90d,
    unrealizedLossChange180d,
    realizedProfitChange30d,
    realizedProfitChange90d,
    realizedProfitChange180d,
    realizedLossChange30d,
    realizedLossChange90d,
    realizedLossChange180d,
    loading, 
    error 
  } = useLatestMetrics();

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen w-full flex flex-col border-b border-white/20">
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
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
        <header className="py-8 border-b border-white/20 w-full flex justify-center">
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
      <header className="py-8 border-b border-white/20 w-full flex justify-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </header>
      
      <div className="flex-1 p-8">
        {/* Data Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Price Card */}
                  <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(price)}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={getChangeColor(priceChange30d)}>30d: {formatPercentageChange(priceChange30d)}</span>
                <span className={getChangeColor(priceChange90d)}>90d: {formatPercentageChange(priceChange90d)}</span>
                <span className={getChangeColor(priceChange180d)}>180d: {formatPercentageChange(priceChange180d)}</span>
              </div>
            </CardContent>
          </Card>

                            {/* Market Cap Card */}
                  <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Market Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(marketCap)}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={getChangeColor(marketCapChange30d)}>30d: {formatPercentageChange(marketCapChange30d)}</span>
                <span className={getChangeColor(marketCapChange90d)}>90d: {formatPercentageChange(marketCapChange90d)}</span>
                <span className={getChangeColor(marketCapChange180d)}>180d: {formatPercentageChange(marketCapChange180d)}</span>
              </div>
            </CardContent>
          </Card>

                            {/* Realized Cap Card */}
                  <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Realized Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(realizedCap)}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={getChangeColor(realizedCapChange30d)}>30d: {formatPercentageChange(realizedCapChange30d)}</span>
                <span className={getChangeColor(realizedCapChange90d)}>90d: {formatPercentageChange(realizedCapChange90d)}</span>
                <span className={getChangeColor(realizedCapChange180d)}>180d: {formatPercentageChange(realizedCapChange180d)}</span>
              </div>
            </CardContent>
          </Card>

                            {/* MVRV Ratio Card */}
                  <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">MVRV Ratio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatRatio(mvrvRatio)}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={getChangeColor(mvrvChange30d)}>30d: {formatPercentageChange(mvrvChange30d)}</span>
                <span className={getChangeColor(mvrvChange90d)}>90d: {formatPercentageChange(mvrvChange90d)}</span>
                <span className={getChangeColor(mvrvChange180d)}>180d: {formatPercentageChange(mvrvChange180d)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profit/Loss Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Unrealized Profit Card */}
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Unrealized Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(unrealizedProfit)}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={getChangeColor(unrealizedProfitChange30d)}>30d: {formatPercentageChange(unrealizedProfitChange30d)}</span>
                <span className={getChangeColor(unrealizedProfitChange90d)}>90d: {formatPercentageChange(unrealizedProfitChange90d)}</span>
                <span className={getChangeColor(unrealizedProfitChange180d)}>180d: {formatPercentageChange(unrealizedProfitChange180d)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Unrealized Loss Card */}
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Unrealized Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(unrealizedLoss)}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={getChangeColor(unrealizedLossChange30d)}>30d: {formatPercentageChange(unrealizedLossChange30d)}</span>
                <span className={getChangeColor(unrealizedLossChange90d)}>90d: {formatPercentageChange(unrealizedLossChange90d)}</span>
                <span className={getChangeColor(unrealizedLossChange180d)}>180d: {formatPercentageChange(unrealizedLossChange180d)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Realized Profit Card */}
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Realized Profit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(realizedProfit)}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={getChangeColor(realizedProfitChange30d)}>30d: {formatPercentageChange(realizedProfitChange30d)}</span>
                <span className={getChangeColor(realizedProfitChange90d)}>90d: {formatPercentageChange(realizedProfitChange90d)}</span>
                <span className={getChangeColor(realizedProfitChange180d)}>180d: {formatPercentageChange(realizedProfitChange180d)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Realized Loss Card */}
          <Card className="bg-slate-950 border-slate-800 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Realized Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(realizedLoss)}</div>
              <div className="flex gap-2 mt-2 text-xs">
                <span className={getChangeColor(realizedLossChange30d)}>30d: {formatPercentageChange(realizedLossChange30d)}</span>
                <span className={getChangeColor(realizedLossChange90d)}>90d: {formatPercentageChange(realizedLossChange90d)}</span>
                <span className={getChangeColor(realizedLossChange180d)}>180d: {formatPercentageChange(realizedLossChange180d)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
