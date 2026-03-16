import { useContext } from 'react';
import { NetworkContext, type NetworkContextType } from '@/lib/network-context';

/**
 * Retrieves the currently in-scope network provider.
 *
 * @returns The currently in-scope network context implementation.
 */
export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('A <NetworkProvider /> is required.');
  }

  return context;
};
