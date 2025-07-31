import React, { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { StarsBackground } from '@/components/stars-background';
import { MoonDustBackground } from '@/components/moon-dust-background';
import { Identicon } from '@/components/identicon';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, ExternalLink, Search, Grid3X3, List, Clock } from 'lucide-react';
import { DEMO_TOKENS } from '@/lib/contract-integration';
import { useViewPreference } from '@/hooks/use-view-preference';

interface Token {
  symbol: string;
  name: string;
  address: string;
  type: string;
}

export const metadata = {
  title: 'Explore & Manage Midnight Tokens',
  description:
    'Explore and manage all supported Midnight tokens on Lunarswap. View contract addresses, token types, and detailed information for TUSD, TEURO, TJPY, TCNY, and TARS.',
};

function TokensContent() {
  useEffect(() => {
    document.title = 'Explore & Manage Midnight Tokens';
  }, []);

  const viewPreference = useViewPreference();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    viewPreference === 'horizontal' ? 'grid' : 'list',
  );

  // Update view mode when view preference changes
  useEffect(() => {
    setViewMode(viewPreference === 'horizontal' ? 'grid' : 'list');
  }, [viewPreference]);

  const tokens: Token[] = Object.values(DEMO_TOKENS);

  const filteredTokens = tokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const copyToClipboard = async (text: string, fieldId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldId);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  const GridView = () => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {filteredTokens.map((token) => (
        <Card
          key={token.symbol}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30"
        >
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="relative h-12 w-12 rounded-full overflow-hidden">
                <Identicon address={token.address} size={48} />
              </div>
              <div>
                <CardTitle className="text-lg">{token.symbol}</CardTitle>
                <CardDescription>{token.name}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Contract Address
                </span>
                <Badge variant="secondary" className="text-xs">
                  Contract
                </Badge>
              </div>
              <div className="relative">
                <button
                  type="button"
                  className="w-full text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border text-wrap break-all cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left font-mono"
                  onClick={() =>
                    copyToClipboard(token.address, `${token.symbol}-address`)
                  }
                  title="Click to copy address"
                >
                  {formatAddress(token.address)}
                </button>
                {copiedField === `${token.symbol}-address` && (
                  <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded border flex items-center justify-center">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      Copied!
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Token Type
                </span>
                <Badge variant="outline" className="text-xs">
                  Type
                </Badge>
              </div>
              <div className="relative">
                <button
                  type="button"
                  className="w-full text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border text-wrap break-all cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left font-mono"
                  onClick={() =>
                    copyToClipboard(token.type, `${token.symbol}-type`)
                  }
                  title="Click to copy type"
                >
                  {formatAddress(token.type)}
                </button>
                {copiedField === `${token.symbol}-type` && (
                  <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded border flex items-center justify-center">
                    <span className="text-xs font-medium text-green-700 dark:text-green-300">
                      Copied!
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" size="sm" className="w-full" disabled>
                <Clock className="h-3 w-3 mr-2" />
                Explorer - Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ListView = () => (
    <div className="space-y-4">
      {filteredTokens.map((token) => (
        <Card
          key={token.symbol}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                  <Identicon address={token.address} size={48} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{token.symbol}</h3>
                  <p className="text-sm text-muted-foreground">{token.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  <Clock className="h-3 w-3 mr-2" />
                  Explorer - Coming Soon
                </Button>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Contract Address
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    Contract
                  </Badge>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border font-mono cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                    onClick={() =>
                      copyToClipboard(
                        token.address,
                        `${token.symbol}-address-list`,
                      )
                    }
                    title="Click to copy address"
                  >
                    {token.address}
                  </button>
                  {copiedField === `${token.symbol}-address-list` && (
                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded border flex items-center justify-center">
                      <span className="text-xs font-medium text-green-700 dark:text-green-300">
                        Copied!
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Token Type
                  </span>
                  <Badge variant="outline" className="text-xs">
                    Type
                  </Badge>
                </div>
                <div className="relative">
                  <button
                    type="button"
                    className="w-full text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded border font-mono cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-left"
                    onClick={() =>
                      copyToClipboard(token.type, `${token.symbol}-type-list`)
                    }
                    title="Click to copy type"
                  >
                    {token.type}
                  </button>
                  {copiedField === `${token.symbol}-type-list` && (
                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded border flex items-center justify-center">
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
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-b dark:from-[#0f172a] dark:via-[#1e293b] dark:to-[#0f172a] text-foreground">
      <StarsBackground />
      <MoonDustBackground />
      <Header />
      <main className="container mx-auto px-4 py-8 relative z-0 pt-24">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Supported Tokens</h1>
            <p className="text-muted-foreground">
              Complete list of tokens available on Lunarswap with their contract
              addresses and types.
            </p>
          </div>

          {/* Search and View Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full sm:w-auto">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tokens by name, symbol, or address..."
                className="pl-9 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-sm text-muted-foreground">View:</span>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'outline'}
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Results count */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredTokens.length} of {tokens.length} tokens
            </p>
          </div>

          {/* Token Display */}
          {filteredTokens.length === 0 ? (
            <div className="text-center py-12">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No tokens found
              </h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search query or clear the search to see all
                tokens.
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setSearchQuery('')}
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <>{viewMode === 'grid' ? <GridView /> : <ListView />}</>
          )}

          <div className="mt-12 text-center">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30 max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="text-lg">About Test Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  These are test tokens deployed on the Midnight testnet for
                  development and testing purposes. They have no real value and
                  are used to demonstrate Lunarswap functionality.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Tokens:</span>
                    <span className="ml-2">{tokens.length}</span>
                  </div>
                  <div>
                    <span className="font-medium">Network:</span>
                    <span className="ml-2">Midnight Testnet</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function TokensPage() {
  return <TokensContent />;
}
