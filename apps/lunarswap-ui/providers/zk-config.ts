import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import type {
  ProverKey,
  VerifierKey,
  ZKIR,
} from '@midnight-ntwrk/midnight-js-types';
import { fetch } from 'cross-fetch';

type CacheKey =
  | `proverKey:${string}`
  | `verifierKey:${string}`
  | `zkir:${string}`;

export class ZkConfigProviderWrapper<
  K extends string,
> extends FetchZkConfigProvider<K> {
  private readonly cache: Map<CacheKey, ProverKey | VerifierKey | ZKIR>;
  private readonly fallbacks: FetchZkConfigProvider<string>[];

  constructor(
    baseURL: string,
    private readonly callback: (
      action: 'downloadProverStarted' | 'downloadProverDone',
    ) => void,
    fetchFunc: typeof fetch = fetch,
    fallbackBaseURLs: string[] = [],
  ) {
    super(baseURL, fetchFunc);
    this.cache = new Map();
    this.fallbacks = fallbackBaseURLs.map(
      (url) => new FetchZkConfigProvider(url, fetchFunc),
    );
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

      const proverKey = await this.fetchWithFallback(
        (p, id) => p.getProverKey(id),
        circuitId,
      );
      this.cache.set(cacheKey, proverKey as ProverKey);
      return proverKey as ProverKey;
    } finally {
      this.callback('downloadProverDone');
    }
  }

  async getVerifierKey(circuitId: K): Promise<VerifierKey> {
    const cacheKey = this.generateCacheKey('verifierKey', circuitId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as VerifierKey;
    }

    const verifierKey = await this.fetchWithFallback(
      (p, id) => p.getVerifierKey(id),
      circuitId,
    );
    this.cache.set(cacheKey, verifierKey as VerifierKey);
    return verifierKey as VerifierKey;
  }

  async getZKIR(circuitId: K): Promise<ZKIR> {
    const cacheKey = this.generateCacheKey('zkir', circuitId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as ZKIR;
    }

    const zkir = await this.fetchWithFallback(
      (p, id) => p.getZKIR(id),
      circuitId,
    );
    this.cache.set(cacheKey, zkir as ZKIR);
    return zkir as ZKIR;
  }

  private async fetchWithFallback<T>(
    fn: (provider: FetchZkConfigProvider<string>, id: string) => Promise<T>,
    circuitId: K,
  ): Promise<T> {
    // Use a thin wrapper around `super` calls to avoid recursion
    const primary: FetchZkConfigProvider<string> = {
      getProverKey: (id: string) =>
        FetchZkConfigProvider.prototype.getProverKey.call(this, id),
      getVerifierKey: (id: string) =>
        FetchZkConfigProvider.prototype.getVerifierKey.call(this, id),
      getZKIR: (id: string) =>
        FetchZkConfigProvider.prototype.getZKIR.call(this, id),
    } as unknown as FetchZkConfigProvider<string>;
    try {
      return await fn(primary, circuitId);
    } catch (primaryError) {
      for (const fallback of this.fallbacks) {
        try {
          return await fn(fallback, circuitId);
        } catch {
          // try next fallback
        }
      }
      throw primaryError;
    }
  }
}
