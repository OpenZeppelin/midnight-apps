'use client';

import { Check, ChevronDown, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNetwork } from '@/hooks/use-network';
import { useWallet } from '@/hooks/use-wallet';

export function NetworkSelector() {
  const {
    currentNetwork,
    setCurrentNetwork,
    availableNetworks,
    isNetworkSynced,
    syncWithWallet,
  } = useNetwork();
  const { isConnected } = useWallet();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleNetworkChange = async (
    network: (typeof availableNetworks)[0],
  ) => {
    if (!network.available) {
      return;
    }
    setCurrentNetwork(network);
    if (isConnected) {
      await syncWithWallet();
    }
  };

  const handleSyncClick = async () => {
    if (!isConnected || isSyncing) return;
    setIsSyncing(true);
    try {
      await syncWithWallet();
    } catch (error) {
      console.error('Failed to sync wallet:', error);
    } finally {
      setIsSyncing(false);
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
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            {currentNetwork.name}
            {isHydrated && isConnected && (
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
      <DropdownMenuContent align="end" className="w-[220px]">
        <div className="p-2">
          {isHydrated && isConnected && (
            <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">Wallet Sync:</span>
                {isNetworkSynced ? (
                  <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                    <Wifi className="h-3 w-3" />
                    Synced
                  </span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                    <WifiOff className="h-3 w-3" />
                    Not Synced
                  </span>
                )}
              </div>
              {!isNetworkSynced && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncClick}
                  disabled={isSyncing}
                  className="w-full h-8 text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/20 dark:hover:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              )}
            </div>
          )}

          {availableNetworks.map((network) => (
            <DropdownMenuItem
              key={network.id}
              className={`flex items-center justify-between cursor-pointer ${
                !network.available ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => handleNetworkChange(network)}
              disabled={!network.available}
            >
              <span>
                {network.name}
                {!network.available ? ' (Coming Soon)' : ''}
              </span>
              {currentNetwork.id === network.id && network.available && (
                <Check className="h-4 w-4 text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
