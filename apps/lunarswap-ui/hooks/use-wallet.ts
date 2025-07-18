import { WalletContext, type WalletContextType } from '@/lib/wallet-context';
import { useContext } from 'react';

/**
 * Retrieves the currently in-scope wallet provider.
 *
 * @returns The currently in-scope wallet context implementation.
 */
export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);

  if (!context) {
    throw new Error('A <WalletProvider /> is required.');
  }

  return context;
};
