import type { RawTokenType } from '@midnight-ntwrk/ledger-v7';
import {
  createShieldedCoinInfo,
  encodeCoinPublicKey,
  encodeShieldedCoinInfo,
} from '@midnight-ntwrk/ledger-v7';
import type { FinalizedCallTxData } from '@midnight-ntwrk/midnight-js-contracts';
import type {
  LunarswapContract,
  ContractAddress,
  Either,
  LunarswapLedger,
  Pair,
  ShieldedCoinInfo,
  ZswapCoinPublicKey,
} from '@openzeppelin/midnight-apps-contracts';
import {
  Lunarswap,
  type LunarswapProviders,
} from '@openzeppelin/midnight-apps-lunarswap-api';
import { Buffer } from 'buffer';
import type { Logger } from 'pino';
import { serializeError } from '../utils/error-utils';
import { LunarswapSimulator } from './LunarswapSimulator';
import type { ProviderCallbackAction, WalletAPI } from './wallet-context';

// LunarswapContract status types
export type ContractStatus =
  | 'not-configured' // No contract address configured
  | 'connecting' // Attempting to connect
  | 'connected' // Successfully connected
  | 'not-deployed' // LunarswapContract address configured but not found on network
  | 'error'; // Connection error

export interface ContractStatusInfo {
  status: ContractStatus;
  contractAddress?: string;
  error?: string;
  message?: string;
}

// LunarswapContract interaction utilities
export class LunarswapIntegration {
  private providers: LunarswapProviders;
  private walletAPI: WalletAPI;
  private lunarswap: Lunarswap | null = null;
  private lunarswapSimulator: LunarswapSimulator;
  private poolData: LunarswapLedger | null = null;
  private _status: ContractStatus = 'not-configured';
  private _statusInfo: ContractStatusInfo = { status: 'not-configured' };
  private contractAddress?: string;
  private _logger?: Logger;
  private zkConfigPath: string;
  constructor(
    providers: LunarswapProviders,
    walletAPI: WalletAPI,
    _callback: (action: ProviderCallbackAction) => void,
    contractAddress?: string,
    logger?: Logger,
    zkConfigPath?: string,
  ) {
    this.providers = providers;
    this.walletAPI = walletAPI;
    this.contractAddress = contractAddress;
    this._logger = logger;
    this.zkConfigPath =
      zkConfigPath ??
      (typeof window !== 'undefined' ? `${window.location.origin}/zkir` : '');
    this.lunarswapSimulator = new LunarswapSimulator();
  }

  /**
   * Get current contract status
   */
  get status(): ContractStatus {
    return this._status;
  }

  /**
   * Get detailed status information
   */
  get statusInfo(): ContractStatusInfo {
    return this._statusInfo;
  }

  /**
   * Check if contract is ready for operations
   */
  get isReady(): boolean {
    return this._status === 'connected' && this.lunarswap !== null;
  }

  /**
   * Initialize contract connection
   */
  async joinContract(): Promise<ContractStatusInfo> {
    const targetAddress = this.contractAddress;

    if (!targetAddress) {
      this._status = 'not-configured';
      this._statusInfo = {
        status: 'not-configured',
        message: 'No contract address configured',
      };
      return this._statusInfo;
    }

    this._status = 'connecting';
    this._statusInfo = {
      status: 'connecting',
      contractAddress: targetAddress,
      message: 'Connecting to Lunarswap contract...',
    };

    try {
      // Step 1: Get the contract state operations to determine the correct verifier key order
      const currentContractState =
        await this.providers.publicDataProvider.queryContractState(
          targetAddress,
        );
      if (!currentContractState) {
        throw new Error(
          `No contract deployed at contract address '${targetAddress}'`,
        );
      }
      // Note: We're using a fixed order for lunarswap verifier keys instead of dynamic ordering

      // Step 3: Use the original join method
      this.lunarswap = await Lunarswap.join(
        this.providers,
        {
          bytes: new Uint8Array(Buffer.from(targetAddress, 'hex')),
        },
        this.zkConfigPath,
        this._logger,
      );

      this._status = 'connected';
      this._statusInfo = {
        status: 'connected',
        contractAddress: targetAddress,
        message: 'Successfully connected to Lunarswap contract',
      };

      await this.getPublicState();

      return this._statusInfo;
    } catch (error) {
      this._status = 'error';
      this._statusInfo = {
        status: 'error',
        contractAddress: targetAddress,
        error: error instanceof Error ? error.message : String(error),
        message: 'Failed to connect to Lunarswap contract',
      };

      throw error;
    }
  }

  /**
   * Fetch the public ledger pool data
   */
  async getPublicState(): Promise<LunarswapLedger | null> {
    if (!this.lunarswap) {
      throw new Error('LunarswapContract not initialized');
    }

    try {
      // Use the Lunarswap API to get public state
      this.poolData = await Lunarswap.getPublicState(
        this.providers,
        this.lunarswap.deployedContractAddressHex,
      );
      return this.poolData;
    } catch (error) {
      this._logger?.error(
        { error },
        `Failed to fetch pool data: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  /**
   * Get all available pairs in the pool
   */
  getAllPairs(): Array<{ pairId: string; pair: Pair }> {
    if (!this.poolData) {
      return [];
    }

    const pairs: Array<{ pairId: string; pair: Pair }> = [];

    // Iterate through the pool map
    for (const [pairId, pair] of this.poolData.pool) {
      pairs.push({
        pairId: Buffer.from(pairId).toString('hex'),
        pair,
      });
    }

    return pairs;
  }

  /**
   * Check if a pair exists for given tokens
   */
  async isPairExists(tokenA: string, tokenB: string): Promise<boolean> {
    if (!this.isReady) {
      this._logger?.warn('LunarswapContract not ready for isPairExists operation');
      return false;
    }

    if (!this.poolData || !this.lunarswap) {
      return false;
    }

    try {
      const tokenAInfo = LunarswapIntegration.toCoinInfo(tokenA, BigInt(0));
      const tokenBInfo = LunarswapIntegration.toCoinInfo(tokenB, BigInt(0));

      // Use the Lunarswap API method
      const pairIdentity = this.lunarswapSimulator.getPairId(
        tokenAInfo,
        tokenBInfo,
      );

      // Check if this pairId exists in the pool
      return this.poolData.pool.member(pairIdentity);
    } catch (error) {
      this._logger?.error(
        { error },
        `Failed to check pair existence: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Get pair reserves for given tokens
   */
  async getPairReserves(
    tokenA: RawTokenType,
    tokenB: RawTokenType,
  ): Promise<[bigint, bigint] | null> {
    if (!this.isReady) {
      this._logger?.warn('LunarswapContract not ready for getPairReserves operation');
      return null;
    }

    if (!this.poolData) {
      await this.getPublicState();
    }

    if (!this.poolData || !this.lunarswap) {
      return null;
    }

    try {
      const tokenAInfo = LunarswapIntegration.toCoinInfo(tokenA, BigInt(0));
      const tokenBInfo = LunarswapIntegration.toCoinInfo(tokenB, BigInt(0));

      // Use the Lunarswap API method
      const reserveAId = this.lunarswapSimulator.getReserveId(
        tokenAInfo,
        tokenBInfo,
      );
      const reserveBId = this.lunarswapSimulator.getReserveId(
        tokenBInfo,
        tokenAInfo,
      );
      const reserveA = this.poolData.reserves.lookup(reserveAId);
      const reserveB = this.poolData.reserves.lookup(reserveBId);
      return [reserveA.value, reserveB.value];
    } catch (error) {
      this._logger?.error(
        { error },
        `Failed to get pair reserves: ${error instanceof Error ? error.message : String(error)}`,
      );
      return null;
    }
  }

  async getPairId(
    tokenA: RawTokenType,
    tokenB: RawTokenType,
  ): Promise<Uint8Array> {
    if (!this.isReady || !this.lunarswap) {
      this._logger?.warn('LunarswapContract not ready for getPairId operation');
      return new Uint8Array(32);
    }

    const tokenAInfo = LunarswapIntegration.toCoinInfo(tokenA, BigInt(0));
    const tokenBInfo = LunarswapIntegration.toCoinInfo(tokenB, BigInt(0));
    return this.lunarswap.getPairId(tokenAInfo, tokenBInfo);
  }

  /**
   * Swap exact input tokens for output tokens
   */
  async swapExactTokensForTokens(
    tokenIn: string,
    tokenOut: string,
    amountIn: bigint,
    amountOutMin: bigint,
    recipientCoinPublicKey: string,
  ): Promise<
    FinalizedCallTxData<LunarswapContract, 'swapExactTokensForTokens'>
  > {
    const lunarswap = await this.ensureReady();

    const tokenInInfo = LunarswapIntegration.toCoinInfo(tokenIn, amountIn);
    const tokenOutInfo = LunarswapIntegration.toCoinInfo(tokenOut, BigInt(0));
    const recipientAddress = LunarswapIntegration.createRecipient(
      recipientCoinPublicKey,
    );

    return await lunarswap.swapExactTokensForTokens(
      tokenInInfo,
      tokenOutInfo,
      amountIn,
      amountOutMin,
      recipientAddress,
    );
  }

  /**
   * Swap tokens for exact output tokens
   */
  async swapTokensForExactTokens(
    tokenIn: string,
    tokenOut: string,
    amountOut: bigint,
    amountInMax: bigint,
    recipientCoinPublicKey: string,
  ): Promise<
    FinalizedCallTxData<LunarswapContract, 'swapTokensForExactTokens'>
  > {
    const lunarswap = await this.ensureReady();

    const tokenInInfo = LunarswapIntegration.toCoinInfo(tokenIn, BigInt(0));
    const tokenOutInfo = LunarswapIntegration.toCoinInfo(tokenOut, amountOut);
    const recipientAddress = LunarswapIntegration.createRecipient(
      recipientCoinPublicKey,
    );

    return await lunarswap.swapTokensForExactTokens(
      tokenInInfo,
      tokenOutInfo,
      amountOut,
      amountInMax,
      recipientAddress,
    );
  }

  /**
   * Add liquidity to a pool
   */
  async addLiquidity(
    tokenA: RawTokenType,
    tokenB: RawTokenType,
    amountA: bigint,
    amountB: bigint,
    minAmountA: bigint,
    minAmountB: bigint,
    recipientCoinPublicKey: string,
  ): Promise<FinalizedCallTxData<LunarswapContract, 'addLiquidity'>> {
    this._logger?.info(
      {
        tokenA: String(tokenA).slice(0, 16),
        tokenB: String(tokenB).slice(0, 16),
        amountA: amountA.toString(),
        amountB: amountB.toString(),
        minAmountA: minAmountA.toString(),
        minAmountB: minAmountB.toString(),
        recipientCoinPublicKeyLength: recipientCoinPublicKey?.length ?? 0,
        recipientCoinPublicKeyPreview: recipientCoinPublicKey
          ? `${String(recipientCoinPublicKey).slice(0, 12)}...${String(recipientCoinPublicKey).slice(-6)}`
          : '(empty)',
      },
      '[addLiquidity] called with args',
    );

    const lunarswap = await this.ensureReady();
    this._logger?.info('[addLiquidity] ensureReady done, building recipient');

    const tokenAInfo = LunarswapIntegration.toCoinInfo(tokenA, amountA);
    const tokenBInfo = LunarswapIntegration.toCoinInfo(tokenB, amountB);
    let recipientAddress: Either<ZswapCoinPublicKey, ContractAddress>;
    try {
      recipientAddress = LunarswapIntegration.createRecipient(
        recipientCoinPublicKey,
        this._logger,
      );
      this._logger?.info(
        {
          recipientBytesLength: recipientAddress.left?.bytes?.length ?? 0,
        },
        '[addLiquidity] createRecipient done',
      );
    } catch (recipientErr) {
      this._logger?.error(
        {
          error: recipientErr,
          message:
            recipientErr instanceof Error
              ? recipientErr.message
              : String(recipientErr),
          stack: recipientErr instanceof Error ? recipientErr.stack : undefined,
          recipientCoinPublicKeyLength: recipientCoinPublicKey?.length ?? 0,
        },
        '[addLiquidity] createRecipient failed',
      );
      throw recipientErr;
    }

    this._logger?.info('[addLiquidity] calling lunarswap.addLiquidity');
    try {
      const result = await lunarswap.addLiquidity(
        tokenAInfo,
        tokenBInfo,
        minAmountA,
        minAmountB,
        recipientAddress,
      );
      this._logger?.info('[addLiquidity] lunarswap.addLiquidity succeeded');
      return result;
    } catch (txErr) {
      const fullErrorText = serializeError(txErr);
      this._logger?.error(
        {
          error: txErr,
          fullError: fullErrorText,
          message: txErr instanceof Error ? txErr.message : String(txErr),
          stack: txErr instanceof Error ? txErr.stack : undefined,
        },
        '[addLiquidity] lunarswap.addLiquidity failed',
      );
      throw txErr;
    }
  }

  /**
   * Remove liquidity from a pool
   */
  async removeLiquidity(
    token0Type: RawTokenType,
    token1Type: RawTokenType,
    liquidityType: RawTokenType,
    liquidityAmount: string,
    minAmountA: bigint,
    minAmountB: bigint,
    recipientCoinPublicKey: string,
  ): Promise<FinalizedCallTxData<LunarswapContract, 'removeLiquidity'>> {
    const lunarswap = await this.ensureReady();

    const token0Info = LunarswapIntegration.toCoinInfo(token0Type, BigInt(0));
    const token1Info = LunarswapIntegration.toCoinInfo(token1Type, BigInt(0));
    const liquidityInfo = LunarswapIntegration.toCoinInfo(
      liquidityType,
      BigInt(liquidityAmount),
    );
    const recipientAddress = LunarswapIntegration.createRecipient(
      recipientCoinPublicKey,
    );

    return await lunarswap.removeLiquidity(
      token0Info,
      token1Info,
      liquidityInfo,
      minAmountA,
      minAmountB,
      recipientAddress,
    );
  }

  /**
   * Get LP token total supply for a pair
   */
  async getLpTokenTotalSupply(
    token0Type: RawTokenType,
    token1Type: RawTokenType,
  ): Promise<{ value: bigint }> {
    const lunarswap = await this.ensureReady();

    const token0Info = LunarswapIntegration.toCoinInfo(token0Type, BigInt(0));
    const token1Info = LunarswapIntegration.toCoinInfo(token1Type, BigInt(0));

    const result = await lunarswap.getLpTokenTotalSupply(
      token0Info,
      token1Info,
    );
    return { value: result };
  }

  /**
   * Ensure the contract is initialized
   */
  private async ensureContractJoined(): Promise<void> {
    if (!this.lunarswap) {
      const status = await this.joinContract();
      if (status.status !== 'connected') {
        throw new Error(`LunarswapContract not ready: ${status.message}`);
      }
    }
  }

  private async ensureReady(): Promise<Lunarswap> {
    await this.ensureContractJoined();
    if (!this.lunarswap) {
      throw new Error('LunarswapContract not initialized');
    }
    return this.lunarswap;
  }

  /**
   * Create ShieldedCoinInfo from token type and amount using midnight.js APIs
   * TokenType can be UnshieldedTokenType, ShieldedTokenType, or DustTokenType
   * Returns the encoded format expected by the contract
   */
  static toCoinInfo(type: RawTokenType, value: bigint): ShieldedCoinInfo {
    // Use the midnight.js API to create and encode ShieldedCoinInfo
    const ledgerCoinInfo = createShieldedCoinInfo(type, value);
    const encoded = encodeShieldedCoinInfo(ledgerCoinInfo);

    // Return in the format expected by the contract
    return {
      nonce: encoded.nonce,
      color: encoded.color,
      value: encoded.value,
    };
  }

  /**
   * Create recipient address from the wallet's coin public key.
   */
  static createRecipient(
    recipientCoinPublicKey: string,
    logger?: Logger,
  ): Either<ZswapCoinPublicKey, ContractAddress> {
    const raw = (recipientCoinPublicKey ?? '').trim();
    const log = (msg: string, data?: Record<string, unknown>) => {
      logger?.info(data ?? {}, `[createRecipient] ${msg}`);
    };

    log('input', {
      length: raw.length,
      preview:
        raw.length > 0
          ? `${raw.slice(0, 12)}...${raw.slice(-6)} (length ${raw.length})`
          : '(empty)',
    });

    if (!raw || raw.length === 0) {
      logger?.error({}, '[createRecipient] recipient address is empty');
      throw new Error('Recipient address cannot be empty');
    }

    try {
      log('calling encodeCoinPublicKey');
      const bytes = encodeCoinPublicKey(recipientCoinPublicKey);
      log('encodeCoinPublicKey done', { bytesLength: bytes?.length ?? 0 });

      return {
        is_left: true,
        left: { bytes },
        right: { bytes: new Uint8Array(32) },
      };
    } catch (err) {
      logger?.error(
        {
          error: err,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined,
          inputLength: raw.length,
        },
        '[createRecipient] encodeCoinPublicKey failed',
      );
      throw err;
    }
  }
}

// Factory function to create contract integration
export const createContractIntegration = (
  providers: LunarswapProviders,
  walletAPI: WalletAPI,
  callback: (action: ProviderCallbackAction) => void,
  contractAddress?: string,
  logger?: Logger,
  zkConfigPath?: string,
) => {
  return new LunarswapIntegration(
    providers,
    walletAPI,
    callback,
    contractAddress,
    logger,
    zkConfigPath,
  );
};
