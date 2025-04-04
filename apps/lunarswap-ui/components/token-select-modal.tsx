'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

const popularTokens = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    logo: '/placeholder.svg?height=32&width=32',
    balance: '1.56',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    logo: '/placeholder.svg?height=32&width=32',
    balance: '2,456.78',
  },
  {
    symbol: 'USDT',
    name: 'Tether',
    logo: '/placeholder.svg?height=32&width=32',
    balance: '1,245.00',
  },
  {
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    logo: '/placeholder.svg?height=32&width=32',
    balance: '567.89',
  },
  {
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    logo: '/placeholder.svg?height=32&width=32',
    balance: '0.05',
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    logo: '/placeholder.svg?height=32&width=32',
    balance: '125.45',
  },
];

interface TokenSelectModalProps {
  show: boolean;
  onClose: () => void;
  onSelect: (token: any) => void;
}

export function TokenSelectModal({
  show,
  onClose,
  onSelect,
}: TokenSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = popularTokens.filter(
    (token) =>
      token.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.symbol.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <Dialog open={show} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-800/90 backdrop-blur-md border-gray-200 dark:border-blue-900/50 text-foreground rounded-2xl">
        <DialogHeader className="flex flex-row items-center justify-between">
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
              onClick={() => onSelect(token)}
            >
              <div className="relative h-8 w-8 rounded-full overflow-hidden">
                <Image
                  src={token.logo || '/placeholder.svg'}
                  alt={token.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="font-medium">{token.symbol}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {token.name}
                </span>
              </div>
              <span className="ml-auto text-gray-500 dark:text-gray-400">
                {token.balance}
              </span>
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
  );
}
