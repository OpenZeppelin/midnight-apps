'use client';

import { useWalletRx } from '@/hooks/use-wallet-rx';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

interface BalanceDisplayProps {
  showSyncStatus?: boolean;
  showRefreshButton?: boolean;
  showAllBalances?: boolean;
  className?: string;
}

export function BalanceDisplay({
  showSyncStatus = true,
  showRefreshButton = true,
  showAllBalances = false,
  className = '',
}: BalanceDisplayProps) {
  const { nativeBalance, allBalances, isSynced, syncProgress, refresh } =
    useWalletRx();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!isRefreshing) {
      setIsRefreshing(true);
      try {
        await refresh();
        toast.success('Balance updated');
      } catch (error) {
        toast.error('Failed to update balance');
        console.error('Balance refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  const formatBalance = (balance: bigint | null): string => {
    if (balance === null) return '0';

    // Convert bigint to string with proper formatting
    // For now, just convert to string. You might want to add decimal handling
    // based on token decimals (e.g., divide by 10^18 for tokens with 18 decimals)
    const balanceStr = balance.toString();

    // Add basic formatting for large numbers
    if (balanceStr.length > 12) {
      // For very large numbers, show in scientific notation or with commas
      return Number(balanceStr).toLocaleString();
    }

    return balanceStr;
  };

  const getSyncStatusText = () => {
    if (!syncProgress) return 'Unknown';
    if (syncProgress.synced) return 'Synced';
    return 'Syncing...';
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Balance Display */}
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold">
          {formatBalance(nativeBalance)}
        </span>
        <span className="text-lg font-medium text-muted-foreground">DUST</span>
        {showRefreshButton && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 rounded-full hover:bg-muted disabled:opacity-50 transition-colors"
            title="Refresh balance"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
            />
          </button>
        )}
      </div>

      {/* All Balances Display */}
      {showAllBalances && allBalances && (
        <div className="mt-2 p-2 bg-muted rounded text-xs max-w-xs">
          <div className="font-medium mb-1">All Token Balances:</div>
          <div className="space-y-1">
            {Object.entries(allBalances).map(([token, balance]) => (
              <div key={token} className="flex justify-between">
                <span className="font-mono">{token}:</span>
                <span className="font-mono">{balance.toString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sync Status */}
      {showSyncStatus && (
        <div className="flex items-center gap-2 mt-1 text-sm">
          <span className="text-muted-foreground">Status:</span>
          <span
            className={`font-medium ${isSynced ? 'text-green-600' : 'text-yellow-600'}`}
          >
            {getSyncStatusText()}
          </span>
        </div>
      )}

      {/* Sync Progress Details */}
      {showSyncStatus && syncProgress && !syncProgress.synced && (
        <div className="mt-2 p-2 bg-muted rounded text-xs">
          <div className="space-y-1">
            <div>Backend lag: {syncProgress.lag.sourceGap.toString()}</div>
            <div>Wallet lag: {syncProgress.lag.applyGap.toString()}</div>
          </div>
        </div>
      )}
    </div>
  );
}
