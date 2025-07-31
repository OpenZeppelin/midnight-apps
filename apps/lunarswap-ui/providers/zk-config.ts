import type {
  ProverKey,
  VerifierKey,
  ZKIR,
} from '@midnight-ntwrk/midnight-js-types';
import { fetch } from 'cross-fetch';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';

type CacheKey =
  | `proverKey:${string}`
  | `verifierKey:${string}`
  | `zkir:${string}`;

export class ZkConfigProviderWrapper<
  K extends string,
> extends FetchZkConfigProvider<K> {
  private readonly cache: Map<CacheKey, ProverKey | VerifierKey | ZKIR>;

  constructor(
    baseURL: string,
    fetchFunc: typeof fetch = fetch,
    private readonly callback: (
      action: 'downloadProverStarted' | 'downloadProverDone',
    ) => void,
  ) {
    super(baseURL, fetchFunc);
    this.cache = new Map();
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

      const proverKey = await super.getProverKey(circuitId);
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

    const verifierKey = await super.getVerifierKey(circuitId);
    this.cache.set(cacheKey, verifierKey);
    return verifierKey;
  }

  async getVerifierKeys(circuitIds: K[]): Promise<[K, VerifierKey][]> {
    // For lunarswap, use the correct order that matches the deployed contract
    const lunarswapCircuitOrder = [
      'swapTokensForExactTokens',
      'getPairReserves',
      'addLiquidity',
      'getLpTokenSymbol',
      'getLpTokenName',
      'getLpTokenType',
      'getLpTokenTotalSupply',
      'getAllPairLength',
      'getPairIdentity',
      'isPairExists',
      'removeLiquidity',
      'getPair',
      'getLpTokenDecimals',
      'swapExactTokensForTokens',
    ] as K[];

    // If this is a lunarswap contract (has all the expected circuits), use the correct order
    const isLunarswap = lunarswapCircuitOrder.every((id) =>
      circuitIds.includes(id),
    );

    if (isLunarswap) {
      console.log(
        '[ZkConfigProviderWrapper] Using lunarswap circuit order for verifier keys',
      );
      const orderedCircuitIds = lunarswapCircuitOrder.filter((id) =>
        circuitIds.includes(id),
      );
      const verifierKeys = await Promise.all(
        orderedCircuitIds.map(async (circuitId) => {
          const verifierKey = await this.getVerifierKey(circuitId);
          return [circuitId, verifierKey] as [K, VerifierKey];
        }),
      );
      return verifierKeys;
    }

    // For other contracts, use the original order
    const verifierKeys = await Promise.all(
      circuitIds.map(async (circuitId) => {
        const verifierKey = await this.getVerifierKey(circuitId);
        return [circuitId, verifierKey] as [K, VerifierKey];
      }),
    );
    return verifierKeys;
  }

  async getZKIR(circuitId: K): Promise<ZKIR> {
    const cacheKey = this.generateCacheKey('zkir', circuitId);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as ZKIR;
    }

    const zkir = await super.getZKIR(circuitId);
    this.cache.set(cacheKey, zkir);
    return zkir;
  }
}
