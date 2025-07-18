import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { useWalletRx } from './use-wallet-rx';

export function useWalletSync() {
  const { isSynced, syncProgress, nativeBalance, waitForSync, waitForFunds } =
    useWalletRx();

  const [isSyncing, setIsSyncing] = useState(false);
  const [isWaitingForFunds, setIsWaitingForFunds] = useState(false);

  const syncWallet = useCallback(async () => {
    setIsSyncing(true);
    try {
      await waitForSync();
      toast.success('Wallet synced successfully');
      return true;
    } catch (error) {
      console.error('Wallet sync error:', error);
      toast.error('Failed to sync wallet');
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [waitForSync]);

  const waitForWalletFunds = useCallback(async () => {
    setIsWaitingForFunds(true);
    try {
      const balance = await waitForFunds();
      toast.success(`Funds received! Balance: ${balance.toString()} DUST`);
      return balance;
    } catch (error) {
      console.error('Wait for funds error:', error);
      toast.error('Failed to wait for funds');
      return null;
    } finally {
      setIsWaitingForFunds(false);
    }
  }, [waitForFunds]);

  const getSyncStatusText = useCallback(() => {
    if (!syncProgress) return 'Unknown';
    if (syncProgress.synced) return 'Synced';
    return 'Syncing...';
  }, [syncProgress]);

  const getSyncStatusColor = useCallback(() => {
    if (isSynced) return 'text-green-600';
    return 'text-yellow-600';
  }, [isSynced]);

  return {
    // Status
    isWalletSynced: isSynced,
    syncProgress,
    nativeTokenBalance: nativeBalance,

    // Loading states
    isSyncing,
    isWaitingForFunds,

    // Actions
    syncWallet,
    waitForWalletFunds,

    // Utilities
    getSyncStatusText,
    getSyncStatusColor,
  };
}
