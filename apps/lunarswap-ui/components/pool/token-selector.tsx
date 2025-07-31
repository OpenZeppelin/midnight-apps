'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search } from 'lucide-react';
import { useState } from 'react';
import { Identicon } from '@/components/identicon';

// Deployed testnet tokens
const popularTokens = [
  {
    symbol: 'TUSD',
    name: 'Test USD',
    type: '0200fb81b15b883bcbba5630c6f9111d85bd6b237afda821789e2bd049f483cfbf3c', // TUSD token type
    address:
      '020050fdd8e2eea82068e6bab6ad0c78ef7e0c050dd9fc1d0a32495c95310c4e1959', // TUSD contract address
  },
  {
    symbol: 'TEURO',
    name: 'Test Euro',
    type: '02003af426c10783ffe699149c2ef39edb7a6e05e2a2bfe1c3a90e1add8a9d6e2dac', // TEURO token type
    address:
      '02007285b48ebb1f85fc6cc7b1754a64deed1f2210b4c758a37309039510acb8781a', // TEURO contract address
  },
  {
    symbol: 'TJPY',
    name: 'Test Japanese Yen',
    type: '020011a6de51d7633b00f9c5f9408c836a5566870f9366f14022814735eec0663a0b', // TJPY token type
    address:
      '02003854ada114516d9ebe65061da7c3f9f00830afdd47c749ed9e2836d36a026d01', // TJPY contract address
  },
  {
    symbol: 'TCNY',
    name: 'Test Chinese Yuan',
    type: '0200e6b100604d6e10e080948e43cfc4aa1646e32d972d4aada3ac36ce430443911d', // TCNY token type
    address:
      '02001e10cca412097c53af918b4532865823e3850fbaf2f66203036acfab324df5c9', // TCNY contract address
  },
  {
    symbol: 'TARS',
    name: 'Test Argentine Peso',
    type: '020063482c03ec84e6e9bf55ef1eef9ea431f2c434921fab43f9d4c3e60d884a4c6a', // TARS token type
    address:
      '02009161411a0e1e51467c8559444efb09d6a372aca23b3e6613c5b9394ba3d4befd', // TARS contract address
  },
];

interface TokenSelectorProps {
  selectedToken: any;
  onSelectToken: (token: any) => void;
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

  const filteredTokens = popularTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectToken = (token: any) => {
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
        className="w-full justify-between h-12 bg-white dark:bg-gray-800"
        onClick={() => setOpen(true)}
      >
        {selectedToken ? (
          <div className="flex items-center">
            {showTokenIcon && (
              <div className="relative h-6 w-6 mr-2">
                <Identicon address={selectedToken.address} size={24} />
              </div>
            )}
            <span>{selectedToken.symbol}</span>
          </div>
        ) : (
          <span className="text-gray-500 dark:text-gray-400">
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
                className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                onClick={() => handleSelectToken(token)}
              >
                <div className="relative h-8 w-8 rounded-full overflow-hidden">
                  <Identicon address={token.address} size={32} />
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
