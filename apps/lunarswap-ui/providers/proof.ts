import type { UnprovenTransaction } from '@midnight-ntwrk/ledger-v7';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import type {
  ProofProvider,
  ProveTxConfig,
  UnboundTransaction,
  ZKConfigProvider,
} from '@midnight-ntwrk/midnight-js-types';

export const proofClient = <K extends string>(
  url: string,
  zkConfigProvider: ZKConfigProvider<K>,
  callback: (status: 'proveTxStarted' | 'proveTxDone') => void,
): ProofProvider => {
  const httpClientProvider = httpClientProofProvider(
    url.trim(),
    zkConfigProvider,
  );
  return {
    proveTx: async (
      tx: UnprovenTransaction,
      proveTxConfig?: ProveTxConfig,
    ): Promise<UnboundTransaction> => {
      // eslint-disable-next-line n/no-callback-literal
      callback('proveTxStarted');
      try {
        const extendedConfig: ProveTxConfig = {
          ...proveTxConfig,
          // Increase default timeout to 15 minutes to accommodate long proof generation
          timeout: proveTxConfig?.timeout ?? 900_000,
        };
        return await httpClientProvider.proveTx(tx, extendedConfig);
      } finally {
        // eslint-disable-next-line n/no-callback-literal
        callback('proveTxDone');
      }
    },
  };
};

export const noopProofClient = (): ProofProvider => {
  return {
    proveTx(
      _: UnprovenTransaction,
      __: ProveTxConfig,
    ): Promise<UnboundTransaction> {
      return Promise.reject(new Error('Proof server not available'));
    },
  };
};
