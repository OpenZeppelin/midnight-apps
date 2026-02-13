'use client';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface BalanceDisplayProps {
  showSyncStatus?: boolean;
  showRefreshButton?: boolean;
  showAllBalances?: boolean;
  className?: string;
}

export function BalanceDisplay({
  showRefreshButton = true,
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
      <div className="flex items-center gap-3">
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
    </div>
  );
}
