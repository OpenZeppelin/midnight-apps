import type {
  ProverKey,
  VerifierKey,
  ZKIR,
} from '@midnight-ntwrk/midnight-js-types';
import type {
  MidnightProviders,
  PrivateStateProvider,
  PublicDataProvider,
} from '@midnight-ntwrk/midnight-js-types';
import type { ProofProvider } from '@midnight-ntwrk/midnight-js-types';
import type { WalletProvider } from '@midnight-ntwrk/midnight-js-types';
import type { MidnightProvider } from '@midnight-ntwrk/midnight-js-types';

type CacheKey =
  | `proverKey:${string}`
  | `verifierKey:${string}`
  | `zkir:${string}`;

// Dynamic imports to avoid SSR issues
let levelPrivateStateProvider: any;
let FetchZkConfigProvider: any;
let httpClientProofProvider: any;

// Initialize providers only on client side
const initializeProviders = async () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (!levelPrivateStateProvider) {
    const { levelPrivateStateProvider: lpsp } = await import(
      '@midnight-ntwrk/midnight-js-level-private-state-provider'
    );
    levelPrivateStateProvider = lpsp;
  }

  if (!FetchZkConfigProvider) {
    const { FetchZkConfigProvider: fzcp } = await import(
      '@midnight-ntwrk/midnight-js-fetch-zk-config-provider'
    );
    FetchZkConfigProvider = fzcp;
  }

  if (!httpClientProofProvider) {
    const { httpClientProofProvider: hcpp } = await import(
      '@midnight-ntwrk/midnight-js-http-client-proof-provider'
    );
    httpClientProofProvider = hcpp;
  }
};

export class CachedFetchZkConfigProvider<K extends string> {
  private readonly cache: Map<CacheKey, ProverKey | VerifierKey | ZKIR>;
  private baseURL: string;
  private fetchFunc: typeof fetch;
  private callback: (
    action: 'downloadProverStarted' | 'downloadProverDone',
  ) => void;
  private provider: any;

  constructor(
    baseURL: string,
    fetchFunc: typeof fetch = fetch,
    callback: (action: 'downloadProverStarted' | 'downloadProverDone') => void,
  ) {
    this.baseURL = baseURL;
    this.fetchFunc = fetchFunc;
    this.callback = callback;
    this.cache = new Map();
  }

  private async getProvider() {
    if (!this.provider) {
      await initializeProviders();
      if (FetchZkConfigProvider) {
        this.provider = new FetchZkConfigProvider(this.baseURL, this.fetchFunc);
      }
    }
    return this.provider;
  }

  private generateCacheKey(
    type: 'proverKey' | 'verifierKey' | 'zkir',
    circuitId: K,
  ): CacheKey {
    return `${type}:${circuitId}` as CacheKey;
  }

  async getProverKey(circuitId: K): Promise<ProverKey> {
    try {
      this.callback('downloadProverStarted');
      const cacheKey = this.generateCacheKey('proverKey', circuitId);
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey) as ProverKey;
      }

      const provider = await this.getProvider();
      if (!provider) {
        throw new Error('Provider not initialized');
      }

      const proverKey = await provider.getProverKey(circuitId);
      this.cache.set(cacheKey, proverKey);
      return proverKey;
    } finally {
      this.callback('downloadProverDone');
    }
  }

  async getVerifierKey(circuitId: K): Promise<VerifierKey> {
    const cacheKey = this.generateCacheKey('verifierKey', circuitId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as VerifierKey;
    }

    const provider = await this.getProvider();
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const verifierKey = await provider.getVerifierKey(circuitId);
    this.cache.set(cacheKey, verifierKey);
    return verifierKey;
  }

  async getZKIR(circuitId: K): Promise<ZKIR> {
    const cacheKey = this.generateCacheKey('zkir', circuitId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as ZKIR;
    }

    const provider = await this.getProvider();
    if (!provider) {
      throw new Error('Provider not initialized');
    }

    const zkir = await provider.getZKIR(circuitId);
    this.cache.set(cacheKey, zkir);
    return zkir;
  }

  async getVerifierKeys(circuitIds: K[]): Promise<[K, VerifierKey][]> {
    const result: [K, VerifierKey][] = [];
    for (const circuitId of circuitIds) {
      result.push([circuitId, await this.getVerifierKey(circuitId)]);
    }
    return result;
  }

  async get(circuitId: K): Promise<{
    circuitId: K;
    proverKey: ProverKey;
    verifierKey: VerifierKey;
    zkir: ZKIR;
  }> {
    const [proverKey, verifierKey, zkir] = await Promise.all([
      this.getProverKey(circuitId),
      this.getVerifierKey(circuitId),
      this.getZKIR(circuitId),
    ]);
    return { circuitId, proverKey, verifierKey, zkir };
  }
}

export const createProofClient = <K extends string>(
  url: string,
  callback: (status: 'proveTxStarted' | 'proveTxDone') => void,
) => {
  return {
    async proveTx(tx: any, proveTxConfig?: any): Promise<any> {
      try {
        await initializeProviders();
        callback('proveTxStarted');

        if (!httpClientProofProvider) {
          throw new Error('Proof provider not available');
        }

        const provider = httpClientProofProvider(url.trim());
        const result = await provider.proveTx(tx, proveTxConfig);
        return result;
      } finally {
        callback('proveTxDone');
      }
    },
  };
};

export const createMidnightProviders = async <K extends string, T>(
  publicDataProvider: PublicDataProvider,
  walletProvider: WalletProvider,
  midnightProvider: MidnightProvider,
  walletAPI: any,
  callback: (
    action:
      | 'downloadProverStarted'
      | 'downloadProverDone'
      | 'proveTxStarted'
      | 'proveTxDone',
  ) => void,
): Promise<MidnightProviders<K, string, T>> => {
  await initializeProviders();

  if (!levelPrivateStateProvider) {
    throw new Error('Private state provider not available');
  }

  const privateStateProvider: PrivateStateProvider<string, T> =
    levelPrivateStateProvider({
      privateStateStoreName: 'lunarswap-private-state',
    });

  const proofProvider: ProofProvider<K> = createProofClient<K>(
    walletAPI.uris.proverServerUri,
    callback,
  );

  return {
    privateStateProvider,
    publicDataProvider,
    zkConfigProvider: new CachedFetchZkConfigProvider<K>(
      typeof window !== 'undefined'
        ? window.location.origin
        : 'http://localhost:3000',
      typeof window !== 'undefined' ? window.fetch : fetch,
      callback,
    ),
    proofProvider,
    walletProvider,
    midnightProvider,
  };
};
