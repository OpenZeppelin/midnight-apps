'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search, Droplets, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { TokenIcon } from '@/components/token-icon';
import { useLunarswapContext } from '@/lib/lunarswap-context';
import { useWallet } from '@/hooks/use-wallet';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { popularTokens } from '@/lib/token-config';
import { decodeCoinInfo } from '@midnight-ntwrk/ledger';

interface Token {
  symbol: string;
  name: string;
  type: string;
  address: string;
}

interface TokenSelectModalProps {
  show: boolean;
  onClose: () => void;
  onSelect: (token: Token | null) => void;
  customTokens?: Token[];
  selectedToken?: Token | null;
  isLoading?: boolean;
}

export function TokenSelectModal({
  show,
  onClose,
  onSelect,
  customTokens,
  selectedToken,
  isLoading: externalIsLoading = false,
}: TokenSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableTokens, setAvailableTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { status, allPairs } = useLunarswapContext();
  const { isConnected } = useWallet();
  const navigate = useNavigate();

  // Filter available tokens from global context (only if no custom tokens provided)
  useEffect(() => {
    // If custom tokens are provided, skip the default logic
    if (customTokens && customTokens.length > 0) {
      console.log(
        'TokenSelectModal - Using custom tokens, skipping default logic',
      );
      return;
    }

    // Convert Uint8Array to lowercase hex
    const bytesToHex = (bytes: Uint8Array): string =>
      Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toLowerCase();

    console.log('TokenSelectModal - allPairs length:', allPairs.length);
    console.log('TokenSelectModal - show:', show);

    if (!show) {
      console.log('TokenSelectModal - Modal not shown');
      setAvailableTokens([]);
      return;
    }

    if (allPairs.length === 0) {
      console.log('TokenSelectModal - No pairs available yet, waiting...');
      // Don't set empty tokens, let it show loading state
      return;
    }

    // Extract unique tokens from all pairs
    const tokenSet = new Set<string>();
    for (const { pair } of allPairs) {
      const token0Color = bytesToHex(pair.token0Type);
      const token1Color = bytesToHex(pair.token1Type);
      // Add both tokens from each pair
      tokenSet.add(token0Color);
      tokenSet.add(token1Color);
    }

    console.log('TokenSelectModal - Pool token types:', Array.from(tokenSet));
    console.log(
      'TokenSelectModal - Popular token types:',
      popularTokens.map((t) => t.type.replace(/^0x/i, '').toLowerCase()),
    );

    // Log detailed pool information
    console.log('TokenSelectModal - Detailed pool info:');
    allPairs.forEach((pair, index) => {
      const token0Type = bytesToHex(pair.pair.token0Type);
      const token1Type = bytesToHex(pair.pair.token1Type);
      console.log(`Pool ${index + 1}: ${token0Type} / ${token1Type}`);
    });

    // Filter popular tokens to only include those with pools
    const available = popularTokens.filter((token) => {
      const tokenType = token.type.replace(/^0x/i, '').toLowerCase();
      const tokenTypeWithoutPrefix = tokenType.replace(/^0200/, '');

      // Try exact match first
      let hasMatch = tokenSet.has(tokenType);

      // If no exact match, try without the 0200 prefix
      if (!hasMatch) {
        hasMatch = tokenSet.has(tokenTypeWithoutPrefix);
      }

      // If still no match, try adding 0200 prefix to pool tokens
      if (!hasMatch) {
        hasMatch = Array.from(tokenSet).some(
          (poolType) =>
            poolType === tokenTypeWithoutPrefix ||
            `0200${poolType}` === tokenType,
        );
      }

      console.log(
        `TokenSelectModal - Token ${token.symbol}: ${tokenType} has match: ${hasMatch}`,
      );
      return hasMatch;
    });

    console.log(
      'TokenSelectModal - Available tokens:',
      available.map((t) => t.symbol),
    );
    setAvailableTokens(available);
  }, [show, allPairs, customTokens]);

  // Use custom tokens if provided, otherwise use the default logic
  console.log('TokenSelectModal - Loading states:', {
    externalIsLoading,
    isLoading,
    allPairsLength: allPairs.length,
    customTokensLength: customTokens?.length || 0,
    availableTokensLength: availableTokens.length,
  });
  console.log(
    'TokenSelectModal - customTokens:',
    customTokens?.map((t) => t.symbol),
  );
  console.log(
    'TokenSelectModal - availableTokens:',
    availableTokens.map((t) => t.symbol),
  );
  const tokensToUse =
    customTokens && customTokens.length > 0 ? customTokens : availableTokens;

  const filteredTokens = tokensToUse.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddLiquidity = () => {
    onClose();
    navigate('/pool/new');
  };

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30 text-foreground rounded-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>Select a token</DialogTitle>
          {selectedToken && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect(null)}
                className="text-xs h-7 px-2"
              >
                Clear
              </Button>
            </div>
          )}
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search name or paste address"
            className="pl-9 bg-gray-100/80 dark:bg-gray-700/60 border-gray-300/50 dark:border-blue-900/30 focus-visible:ring-blue-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
          {externalIsLoading ||
          isLoading ||
          allPairs.length === 0 ||
          (customTokens && customTokens.length === 0) ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2" />
              Loading available tokens...
            </div>
          ) : tokensToUse.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <Droplets className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm mb-2">No liquidity pools available</p>
              <p className="text-xs mb-3">
                Add liquidity to create trading pairs
              </p>
              <Button
                onClick={handleAddLiquidity}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Liquidity
              </Button>
            </div>
          ) : filteredTokens.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              No tokens found matching your search
            </div>
          ) : (
            filteredTokens.map((token) => (
              <button
                key={token.symbol}
                type="button"
                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                onClick={() => onSelect(token)}
              >
                <div className="relative h-8 w-8 rounded-full overflow-hidden">
                  <TokenIcon symbol={token.symbol} size={32} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{token.symbol}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {token.name}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
