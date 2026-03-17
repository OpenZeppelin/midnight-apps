'use client';
import { Droplets, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TokenIcon } from '@/components/token-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useLunarswapContext } from '@/lib/lunarswap-context';
import {
  userDeployedTokenToToken,
  useShieldedTokenContext,
} from '@/lib/shielded-token-context';
import {
  getAllTokens,
  type Token as TokenConfigType,
} from '@/lib/token-config';

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
  const { allPairs } = useLunarswapContext();
  const { userDeployedTokens } = useShieldedTokenContext();
  const allTokensList = useMemo(
    () => getAllTokens(userDeployedTokens.map(userDeployedTokenToToken)),
    [userDeployedTokens],
  );
  const navigate = useNavigate();

  // Convert Uint8Array to lowercase hex
  const bytesToHex = (bytes: Uint8Array): string =>
    Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toLowerCase();

  // Derive available tokens from pairs (pure computation, no side effects)
  const availableTokens = useMemo(() => {
    if (!show || allPairs.length === 0) {
      return [];
    }

    // Extract unique tokens from all pairs
    const tokenSet = new Set<string>();
    for (const { pair } of allPairs) {
      tokenSet.add(bytesToHex(pair.token0Type));
      tokenSet.add(bytesToHex(pair.token1Type));
    }

    // Filter all tokens to only include those with pools
    return allTokensList.filter((token: TokenConfigType) => {
      const tokenType = token.type.replace(/^0x/i, '').toLowerCase();
      const tokenTypeWithoutPrefix = tokenType.replace(/^0200/, '');

      if (tokenSet.has(tokenType) || tokenSet.has(tokenTypeWithoutPrefix)) {
        return true;
      }

      return Array.from(tokenSet).some(
        (poolType) =>
          poolType === tokenTypeWithoutPrefix ||
          `0200${poolType}` === tokenType,
      );
    });
  }, [show, allPairs, allTokensList]);

  // Use custom tokens if provided, otherwise use the default logic
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
