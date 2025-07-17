'use client';

import { useState, useCallback } from 'react';
import { useWallet } from './use-wallet';
import { createMidnightProviders } from '@/lib/midnight-providers';
import type { DAppConnectorWalletAPI } from '@/lib/types';

export type TransactionStatus =
  | 'idle'
  | 'preparing'
  | 'proving'
  | 'submitting'
  | 'success'
  | 'error';

export interface TransactionState {
  status: TransactionStatus;
  error?: string;
  txHash?: string;
}

export interface UseMidnightTransactionReturn {
  transactionState: TransactionState;
  executeTransaction: <T>(
    transactionFn: (
      providers: any,
      walletAPI: DAppConnectorWalletAPI,
    ) => Promise<T>,
  ) => Promise<T | null>;
  resetTransaction: () => void;
}

export const useMidnightTransaction = (): UseMidnightTransactionReturn => {
  const { wallet, walletState } = useWallet();
  const [transactionState, setTransactionState] = useState<TransactionState>({
    status: 'idle',
  });

  const resetTransaction = useCallback(() => {
    setTransactionState({ status: 'idle' });
  }, []);

  const executeTransaction = useCallback(
    async <T>(
      transactionFn: (
        providers: any,
        walletAPI: DAppConnectorWalletAPI,
      ) => Promise<T>,
    ): Promise<T | null> => {
      if (!wallet || !walletState) {
        setTransactionState({
          status: 'error',
          error: 'Wallet not connected',
        });
        return null;
      }

      // Check if Midnight.js providers are available
      if (
        !wallet.publicDataProvider ||
        !wallet.walletProvider ||
        !wallet.midnightProvider ||
        !wallet.uris
      ) {
        setTransactionState({
          status: 'error',
          error:
            'Midnight.js providers not available. Please ensure you have the latest wallet version.',
        });
        return null;
      }

      try {
        setTransactionState({ status: 'preparing' });

        // Create callback for transaction status updates
        const callback = (
          action:
            | 'downloadProverStarted'
            | 'downloadProverDone'
            | 'proveTxStarted'
            | 'proveTxDone',
        ) => {
          if (
            action === 'downloadProverStarted' ||
            action === 'proveTxStarted'
          ) {
            setTransactionState((prev) => ({ ...prev, status: 'proving' }));
          } else if (
            action === 'downloadProverDone' ||
            action === 'proveTxDone'
          ) {
            setTransactionState((prev) => ({ ...prev, status: 'submitting' }));
          }
        };

        // Create Midnight providers (now async)
        const providers = await createMidnightProviders(
          wallet.publicDataProvider,
          wallet.walletProvider,
          wallet.midnightProvider,
          wallet,
          callback,
        );

        // Execute the transaction
        const result = await transactionFn(providers, wallet);

        setTransactionState({
          status: 'success',
          txHash: 'tx_hash_placeholder', // In real implementation, get from transaction result
        });

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Transaction failed';
        setTransactionState({
          status: 'error',
          error: errorMessage,
        });
        return null;
      }
    },
    [wallet, walletState],
  );

  return {
    transactionState,
    executeTransaction,
    resetTransaction,
  };
};
