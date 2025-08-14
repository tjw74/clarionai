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
    price, priceSpark30,
    marketCap, 
    realizedCap, 
    mvrvRatio,
    unrealizedProfit,
    unrealizedLoss,
    realizedProfit,
    realizedLoss,
    marketCapSpark30,
    realizedCapSpark30,
    mvrvSpark30,
    unrealizedProfitSpark30,
    unrealizedLossSpark30,
    realizedProfitSpark30,
    realizedLossSpark30,
    soprSpark30,
    realizedPrice, trueMarketMean, vaultedPrice, sma200,
    trendRegime, distances,
    unrealizedRegime, sopr, realizedRegime,
    priceChange30d,
    priceChange90d,
    priceChange180d,
    soprChange30d,
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
        {/* Executive snapshot row: four uniform cards, no sparklines */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Price */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardContent className="p-5 h-44 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">Price</div>
                <div className={`px-2 py-1 rounded-md text-xs ${getChangeColor(priceChange30d).replace('text-', 'bg-').replace('-400', '-500/20')} ${getChangeColor(priceChange30d)}`}>{formatPercentageChange(priceChange30d)}</div>
              </div>
              <div className="text-4xl font-bold tracking-tight">{formatPrice(price)}</div>
              <div className={`text-base ${trendRegime === 'Uptrend' ? 'text-green-300' : trendRegime === 'Downtrend' ? 'text-red-300' : 'text-blue-300'}`}>Regime: {trendRegime}</div>
              <div className="text-sm text-gray-400">Anchors: Realized • True Mean • 200d</div>
            </CardContent>
          </Card>

          {/* Market Cap */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardContent className="p-5 h-44 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">Market Cap</div>
                <div className={`px-2 py-1 rounded-md text-xs ${getChangeColor(marketCapChange30d).replace('text-', 'bg-').replace('-400', '-500/20')} ${getChangeColor(marketCapChange30d)}`}>{formatPercentageChange(marketCapChange30d)}</div>
              </div>
              <div className="text-4xl font-bold tracking-tight">{formatCurrency(marketCap)}</div>
              <div className="text-base text-gray-200">Network valuation</div>
              <div className="text-sm text-gray-400">30/90/180d change shown</div>
            </CardContent>
          </Card>

          {/* Realized Cap */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardContent className="p-5 h-44 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">Realized Cap</div>
                <div className={`px-2 py-1 rounded-md text-xs ${getChangeColor(realizedCapChange30d).replace('text-', 'bg-').replace('-400', '-500/20')} ${getChangeColor(realizedCapChange30d)}`}>{formatPercentageChange(realizedCapChange30d)}</div>
              </div>
              <div className="text-4xl font-bold tracking-tight">{formatCurrency(realizedCap)}</div>
              <div className="text-base text-gray-200">Aggregate holder cost basis</div>
              <div className="text-sm text-gray-400">Lower sensitivity than price</div>
            </CardContent>
          </Card>

          {/* MVRV Ratio */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardContent className="p-5 h-44 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">MVRV Ratio</div>
                <div className={`px-2 py-1 rounded-md text-xs ${getChangeColor(mvrvChange30d).replace('text-', 'bg-').replace('-400', '-500/20')} ${getChangeColor(mvrvChange30d)}`}>{formatPercentageChange(mvrvChange30d)}</div>
              </div>
              <div className="text-4xl font-bold tracking-tight">{formatRatio(mvrvRatio)}</div>
              <div className="text-base text-gray-200">Valuation vs cost basis</div>
              <div className="text-sm text-gray-400">Neutral/Elevated/Depressed</div>
            </CardContent>
          </Card>
        </div>

        {/* Profit/Loss Cards - uniform */
        }
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Unrealized Profit */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardContent className="p-5 h-44 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">Unrealized Profit</div>
                <div className={`px-2 py-1 rounded-md text-xs ${getChangeColor(unrealizedProfitChange30d).replace('text-', 'bg-').replace('-400', '-500/20')} ${getChangeColor(unrealizedProfitChange30d)}`}>{formatPercentageChange(unrealizedProfitChange30d)}</div>
              </div>
              <div className="text-4xl font-bold tracking-tight">{formatCurrency(unrealizedProfit)}</div>
              <div className={`text-base ${unrealizedRegime === 'Elevated Profit' ? 'text-green-300' : unrealizedRegime === 'Stressed Loss' ? 'text-red-300' : 'text-blue-300'}`}>{unrealizedRegime}</div>
              <div className="text-sm text-gray-400">Aggregate unrealized gains</div>
            </CardContent>
          </Card>

          {/* Unrealized Loss */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardContent className="p-5 h-44 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">Unrealized Loss</div>
                <div className={`px-2 py-1 rounded-md text-xs ${getChangeColor(unrealizedLossChange30d).replace('text-', 'bg-').replace('-400', '-500/20')} ${getChangeColor(unrealizedLossChange30d)}`}>{formatPercentageChange(unrealizedLossChange30d)}</div>
              </div>
              <div className="text-4xl font-bold tracking-tight">{formatCurrency(unrealizedLoss)}</div>
              <div className="text-base text-red-300">Stressed supply share</div>
              <div className="text-sm text-gray-400">Aggregate unrealized losses</div>
            </CardContent>
          </Card>

          {/* Realized Profit */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardContent className="p-5 h-44 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">Realized Profit</div>
                <div className={`px-2 py-1 rounded-md text-xs ${getChangeColor(realizedProfitChange30d).replace('text-', 'bg-').replace('-400', '-500/20')} ${getChangeColor(realizedProfitChange30d)}`}>{formatPercentageChange(realizedProfitChange30d)}</div>
              </div>
              <div className="text-4xl font-bold tracking-tight">{formatCurrency(realizedProfit)}</div>
              <div className="text-base text-green-300">Profit-taking intensity</div>
              <div className="text-sm text-gray-400">On-chain realized gains</div>
            </CardContent>
          </Card>

          {/* Realized Loss */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardContent className="p-5 h-44 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">Realized Loss</div>
                <div className={`px-2 py-1 rounded-md text-xs ${getChangeColor(realizedLossChange30d).replace('text-', 'bg-').replace('-400', '-500/20')} ${getChangeColor(realizedLossChange30d)}`}>{formatPercentageChange(realizedLossChange30d)}</div>
              </div>
              <div className="text-4xl font-bold tracking-tight">{formatCurrency(realizedLoss)}</div>
              <div className={`text-base ${realizedRegime === 'Profit-taking' ? 'text-green-300' : realizedRegime === 'Capitulation' ? 'text-red-300' : 'text-blue-300'}`}>{realizedRegime}</div>
              <div className="text-sm text-gray-400">On-chain realized losses</div>
            </CardContent>
          </Card>

          {/* SOPR */}
          <Card className="bg-slate-950 border-white/10 text-white rounded-2xl">
            <CardContent className="p-5 h-44 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-400">SOPR</div>
                <div className={`px-2 py-1 rounded-md text-xs ${getChangeColor(soprChange30d).replace('text-', 'bg-').replace('-400', '-500/20')} ${getChangeColor(soprChange30d)}`}>{formatPercentageChange(soprChange30d)}</div>
              </div>
              <div className="text-4xl font-bold tracking-tight">{sopr === null ? 'N/A' : sopr.toFixed(2)}</div>
              <div className={`text-base ${sopr !== null && sopr > 1.02 ? 'text-green-300' : sopr !== null && sopr < 0.98 ? 'text-red-300' : 'text-blue-300'}`}>{sopr !== null ? (sopr > 1.02 ? 'Profit-taking' : sopr < 0.98 ? 'Capitulation' : 'Neutral') : 'Neutral'}</div>
              <div className="text-sm text-gray-400">Spent Output Profit Ratio</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
