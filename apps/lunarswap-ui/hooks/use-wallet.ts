import { useContext } from 'react';
import { WalletContext, type WalletContextType } from '@/lib/wallet-context';

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