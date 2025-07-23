import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import type {
  ProofProvider,
  UnbalancedTransaction,
} from '@midnight-ntwrk/midnight-js-types';
import type { ProveTxConfig } from '@midnight-ntwrk/midnight-js-types';
import type { UnprovenTransaction } from '@midnight-ntwrk/ledger';

export const proofClient = <K extends string>(
  url: string,
  callback: (status: 'proveTxStarted' | 'proveTxDone') => void,
) => {
  const httpClientProvider = httpClientProofProvider(url.trim());
  return {
    proveTx: async (
      tx: UnprovenTransaction,
      proveTxConfig?: ProveTxConfig<K>,
    ): Promise<UnbalancedTransaction> => {
      // eslint-disable-next-line n/no-callback-literal
      callback('proveTxStarted');
      try {
        return await httpClientProvider.proveTx(tx, proveTxConfig);
      } finally {
        // eslint-disable-next-line n/no-callback-literal
        callback('proveTxDone');
      }
    },
  };
};

export const noopProofClient = <K extends string>(): ProofProvider<K> => {
  return {
    proveTx(
      _: UnprovenTransaction,
      __: ProveTxConfig<K>,
    ): Promise<UnbalancedTransaction> {
      return Promise.reject(new Error('Proof server not available'));
    },
  };
};
