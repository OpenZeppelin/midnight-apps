'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/header';
import { StarsBackground } from '@/components/stars-background';
import { MoonDustBackground } from '@/components/moon-dust-background';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Droplets, Clock, Repeat } from 'lucide-react';
import { useLunarswapContext } from '@/lib/lunarswap-context';
import { getTokenSymbolByColor, getTokenNameByColor } from '@/lib/token-utils';
import { Identicon } from '@/components/identicon';
import { SplitTokenIcon } from '@/components/pool/split-token-icon';
import { LiquidityChart } from '@/components/pool/liquidity-chart';

export default function PoolDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const { isLoading, allPairs, lunarswap } = useLunarswapContext();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [reserves, setReserves] = useState<[bigint, bigint] | null>(null);

  const poolId = params.id as string;

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getToken0Symbol = () => {
    const pool = allPairs.find((p) => p.pairId === poolId);
    if (!pool) return '';
    const color = Buffer.from(pool.pair.token0Type).toString('hex');
    return getTokenSymbolByColor(color);
  };

  const getToken1Symbol = () => {
    const pool = allPairs.find((p) => p.pairId === poolId);
    if (!pool) return '';
    const color = Buffer.from(pool.pair.token1Type).toString('hex');
    return getTokenSymbolByColor(color);
  };

  const getToken0Name = () => {
    const pool = allPairs.find((p) => p.pairId === poolId);
    if (!pool) return '';
    const color = Buffer.from(pool.pair.token0Type).toString('hex');
    return getTokenNameByColor(color);
  };

  const getToken1Name = () => {
    const pool = allPairs.find((p) => p.pairId === poolId);
    if (!pool) return '';
    const color = Buffer.from(pool.pair.token1Type).toString('hex');
    return getTokenNameByColor(color);
  };

  const getToken0Color = () => {
    const pool = allPairs.find((p) => p.pairId === poolId);
    if (!pool) return '';
    return Buffer.from(pool.pair.token0Type).toString('hex');
  };

  const getToken1Color = () => {
    const pool = allPairs.find((p) => p.pairId === poolId);
    if (!pool) return '';
    return Buffer.from(pool.pair.token1Type).toString('hex');
  };

  const getLpTokenType = () => {
    const pool = allPairs.find((p) => p.pairId === poolId);
    if (!pool) return '';

    return Buffer.from(pool.pair.lpTokenType).toString('hex');
  };

  const getLpTokenSymbol = () => {
    return 'TLUNAR';
  };

  const getLpTokenName = () => {
    return 'Test Lunar';
  };

  // Function to fetch reserves for the current pool
  const fetchReserves = useCallback(async () => {
    const pool = allPairs.find((p) => p.pairId === poolId);
    if (!pool || !lunarswap) return;

    try {
      const token0Type = Buffer.from(pool.pair.token0Type).toString('hex');
      const token1Type = Buffer.from(pool.pair.token1Type).toString('hex');

      const reserves = await lunarswap.getPairReserves(token0Type, token1Type);
      if (reserves) {
        setReserves(reserves);
      }
    } catch (error) {
      console.error('Failed to fetch reserves:', error);
      setReserves(null);
    }
  }, [allPairs, lunarswap, poolId]);

  // Fetch reserves when pool data is available
  useEffect(() => {
    if (allPairs.length > 0 && lunarswap) {
      fetchReserves();
    }
  }, [allPairs, lunarswap, fetchReserves]);

  // Helper function to format large numbers
  const formatReserve = (value: bigint | null): string => {
    if (!value) return '0';
    const num = Number(value);
    if (num === 0) return '0';
    if (num < 1000) return num.toString();
    if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
    if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
    return `${(num / 1000000000).toFixed(1)}B`;
  };

  // Show loading while contract is connecting
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
        <StarsBackground />
        <MoonDustBackground />
        <Header />
        <main className="container mx-auto px-4 py-8 relative z-0 pt-24">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Loading Pool...</h3>
                <p className="text-muted-foreground">
                  Fetching pool details and statistics.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  // Show error if pool not found
  const pool = allPairs.find((p) => p.pairId === poolId);
  if (!pool) {
    return (
      <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
        <StarsBackground />
        <MoonDustBackground />
        <Header />
        <main className="container mx-auto px-4 py-8 relative z-0 pt-24">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
              <CardContent className="p-8 text-center">
                <Droplets className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Pool Not Found</h3>
                <p className="text-muted-foreground mb-4">
                  The requested pool could not be found or you may not have
                  permission to view it.
                </p>
                <Button
                  onClick={() =>
                    navigate('/explore', { state: { selectedOption: 'pools' } })
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View All Pools
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <StarsBackground />
      <MoonDustBackground />
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-0 pt-24">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <button
                type="button"
                className="cursor-pointer hover:text-foreground transition-colors bg-transparent border-none p-0 text-sm"
                onClick={() => navigate('/explore')}
              >
                Explore
              </button>
              <span>/</span>
              <button
                type="button"
                className="cursor-pointer hover:text-foreground transition-colors bg-transparent border-none p-0 text-sm"
                onClick={() =>
                  navigate('/explore', { state: { selectedOption: 'pools' } })
                }
              >
                Pools
              </button>
              <span>/</span>
              <span className="text-foreground font-medium">
                {getToken0Symbol()} / {getToken1Symbol()}
              </span>
              <span className="text-gray-500 dark:text-gray-400 text-xs">
                <button
                  type="button"
                  className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  onClick={() =>
                    copyToClipboard(pool.pairId, 'breadcrumb-pool-id')
                  }
                  title="Click to copy pool ID"
                >
                  {pool.pairId.slice(0, 8)}...
                  {pool.pairId.slice(-8)}
                </button>
                {copiedField === 'breadcrumb-pool-id' && (
                  <span className="ml-1 text-green-600 dark:text-green-400">
                    ✓
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Pool Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <SplitTokenIcon
                tokenASymbol={getToken0Symbol()}
                tokenBSymbol={getToken1Symbol()}
                size={64}
                className="mr-2"
              />
              <div>
                <h1 className="text-3xl font-bold">
                  {getToken0Symbol()} / {getToken1Symbol()}
                </h1>
                <p className="text-muted-foreground">
                  {getToken0Name()} / {getToken1Name()}
                </p>
              </div>
              <Badge variant="secondary" className="text-sm">
                v1
              </Badge>
            </div>
          </div>

          {/* Main Content Layout - 70/30 Split */}
          <div className="flex gap-6">
            {/* Left Side - 70% - Chart and Transactions */}
            <div className="flex-1">
              {/* Liquidity Chart Section */}
              <LiquidityChart
                token0Symbol={getToken0Symbol()}
                token1Symbol={getToken1Symbol()}
                reserves={reserves}
                className="mb-6"
              />

              {/* Transactions Section */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
                <CardHeader>
                  <CardTitle className="text-lg">Transactions</CardTitle>
                  <CardDescription>Recent trading activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-8 text-center">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-muted-foreground">
                      Transaction history coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Side - 30% - Actions and Stats */}
            <div className="w-80 space-y-6">
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    const token0Type = Buffer.from(
                      pool.pair.token0Type,
                    ).toString('hex');
                    const token1Type = Buffer.from(
                      pool.pair.token1Type,
                    ).toString('hex');
                    const token0Symbol = getTokenSymbolByColor(token0Type);
                    const token1Symbol = getTokenSymbolByColor(token1Type);

                    navigate('/', {
                      state: {
                        fromToken: token0Symbol,
                        toToken: token1Symbol,
                        fromTokenType: token0Type,
                        toTokenType: token1Type,
                      },
                    });
                  }}
                  className="flex-1 text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Repeat className="inline h-4 w-4 mr-2" />
                  Swap
                </Button>
                <Button
                  onClick={() => {
                    const token0Type = Buffer.from(
                      pool.pair.token0Type,
                    ).toString('hex');
                    const token1Type = Buffer.from(
                      pool.pair.token1Type,
                    ).toString('hex');
                    const token0Symbol = getTokenSymbolByColor(token0Type);
                    const token1Symbol = getTokenSymbolByColor(token1Type);

                    navigate('/pool/new', {
                      state: {
                        tokenA: token0Symbol,
                        tokenB: token1Symbol,
                        tokenAType: token0Type,
                        tokenBType: token1Type,
                      },
                    });
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Droplets className="h-4 w-4 mr-2" />
                  Add Liquidity
                </Button>
              </div>

              {/* Total APR Card */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
                <CardHeader>
                  <CardTitle className="text-lg">Total APR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-center">0.00%</div>
                </CardContent>
              </Card>

              {/* Pool Statistics */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
                <CardHeader>
                  <CardTitle className="text-lg">Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">
                          Reserves
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          {(() => {
                            if (!reserves)
                              return (
                                <div className="flex h-2 rounded-full overflow-hidden">
                                  <div className="bg-gray-400 h-full w-full" />
                                </div>
                              );

                            const totalValue =
                              Number(reserves[0]) + Number(reserves[1]);
                            const token0Percentage =
                              totalValue > 0
                                ? (Number(reserves[0]) / totalValue) * 100
                                : 50;
                            const token1Percentage = 100 - token0Percentage;
                            return (
                              <div className="flex h-2 rounded-full overflow-hidden">
                                <div
                                  className="bg-blue-500 h-full transition-all duration-300"
                                  style={{ width: `${token0Percentage}%` }}
                                />
                                <div
                                  className="bg-green-500 h-full transition-all duration-300"
                                  style={{ width: `${token1Percentage}%` }}
                                />
                              </div>
                            );
                          })()}
                        </div>
                        <div className="flex justify-between items-center mt-1">
                          <div className="flex items-center gap-2">
                            <Identicon address={getToken0Color()} size={12} />
                            <span className="text-xs text-muted-foreground">
                              {getToken0Symbol()} ({(() => {
                                if (!reserves) return '0.0';
                                const totalValue =
                                  Number(reserves[0]) + Number(reserves[1]);
                                return totalValue > 0
                                  ? (
                                      (Number(reserves[0]) / totalValue) *
                                      100
                                    ).toFixed(1)
                                  : '50.0';
                              })()}%)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {(() => {
                                const totalValue =
                                  Number(pool.pair.token0Type) +
                                  Number(pool.pair.token1Type);
                                return totalValue > 0
                                  ? (
                                      (Number(pool.pair.token1Type) /
                                        totalValue) *
                                      100
                                    ).toFixed(1)
                                  : '50.0';
                              })()}% {getToken1Symbol()}
                            </span>
                            <Identicon address={getToken1Color()} size={12} />
                          </div>
                        </div>
                      </div>

                      {/* Token Values */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Identicon address={getToken0Color()} size={12} />
                            <span className="text-sm">{getToken0Symbol()}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {reserves
                              ? formatReserve(reserves[0])
                              : 'Loading...'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Identicon address={getToken1Color()} size={12} />
                            <span className="text-sm">{getToken1Symbol()}</span>
                          </div>
                          <span className="text-sm font-medium">
                            {reserves
                              ? formatReserve(reserves[1])
                              : 'Loading...'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">TVL</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Coming soon
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        24H Volume
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Coming soon
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        24H Fees
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Coming soon
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Token Information */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
                <CardHeader>
                  <CardTitle className="text-lg">Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Identicon address={getToken0Color()} size={16} />
                      <span className="text-sm font-medium">
                        {getToken0Symbol()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {getToken0Name()}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full text-left"
                        onClick={() =>
                          copyToClipboard(getToken0Color(), 'token0-color')
                        }
                        title="Click to copy token color"
                      >
                        {getToken0Color()}
                      </button>
                      {copiedField === 'token0-color' && (
                        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded flex items-center justify-center">
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            Copied!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Identicon address={getToken1Color()} size={16} />
                      <span className="text-sm font-medium">
                        {getToken1Symbol()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground mb-2">
                      {getToken1Name()}
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full text-left"
                        onClick={() =>
                          copyToClipboard(getToken1Color(), 'token1-color')
                        }
                        title="Click to copy token color"
                      >
                        {getToken1Color()}
                      </button>
                      {copiedField === 'token1-color' && (
                        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded flex items-center justify-center">
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            Copied!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">
                        Pool ID
                      </span>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full text-left"
                        onClick={() => copyToClipboard(pool.pairId, 'pool-id')}
                        title="Click to copy pool ID"
                      >
                        {pool.pairId}
                      </button>
                      {copiedField === 'pool-id' && (
                        <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded flex items-center justify-center">
                          <span className="text-xs font-medium text-green-700 dark:text-green-300">
                            Copied!
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Identicon address={getLpTokenType()} size={16} />
                        <span className="text-sm font-medium">
                          {getLpTokenSymbol()}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        {getLpTokenName()} (LP tokens for this pair)
                      </div>
                      <div className="relative">
                        <button
                          type="button"
                          className="text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded break-all cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors w-full text-left"
                          onClick={() =>
                            copyToClipboard(getLpTokenType(), 'lp-token-type')
                          }
                          title="Click to copy LP token type"
                        >
                          {getLpTokenType()}
                        </button>
                        {copiedField === 'lp-token-type' && (
                          <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded flex items-center justify-center">
                            <span className="text-xs font-medium text-green-700 dark:text-green-300">
                              Copied!
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* More Pools Section */}
              <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
                <CardHeader>
                  <CardTitle className="text-lg">More Pools</CardTitle>
                  <CardDescription>
                    Explore other liquidity pools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allPairs && allPairs.length > 0 ? (
                      allPairs
                        .filter((pool) => pool.pairId !== poolId)
                        .slice(0, 5)
                        .map((pool, index: number) => {
                          const token0Symbol = getTokenSymbolByColor(
                            Buffer.from(pool.pair.token0Type).toString('hex'),
                          );
                          const token1Symbol = getTokenSymbolByColor(
                            Buffer.from(pool.pair.token1Type).toString('hex'),
                          );
                          return (
                            <button
                              key={pool.pairId}
                              type="button"
                              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
                              onClick={() =>
                                navigate(`/explore/pool/${pool.pairId}`)
                              }
                            >
                              <SplitTokenIcon
                                tokenASymbol={token0Symbol}
                                tokenBSymbol={token1Symbol}
                                size={24}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">
                                  {token0Symbol}/{token1Symbol}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {pool.pairId.slice(0, 8)}...
                                  {pool.pairId.slice(-8)}
                                </div>
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                #{index + 1}
                              </div>
                            </button>
                          );
                        })
                    ) : (
                      <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                        <p className="text-sm">No other pools available</p>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        navigate('/explore', {
                          state: { selectedOption: 'pools' },
                        })
                      }
                    >
                      Explore more pools
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
