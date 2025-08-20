import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface LiquidityChartProps {
  token0Symbol: string;
  token1Symbol: string;
  reserves: [bigint, bigint] | null;
  className?: string;
}

export function LiquidityChart({
  token0Symbol,
  token1Symbol,
  reserves,
  className = '',
}: LiquidityChartProps) {
  // Generate mock liquidity distribution data for now
  // In a real implementation, this would come from the contract
  const generateLiquidityData = () => {
    if (!reserves) return [];

    const basePrice = 1.0; // Base price ratio
    const data: Array<{ priceRatio: number; liquidity: number }> = [];

    // Generate 20 data points representing liquidity distribution
    for (let i = 0; i < 20; i++) {
      const priceRatio = basePrice * 1.1 ** (i - 10); // Price range from ~0.4 to ~2.6
      const liquidity = Math.random() * 100 + 20; // Random liquidity between 20-120
      data.push({ priceRatio, liquidity });
    }

    return data.sort((a, b) => a.priceRatio - b.priceRatio);
  };

  const liquidityData = generateLiquidityData();
  const maxLiquidity = Math.max(...liquidityData.map((d) => d.liquidity));

  return (
    <Card
      className={`bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30 ${className}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Liquidity Distribution
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Liquidity concentration across price ranges
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" className="text-xs">
              Price
            </Button>
            <Button size="sm" variant="default" className="text-xs">
              Liquidity
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!reserves ? (
          <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-muted-foreground">Loading liquidity data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Chart */}
            <div className="h-64 relative">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{maxLiquidity.toFixed(0)}</span>
                <span>{(maxLiquidity * 0.75).toFixed(0)}</span>
                <span>{(maxLiquidity * 0.5).toFixed(0)}</span>
                <span>{(maxLiquidity * 0.25).toFixed(0)}</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="ml-16 h-full relative">
                {/* Grid lines */}
                <div className="absolute inset-0">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                    <div
                      key={ratio}
                      className="absolute left-0 right-0 border-t border-gray-200 dark:border-gray-600"
                      style={{ top: `${ratio * 100}%` }}
                    />
                  ))}
                </div>

                {/* Liquidity bars */}
                <div className="absolute inset-0 flex items-end justify-between px-2">
                  {liquidityData.map((data, i) => (
                    <div
                      key={`liquidity-${data.priceRatio}-${i}`}
                      className="relative group"
                      style={{ width: `${100 / liquidityData.length}%` }}
                    >
                      <div
                        className="bg-blue-500/60 hover:bg-blue-500/80 transition-all duration-200 rounded-t"
                        style={{
                          height: `${(data.liquidity / maxLiquidity) * 100}%`,
                          minHeight: '2px',
                        }}
                      />

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        <div>Price: {data.priceRatio.toFixed(3)}</div>
                        <div>Liquidity: {data.liquidity.toFixed(1)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* X-axis labels */}
              <div className="ml-16 mt-2 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{(liquidityData[0]?.priceRatio || 0).toFixed(2)}</span>
                <span>
                  {(
                    liquidityData[Math.floor(liquidityData.length / 2)]
                      ?.priceRatio || 0
                  ).toFixed(2)}
                </span>
                <span>
                  {(
                    liquidityData[liquidityData.length - 1]?.priceRatio || 0
                  ).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-blue-500/60 rounded"></div>
                <span className="text-muted-foreground">Liquidity</span>
              </div>
              <div className="text-muted-foreground">
                Price ratio: {token0Symbol}/{token1Symbol}
              </div>
            </div>

            {/* Current price indicator */}
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">
                Current Price
              </div>
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                1 {token0Symbol} ={' '}
                {reserves[1] && reserves[0]
                  ? (Number(reserves[1]) / Number(reserves[0])).toFixed(6)
                  : '0'}{' '}
                {token1Symbol}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
