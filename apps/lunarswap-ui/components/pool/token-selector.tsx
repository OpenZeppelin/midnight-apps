'use client';

import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import { TokenIcon } from '@/components/token-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Token as UiToken } from '@/lib/token-config';
import { popularTokens } from '@/lib/token-config';

interface TokenSelectorProps {
  selectedToken: UiToken | null;
  onSelectToken: (token: UiToken) => void;
  placeholder?: string;
  showTokenIcon?: boolean;
}

export function TokenSelector({
  selectedToken,
  onSelectToken,
  placeholder = 'Select a token',
  showTokenIcon = true,
}: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Always show all popular tokens for add liquidity, not just tokens in existing pools
  // This allows users to create new pools for any token pair
  const availableTokens = popularTokens;

  const filteredTokens = availableTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectToken = (token: UiToken) => {
    onSelectToken(token);
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="token-selector-dialog"
        className={`w-full justify-between h-12 ${
          selectedToken
            ? 'bg-white dark:bg-gray-800'
            : 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500 hover:border-blue-600'
        }`}
        onClick={() => setOpen(true)}
      >
        {selectedToken ? (
          <div className="flex items-center">
            {showTokenIcon && (
              <div className="relative h-6 w-6 mr-2">
                <TokenIcon symbol={selectedToken.symbol} size={24} />
              </div>
            )}
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span
            className={
              selectedToken ? 'text-gray-500 dark:text-gray-400' : 'text-white'
            }
          >
            {placeholder}
          </span>
        )}
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          id="token-selector-dialog"
          className="sm:max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-gray-200/50 dark:border-blue-900/30 text-foreground rounded-2xl"
        >
          <DialogHeader>
            <DialogTitle>Select a token</DialogTitle>
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
            {filteredTokens.map((token) => (
              <button
                key={token.symbol}
                type="button"
                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                onClick={() => handleSelectToken(token)}
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
            ))}

            {filteredTokens.length === 0 && (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                No tokens found
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
