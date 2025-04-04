'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

type Network = {
  id: string;
  name: string;
  type: 'mainnet' | 'testnet';
};

const networks: Network[] = [
  { id: 'Midnight testnet', name: 'testnet', type: 'testnet' },
  { id: 'Midnight mainnet', name: 'mainnet', type: 'mainnet' },
];

export function NetworkSelector() {
  const [selectedNetwork, setSelectedNetwork] = useState<Network>(networks[0]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-sm font-medium"
        >
          <div
            className={`w-2 h-2 rounded-full mr-2 ${selectedNetwork.type === 'mainnet' ? 'bg-green-500' : 'bg-yellow-500'}`}
          />
          {selectedNetwork.name}
          <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <div className="p-2">
          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Mainnet
          </div>
          {networks
            .filter((n) => n.type === 'mainnet')
            .map((network) => (
              <DropdownMenuItem
                key={network.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSelectedNetwork(network)}
              >
                <span>{network.name}</span>
                {selectedNetwork.id === network.id && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </DropdownMenuItem>
            ))}

          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 mb-1.5">
            Testnet
          </div>
          {networks
            .filter((n) => n.type === 'testnet')
            .map((network) => (
              <DropdownMenuItem
                key={network.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setSelectedNetwork(network)}
              >
                <span>{network.name}</span>
                {selectedNetwork.id === network.id && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </DropdownMenuItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
