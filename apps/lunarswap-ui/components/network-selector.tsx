'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useNetwork } from '@/hooks/use-network';
import { useWallet } from '@/hooks/use-wallet';
import { useState, useEffect } from 'react';

export function NetworkSelector() {
  const { currentNetwork, setCurrentNetwork, availableNetworks, isNetworkSynced, syncWithWallet } = useNetwork();
  const { isWalletConnected } = useWallet();
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark as hydrated after initial render
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleNetworkChange = async (network: typeof availableNetworks[0]) => {
    setCurrentNetwork(network);
    
    // If wallet is connected, try to sync with the new network
    if (isWalletConnected) {
      await syncWithWallet();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 rounded-full border-gray-300 dark:border-gray-700 bg-white/80 dark:bg-gray-800 text-sm font-medium"
        >
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${currentNetwork.type === 'mainnet' ? 'bg-green-500' : 'bg-yellow-500'}`}
            />
            {currentNetwork.name}
            {isHydrated && isWalletConnected && (
              <div className="flex items-center">
                {isNetworkSynced ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
              </div>
            )}
          </div>
          <ChevronDown className="ml-2 h-4 w-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        <div className="p-2">
          {isHydrated && isWalletConnected && (
            <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Wallet Sync:</span>
                {isNetworkSynced ? (
                  <span className="text-green-600 dark:text-green-400">Synced</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400">Not Synced</span>
                )}
              </div>
              {!isNetworkSynced && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={syncWithWallet}
                  className="h-6 text-xs"
                >
                  Sync Now
                </Button>
              )}
            </div>
          )}

          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
            Mainnet
          </div>
          {availableNetworks
            .filter((n) => n.type === 'mainnet')
            .map((network) => (
              <DropdownMenuItem
                key={network.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleNetworkChange(network)}
              >
                <span>{network.name}</span>
                {currentNetwork.id === network.id && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </DropdownMenuItem>
            ))}

          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-3 mb-1.5">
            Testnet
          </div>
          {availableNetworks
            .filter((n) => n.type === 'testnet')
            .map((network) => (
              <DropdownMenuItem
                key={network.id}
                className="flex items-center justify-between cursor-pointer"
                onClick={() => handleNetworkChange(network)}
              >
                <span>{network.name}</span>
                {currentNetwork.id === network.id && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
              </DropdownMenuItem>
            ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
