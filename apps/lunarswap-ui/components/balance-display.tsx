'use client';
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
  showAllBalances = true,
  className = '',
}: BalanceDisplayProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!isRefreshing) {
      setIsRefreshing(true);
      try {
        // Placeholder for future implementation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        toast.success('Wallet state updated');
      } catch (error) {
        toast.error('Failed to update wallet state');
        console.error('Wallet refresh error:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Balance Display */}
      <div className="flex items-center gap-3 mb-2">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">0.00</div>
          <div className="text-sm text-muted-foreground mt-1">DUST</div>
        </div>
        {showRefreshButton && (
          <button
            disabled
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-full bg-muted/50 hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Refresh wallet state"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* All Balances Display */}
      {showAllBalances && (
        <div className="w-full max-w-xs p-3 bg-muted/30 rounded-lg border border-border/50">
          <div className="font-medium text-sm mb-2 text-foreground">
            Token Balances
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-muted-foreground">NIGHT</span>
              <span className="font-mono text-sm font-medium">0.00</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-sm text-muted-foreground">USDC</span>
              <span className="font-mono text-sm font-medium">0.00</span>
            </div>
          </div>
        </div>
      )}

      {/* Sync Status */}
      {showSyncStatus && (
        <div className="flex items-center gap-2 mt-3 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-muted-foreground">Status:</span>
          <span className="font-medium text-green-600">Connected</span>
        </div>
      )}

      {/* Error Display */}
      {/* Error display will be available when wallet integration is complete */}

      {/* Info Message */}
      <div className="mt-3 text-xs text-muted-foreground text-center max-w-xs">
        Balance and sync information will be available in future updates
      </div>
    </div>
  );
}
