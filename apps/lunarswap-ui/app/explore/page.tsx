import { useState, useEffect } from 'react';
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
import {
  Coins,
  Droplets,
  ArrowRightLeft,
  Clock,
  ArrowRight,
  Plus,
  Minus,
} from 'lucide-react';
import {
  popularTokens,
  getAvailableTokensForSelection,
} from '@/lib/token-config';
import { getTokenSymbolByColor } from '@/lib/token-utils';
import { SplitTokenIcon } from '@/components/pool/split-token-icon';
import { Input } from '@/components/ui/input';
import { Copy, Search, Grid3X3, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TokenIcon } from '@/components/token-icon';
import { useViewPreference } from '@/hooks/use-view-preference';
import { useWallet } from '@/hooks/use-wallet';
import { useLunarswapContext } from '@/lib/lunarswap-context';
import { useLocation, useNavigate } from 'react-router-dom';

type ExploreOption = 'tokens' | 'pools' | 'transactions';

export const metadata = {
  title: 'Discover the Midnight Ecosystem',
  description:
    'Discover the complete Midnight ecosystem on Lunarswap. Explore tokens, liquidity pools, and transaction data. Your gateway to the most celestial DEX in the galaxy.',
};

export default function ExplorePage() {
  useEffect(() => {
    document.title = 'Discover the Midnight Ecosystem';
  }, []);

  const viewPreference = useViewPreference();
  const { isConnected } = useWallet();
  const { status, isLoading, allPairs } = useLunarswapContext();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<ExploreOption>('tokens');

  // Handle navigation state to automatically select pools section
  useEffect(() => {
    if (location.state?.selectedOption === 'pools') {
      setSelectedOption('pools');
    }
  }, [location.state]);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [poolSearchQuery, setPoolSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    viewPreference === 'horizontal' ? 'grid' : 'list',
  );
  // Update view mode when view preference changes
  useEffect(() => {
    setViewMode(viewPreference === 'horizontal' ? 'grid' : 'list');
  }, [viewPreference]);

  const exploreOptions = [
    {
      id: 'tokens' as ExploreOption,
      title: 'Tokens',
      icon: Coins,
      available: true,
    },
    {
      id: 'pools' as ExploreOption,
      title: 'Pools',
      icon: Droplets,
      available: true,
    },
    {
      id: 'transactions' as ExploreOption,
      title: 'Transactions',
      icon: ArrowRightLeft,
      available: false,
      badge: 'Coming Soon',
      badgeVariant: 'secondary' as const,
    },
  ];

  const tokens =
    allPairs.length > 0
      ? getAvailableTokensForSelection(allPairs)
      : Object.values(popularTokens);
  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleAddLiquidity = () => {
    navigate('/pool');
  };

  const handleRemoveLiquidity = () => {
    navigate('/pool');
  };

  const renderTokensContent = () => {
    return (
      <div className="mt-6">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pt-3 px-4 font-medium">#</th>
                    <th className="pb-2 pt-3 px-4 font-medium">Token</th>
                    <th className="pb-2 pt-3 px-4 font-medium">Name</th>
                    <th className="pb-2 pt-3 px-4 font-medium">Type</th>
                    <th className="pb-2 pt-3 px-4 font-medium">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTokens.map((token, index) => (
                    <tr
                      key={token.address}
                      className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm">{index + 1}</td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              token.symbol,
                              `token-${token.symbol}`,
                            )
                          }
                          className="flex items-center space-x-2 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded p-1 -m-1 cursor-pointer"
                        >
                          <TokenIcon symbol={token.symbol} size={24} />
                          <div className="font-medium text-sm">{token.symbol}</div>
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(token.name, `name-${token.symbol}`)
                          }
                          className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded p-1 -m-1 cursor-pointer text-gray-600 dark:text-gray-400 text-sm"
                        >
                          {token.name}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(token.type, `type-${token.symbol}`)
                          }
                          className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded p-1 -m-1 cursor-pointer font-mono text-xs text-gray-500 dark:text-gray-400"
                        >
                          {token.type}
                        </button>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              token.address,
                              `address-${token.symbol}`,
                            )
                          }
                          className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded p-1 -m-1 cursor-pointer font-mono text-xs text-gray-500 dark:text-gray-400"
                        >
                          {token.address.slice(0, 8)}...
                          {token.address.slice(-8)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPoolsContent = () => {
    // Filter pools based on search query
    const filteredPools = allPairs
      ? Array.from(
          new Map(allPairs.map((pool) => [pool.pairId, pool])).values(),
        ).filter((pool) => {
          if (!poolSearchQuery) return true;
          const token0Type = Buffer.from(pool.pair.token0Type).toString('hex');
          const token1Type = Buffer.from(pool.pair.token1Type).toString('hex');
          const token0Symbol = getTokenSymbolByColor(token0Type);
          const token1Symbol = getTokenSymbolByColor(token1Type);
          const searchLower = poolSearchQuery.toLowerCase();
          return (
            token0Symbol.toLowerCase().includes(searchLower) ||
            token1Symbol.toLowerCase().includes(searchLower) ||
            pool.pairId.toLowerCase().includes(searchLower)
          );
        })
      : [];

    return (
      <div className="mt-8">
        <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 pt-4 px-6 font-medium">#</th>
                    <th className="pb-3 pt-4 px-6 font-medium">Pool</th>
                    <th className="pb-3 pt-4 px-6 font-medium">Protocol</th>
                    <th className="pb-3 pt-4 px-6 font-medium">Fee Tier</th>
                    <th className="pb-3 pt-4 px-6 font-medium">TVL</th>
                    <th className="pb-3 pt-4 px-6 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {!filteredPools || filteredPools.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <Droplets className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          {poolSearchQuery
                            ? 'No Pools Found'
                            : 'No Pools Available'}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {poolSearchQuery
                            ? `No pools match "${poolSearchQuery}". Try a different search term.`
                            : 'There are currently no liquidity pools available.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredPools.slice(0, 10).map((pool, index) => {
                      // Convert token types to symbols
                      const token0Type = Buffer.from(
                        pool.pair.token0Type,
                      ).toString('hex');
                      const token1Type = Buffer.from(
                        pool.pair.token1Type,
                      ).toString('hex');
                      const token0Symbol = getTokenSymbolByColor(token0Type);
                      const token1Symbol = getTokenSymbolByColor(token1Type);

                      return (
                        <tr
                          key={pool.pairId}
                          className="border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <td className="py-4 px-6">{index + 1}</td>
                          <td className="py-4 px-6">
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/explore/pool/${pool.pairId}`)
                              }
                              className="flex items-center space-x-3 w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded p-2 -m-2"
                            >
                              <SplitTokenIcon
                                tokenASymbol={token0Symbol}
                                tokenBSymbol={token1Symbol}
                                size={32}
                              />
                              <div>
                                <div className="font-medium">
                                  {token0Symbol}/{token1Symbol}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {pool.pairId.slice(0, 8)}...
                                  {pool.pairId.slice(-8)}
                                </div>
                              </div>
                            </button>
                          </td>
                          <td className="py-4 px-6">
                            <Badge variant="secondary" className="text-xs">
                              v1
                            </Badge>
                          </td>
                          <td className="py-4 px-6">0.3%</td>
                          <td className="py-4 px-6 text-gray-500 dark:text-gray-400">
                            Coming soon
                          </td>
                          <td className="py-4 px-6">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigate(`/explore/pool/${pool.pairId}`)
                              }
                              className="text-blue-600 hover:text-blue-700 dark:hover:text-blue-400"
                            >
                              View Details
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderTransactionsContent = () => (
    <div className="mt-8">
      <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30">
        <CardHeader>
          <div>
            <CardTitle className="text-2xl">Transactions</CardTitle>
            <CardDescription>
              View transaction history and trading activity
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 pt-4 px-6 font-medium">#</th>
                  <th className="pb-3 pt-4 px-6 font-medium">Type</th>
                  <th className="pb-3 pt-4 px-6 font-medium">Pool</th>
                  <th className="pb-3 pt-4 px-6 font-medium">Amount</th>
                  <th className="pb-3 pt-4 px-6 font-medium">Status</th>
                  <th className="pb-3 pt-4 px-6 font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <ArrowRightLeft className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">
                      Transactions Coming Soon
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Transaction history and trading activity will be available
                      in a future update.
                    </p>
                    <div className="text-sm text-muted-foreground">
                      <p>Features in development:</p>
                      <ul className="mt-2 space-y-1">
                        <li>• Real-time transaction feed</li>
                        <li>• Trading history and analytics</li>
                        <li>• Pool activity monitoring</li>
                        <li>• Advanced filtering and search</li>
                      </ul>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderContent = () => {
    switch (selectedOption) {
      case 'tokens':
        return renderTokensContent();
      case 'pools':
        return renderPoolsContent();
      case 'transactions':
        return renderTransactionsContent();
      default:
        return renderTokensContent();
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <StarsBackground />
      <MoonDustBackground />
      <Header />

      <main className="container mx-auto px-3 py-4 relative z-0 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* Simple Button Choices - Similar to swap page style */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              {exploreOptions.map((option) => {
                const isSelected = selectedOption === option.id;

                if (option.available) {
                  return (
                    <Button
                      key={option.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOption(option.id)}
                      className={`px-3 py-1.5 rounded-full transition-all text-sm ${
                        isSelected
                          ? 'bg-gray-200/80 dark:bg-gray-700/80 text-gray-900 dark:text-gray-100'
                          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      {option.title}
                    </Button>
                  );
                }

                return (
                  <Button
                    key={option.id}
                    variant="ghost"
                    size="sm"
                    disabled
                    className="px-3 py-1.5 rounded-full text-gray-400 dark:text-gray-500 opacity-60 text-sm"
                  >
                    {option.title}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {option.badge}
                    </Badge>
                  </Button>
                );
              })}
            </div>

            <div className="flex items-center space-x-3">
              {/* Search Bar - Show for Tokens view */}
              {selectedOption === 'tokens' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search tokens..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-48 h-9"
                  />
                </div>
              )}

              {/* Search Bar and Add Liquidity Button - Show for Pools view */}
              {selectedOption === 'pools' && (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search pools..."
                      value={poolSearchQuery}
                      onChange={(e) => setPoolSearchQuery(e.target.value)}
                      className="pl-10 w-48 h-9"
                    />
                  </div>
                  <Button
                    onClick={handleAddLiquidity}
                    className="bg-blue-600 hover:bg-blue-700 text-white gap-2 h-9 px-3 text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    Add Liquidity
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Content */}
          {selectedOption === 'tokens' && renderTokensContent()}
          {selectedOption === 'pools' && renderPoolsContent()}
          {selectedOption === 'transactions' && renderTransactionsContent()}
        </div>
      </main>
    </div>
  );
}
