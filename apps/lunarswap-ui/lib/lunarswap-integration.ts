import type { RawTokenType } from '@midnight-ntwrk/ledger-v7';
import {
  createShieldedCoinInfo,
  encodeShieldedCoinInfo,
} from '@midnight-ntwrk/ledger-v7';
import type { FinalizedCallTxData } from '@midnight-ntwrk/midnight-js-contracts';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  MidnightBech32m,
  ShieldedCoinPublicKey,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import type {
  Contract,
  ContractAddress,
  Either,
  Ledger,
  Pair,
  ShieldedCoinInfo,
  Witnesses,
  ZswapCoinPublicKey,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/contract';
import type { LunarswapPrivateState } from '@openzeppelin/midnight-apps-contracts/dist/lunarswap/witnesses/Lunarswap';
import {
  Lunarswap,
  type LunarswapProviders,
} from '@openzeppelin/midnight-apps-lunarswap-api';
import { Buffer } from 'buffer';
import type { Logger } from 'pino';
import { ensureLunarswapProofParams } from '../utils/proof-params';
import { LunarswapSimulator } from './LunarswapSimulator';
import type { ProviderCallbackAction, WalletAPI } from './wallet-context';

// Contract status types
export type ContractStatus =
  | 'not-configured' // No contract address configured
  | 'connecting' // Attempting to connect
  | 'connected' // Successfully connected
  | 'not-deployed' // Contract address configured but not found on network
  | 'error'; // Connection error

export interface ContractStatusInfo {
  status: ContractStatus;
  contractAddress?: string;
  error?: string;
  message?: string;
}

type LunarswapContract = Contract<
  LunarswapPrivateState,
  Witnesses<LunarswapPrivateState>
>;

// Contract interaction utilities
export class LunarswapIntegration {
  private providers: LunarswapProviders;
  private walletAPI: WalletAPI;
  private lunarswap: Lunarswap | null = null;
  private lunarswapSimulator: LunarswapSimulator;
  private poolData: Ledger | null = null;
  private _status: ContractStatus = 'not-configured';
  private _statusInfo: ContractStatusInfo = { status: 'not-configured' };
  private contractAddress?: string;
  private _logger?: Logger;
  constructor(
    providers: LunarswapProviders,
    walletAPI: WalletAPI,
    _callback: (action: ProviderCallbackAction) => void,
    contractAddress?: string,
    logger?: Logger,
  ) {
    this.providers = providers;
    this.walletAPI = walletAPI;
    this.contractAddress = contractAddress;
    this._logger = logger;
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
      this.lunarswap = await Lunarswap.join(this.providers, {
        bytes: new Uint8Array(Buffer.from(targetAddress, 'hex')),
      });

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
  async getPublicState(): Promise<Ledger | null> {
    if (!this.lunarswap) {
      throw new Error('Contract not initialized');
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

      // Handle the specific case where watchForDeployTxData is not available
      if (
        error instanceof Error &&
        error.message.includes('watchForDeployTxData is not available')
      ) {
        // Contract appears to be already deployed; returning empty pool data
        // Return empty pool data instead of throwing
        return null;
      }

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
      this._logger?.warn('Contract not ready for isPairExists operation');
      return false;
    }

    if (!this.poolData) {
      //await this.getPublicState();
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
      this._logger?.warn('Contract not ready for getPairReserves operation');
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
    if (!this.isReady) {
      this._logger?.warn('Contract not ready for getPairId operation');
      return new Uint8Array(32);
    }

    if (!this.poolData || !this.lunarswap) {
      return new Uint8Array(32);
    }

    const _tokenAInfo = LunarswapIntegration.toCoinInfo(tokenA, BigInt(0));
    const _tokenBInfo = LunarswapIntegration.toCoinInfo(tokenB, BigInt(0));

    // This method needs to be async now
    throw new Error(
      'getPairIdSync is deprecated - use getPairId from the Lunarswap API instead',
    );
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
    await this.ensureContractJoined();

    // Ensure proof parameters are downloaded before transaction
    await this.ensureProofParams();

    if (!this.lunarswap) {
      throw new Error('Contract not initialized');
    }

    const tokenInInfo = LunarswapIntegration.toCoinInfo(tokenIn, amountIn);
    const tokenOutInfo = LunarswapIntegration.toCoinInfo(tokenOut, BigInt(0));
    const recipientAddress = LunarswapIntegration.createRecipient(
      recipientCoinPublicKey,
    );

    // Use the Lunarswap API method
    return await this.lunarswap.swapExactTokensForTokens(
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
    await this.ensureContractJoined();

    // Ensure proof parameters are downloaded before transaction
    await this.ensureProofParams();

    if (!this.lunarswap) {
      throw new Error('Contract not initialized');
    }

    const tokenInInfo = LunarswapIntegration.toCoinInfo(tokenIn, BigInt(0));
    const tokenOutInfo = LunarswapIntegration.toCoinInfo(tokenOut, amountOut);
    const recipientAddress = LunarswapIntegration.createRecipient(
      recipientCoinPublicKey,
    );

    // Use the Lunarswap API method
    return await this.lunarswap.swapTokensForExactTokens(
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
    await this.ensureContractJoined();

    // Ensure proof parameters are downloaded before transaction
    await this.ensureProofParams();

    if (!this.lunarswap) {
      throw new Error('Contract not initialized');
    }

    const tokenAInfo = LunarswapIntegration.toCoinInfo(tokenA, amountA);
    const tokenBInfo = LunarswapIntegration.toCoinInfo(tokenB, amountB);
    const recipientAddress = LunarswapIntegration.createRecipient(
      recipientCoinPublicKey,
    );

    return await this.lunarswap.addLiquidity(
      tokenAInfo,
      tokenBInfo,
      minAmountA,
      minAmountB,
      recipientAddress,
    );
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
    await this.ensureContractJoined();

    // Ensure proof parameters are downloaded before transaction
    await this.ensureProofParams();

    if (!this.lunarswap) {
      throw new Error('Contract not initialized');
    }

    const token0Info = LunarswapIntegration.toCoinInfo(token0Type, BigInt(0));
    const token1Info = LunarswapIntegration.toCoinInfo(token1Type, BigInt(0));
    const liquidityInfo = LunarswapIntegration.toCoinInfo(
      liquidityType,
      BigInt(liquidityAmount),
    );
    const recipientAddress = LunarswapIntegration.createRecipient(
      recipientCoinPublicKey,
    );

    // Use the Lunarswap API method
    return await this.lunarswap.removeLiquidity(
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
    await this.ensureContractJoined();

    if (!this.lunarswap) {
      throw new Error('Contract not initialized');
    }

    const token0Info = LunarswapIntegration.toCoinInfo(token0Type, BigInt(0));
    const token1Info = LunarswapIntegration.toCoinInfo(token1Type, BigInt(0));

    // Use the Lunarswap API method
    const result = await this.lunarswap.getLpTokenTotalSupply(
      token0Info,
      token1Info,
    );
    return { value: result };
  }

  /**
   * Ensure proof parameters are downloaded before transactions
   */
  private async ensureProofParams(): Promise<void> {
    try {
      // Get the proof server URL from the wallet API
      const proofServerUrl =
        this.walletAPI?.configuration?.proverServerUri ||
        'http://localhost:6300';

      const result = await ensureLunarswapProofParams(proofServerUrl);

      if (!result.success) {
        this._logger?.warn(
          { errors: result.errors },
          '[LunarswapIntegration] Some proof parameters failed to download:',
        );
        // Don't throw here - let the transaction proceed and fail naturally if needed
      }
    } catch (error) {
      this._logger?.error(
        { error },
        `[LunarswapIntegration] Error ensuring proof parameters: ${error instanceof Error ? error.message : String(error)}`,
      );
      // Don't throw here - let the transaction proceed and fail naturally if needed
    }
  }

  /**
   * Ensure the contract is initialized
   */
  private async ensureContractJoined(): Promise<void> {
    if (!this.lunarswap) {
      const status = await this.joinContract();
      if (status.status !== 'connected') {
        throw new Error(`Contract not ready: ${status.message}`);
      }
    }
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
   * Create recipient address
   */
  static createRecipient(
    recipientCoinPublicKey: string,
  ): Either<ZswapCoinPublicKey, ContractAddress> {
    if (!recipientCoinPublicKey || recipientCoinPublicKey.length === 0) {
      console.error('[createRecipient] Empty recipient address provided');
      throw new Error('Recipient address cannot be empty');
    }

    const bech32mCoinPublicKey = MidnightBech32m.parse(recipientCoinPublicKey);
    const coinPublicKey = ShieldedCoinPublicKey.codec.decode(
      getNetworkId(),
      bech32mCoinPublicKey,
    );

    return {
      is_left: true,
      left: { bytes: coinPublicKey.data },
      right: { bytes: new Uint8Array(32) },
    };
  }
}

// Factory function to create contract integration
export const createContractIntegration = (
  providers: LunarswapProviders,
  walletAPI: WalletAPI,
  callback: (action: ProviderCallbackAction) => void,
  contractAddress?: string,
) => {
  return new LunarswapIntegration(
    providers,
    walletAPI,
    callback,
    contractAddress,
  );
};
