// TODO: Question: Why is ContractAddress exported differently in compact-std and compact-runtime?
// TODO: Question: why is also the coinInfo type are different?
import type {
  ContractAddress as ContractAddressRuntime,
  ContractState,
} from '@midnight-ntwrk/compact-runtime';
import type { ZswapChainState } from '@midnight-ntwrk/ledger-v7';
import {
  type FinalizedCallTxData,
  deployContract,
  findDeployedContract,
} from '@midnight-ntwrk/midnight-js-contracts';
import type {
  ShieldedCoinInfo,
  ContractAddress,
  Either,
  QualifiedShieldedCoinInfo,
  ZswapCoinPublicKey,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/contract';
import {
  Contract,
  type Ledger,
  type Pair,
  ledger,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/contract';
import {
  LunarswapPrivateState,
  LunarswapWitnesses,
} from '@openzeppelin/midnight-apps-contracts/dist/lunarswap/witnesses/Lunarswap';
import type { Logger } from 'pino';
import { type Observable, combineLatest, from, map, tap } from 'rxjs';
import {
  type DeployedLunarswapContract,
  type LunarswapContract,
  LunarswapPrivateStateId,
  type LunarswapProviders,
  type LunarswapPublicState,
} from './types';

const lunarswapContractInstance: LunarswapContract = new Contract(
  LunarswapWitnesses(),
);

export interface ILunarswap {
  deployedContractAddressHex: string;
  state$: Observable<LunarswapPublicState>;
  addLiquidity(
    tokenA:  ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<FinalizedCallTxData<LunarswapContract, 'addLiquidity'>>;
  removeLiquidity(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    liquidity: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<FinalizedCallTxData<LunarswapContract, 'removeLiquidity'>>;
  swapExactTokensForTokens(
    tokenIn: ShieldedCoinInfo,
    tokenOut: ShieldedCoinInfo,
    amountIn: bigint,
    amountOutMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<
    FinalizedCallTxData<LunarswapContract, 'swapExactTokensForTokens'>
  >;
  swapTokensForExactTokens(
    tokenIn: ShieldedCoinInfo,
    tokenOut: ShieldedCoinInfo,
    amountIn: bigint,
    amountOutMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<
    FinalizedCallTxData<LunarswapContract, 'swapTokensForExactTokens'>
  >;
  isPairExists(tokenA: ShieldedCoinInfo, tokenB: ShieldedCoinInfo): Promise<boolean>;
  getAllPairLength(): Promise<bigint>;
  getPair(tokenA: ShieldedCoinInfo, tokenB: ShieldedCoinInfo): Promise<Pair>;
  getPairReserves(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): Promise<[QualifiedShieldedCoinInfo, QualifiedShieldedCoinInfo]>;
  getPairId(tokenA: ShieldedCoinInfo, tokenB: ShieldedCoinInfo): Promise<Uint8Array>;
  getLpTokenTotalSupply(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): Promise<bigint>;
}

export class Lunarswap implements ILunarswap {
  public deployedContractAddressHex: string;
  public state$: Observable<LunarswapPublicState>;

  // Constructor arguments as constants
  public static readonly LP_TOKEN_NAME = 'Test Lunar';
  public static readonly LP_TOKEN_SYMBOL = 'TLUNAR';
  public static readonly LP_TOKEN_DECIMALS = BigInt(6);

  private constructor(
    public readonly deployedContract: DeployedLunarswapContract,
    providers: LunarswapProviders,
    public lpTokenNonce: Uint8Array,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddressHex =
      deployedContract.deployTxData.public.contractAddress;
    this.state$ = combineLatest(
      [
        // Combine public (ledger) state with...
        providers.publicDataProvider
          .contractStateObservable(this.deployedContractAddressHex, {
            type: 'latest',
          })
          .pipe(
            map((contractState) => ledger(contractState.data)),
            tap((ledgerState) =>
              logger?.trace({
                ledgerState: {
                  ...ledgerState,
                  pool: ledgerState.pool,
                },
              }),
            ),
          ),
        from(providers.privateStateProvider.get('lunarswapPrivateState')).pipe(
          map((privateStates) => privateStates?.lunarswapPrivateState),
        ),
      ],
      (ledgerState, privateState) => {
        return {
          pool: ledgerState.pool,
          privateState: privateState,
        };
      },
    );
  }

  static async deploy(
    providers: LunarswapProviders,
    lpTokenNonce: Uint8Array,
    logger?: Logger,
  ): Promise<Lunarswap> {
    logger?.info('Deploying Lunarswap contract...');

    // Create a fresh contract instance for each deployment
    const lunarswapContractInstance: LunarswapContract = new Contract(
      LunarswapWitnesses(),
    );

    const deployedContract = (await deployContract(
      providers,
      {
        privateStateId: LunarswapPrivateStateId,
        initialPrivateState: await Lunarswap.getPrivateState(providers),
        args: [
          Lunarswap.LP_TOKEN_NAME, // lpTokenName
          Lunarswap.LP_TOKEN_SYMBOL, // lpTokenSymbol
          lpTokenNonce, // lpTokenNonce (32 bytes)
          Lunarswap.LP_TOKEN_DECIMALS, // lpTokenDecimals
        ],
        contract: lunarswapContractInstance,
      } as any,
    )) as unknown as DeployedLunarswapContract;

    logger?.info('Lunarswap contract deployed');
    return new Lunarswap(deployedContract, providers, lpTokenNonce, logger);
  }

  static async join(
    providers: LunarswapProviders,
    contractAddress: ContractAddress,
    logger?: Logger,
  ): Promise<Lunarswap> {
    logger?.info('Joining Lunarswap contract...');

    // Convert contractAddress.bytes (Uint8Array) to hex string for findDeployedContract
    const contractAddressHex = Buffer.from(contractAddress.bytes).toString(
      'hex',
    );

    await providers.privateStateProvider.set(
      'lunarswapPrivateState',
      LunarswapPrivateState.generate(),
    );

    const deployedContract = (await findDeployedContract(providers, {
      contractAddress: contractAddressHex,
      privateStateId: 'lunarswapPrivateState',
      initialPrivateState: await Lunarswap.getPrivateState(providers),
      contract: lunarswapContractInstance,
    } as any)) as unknown as DeployedLunarswapContract;
    logger?.info('Lunarswap contract joined');
    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedContract.deployTxData.public,
      },
    });

    // TODO: get lpTokenNonce from the contract
    const lpTokenNonce = crypto.getRandomValues(new Uint8Array(32));

    return new Lunarswap(deployedContract, providers, lpTokenNonce, logger);
  }

  static async getPublicState(
    providers: LunarswapProviders,
    contractAddress: ContractAddressRuntime,
  ): Promise<Ledger | null> {
    const contractState =
      await providers.publicDataProvider.queryContractState(contractAddress);
    return contractState ? ledger(contractState.data) : null;
  }

  static async getZswapChainState(
    providers: LunarswapProviders,
    contractAddress: ContractAddressRuntime,
  ): Promise<ZswapChainState | null> {
    // TODO: Question: Why not just use queryContractState for zswap?
    const result =
      await providers.publicDataProvider.queryZSwapAndContractState(
        contractAddress,
      );
    return result ? result[0] : null;
  }

  static async getDeployedContractState(
    providers: LunarswapProviders,
    contractAddress: ContractAddressRuntime,
  ): Promise<ContractState | null> {
    const deployedContract =
      await providers.publicDataProvider.queryDeployContractState(
        contractAddress,
      );
    return deployedContract ?? null;
  }

  static async getPrivateState(
    providers: LunarswapProviders,
  ): Promise<LunarswapPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(
      'lunarswapPrivateState',
    );
    return (
      existingPrivateState?.lunarswapPrivateState ??
      LunarswapPrivateState.generate()
    );
  }

  async addLiquidity(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<FinalizedCallTxData<LunarswapContract, 'addLiquidity'>> {
    this.logger?.trace({
      addLiquidityParams: {
        tokenA,
        tokenB,
        amountAMin,
        amountBMin,
        to,
      },
    });

    const txData = await this.deployedContract.callTx.addLiquidity(
      tokenA,
      tokenB,
      amountAMin,
      amountBMin,
      to,
    );

    this.logger?.trace({ addLiquidityTx: txData.public });

    this.logger?.trace({
      transactionAdded: {
        circuit: 'addLiquidity',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    return txData;
  }

  async removeLiquidity(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    liquidity: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<FinalizedCallTxData<LunarswapContract, 'removeLiquidity'>> {
    const txData = await this.deployedContract.callTx.removeLiquidity(
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      to,
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: 'removeLiquidity',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    return txData;
  }

  async swapExactTokensForTokens(
    tokenIn: ShieldedCoinInfo,
    tokenOut: ShieldedCoinInfo,
    amountIn: bigint,
    amountOutMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<
    FinalizedCallTxData<LunarswapContract, 'swapExactTokensForTokens'>
  > {
    const txData = await this.deployedContract.callTx.swapExactTokensForTokens(
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMin,
      to,
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: 'swapExactTokensForTokens',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    return txData;
  }

  async swapTokensForExactTokens(
    tokenIn: ShieldedCoinInfo,
    tokenOut: ShieldedCoinInfo,
    amountOut: bigint,
    amountInMax: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<
    FinalizedCallTxData<LunarswapContract, 'swapTokensForExactTokens'>
  > {
    const txData = await this.deployedContract.callTx.swapTokensForExactTokens(
      tokenIn,
      tokenOut,
      amountOut,
      amountInMax,
      to,
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: 'swapTokensForExactTokens',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    return txData;
  }

  async isPairExists(tokenA: ShieldedCoinInfo, tokenB: ShieldedCoinInfo): Promise<boolean> {
    const txData = await this.deployedContract.callTx.isPairExists(
      tokenA,
      tokenB,
    );
    return txData.private.result;
  }

  async getAllPairLength(): Promise<bigint> {
    const txData = await this.deployedContract.callTx.getAllPairLength();
    return txData.private.result;
  }

  async getPair(tokenA: ShieldedCoinInfo, tokenB: ShieldedCoinInfo): Promise<Pair> {
    const txData = await this.deployedContract.callTx.getPair(tokenA, tokenB);
    return txData.private.result;
  }

  async getPairReserves(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): Promise<[QualifiedShieldedCoinInfo, QualifiedShieldedCoinInfo]> {
    const txData = await this.deployedContract.callTx.getPairReserves(
      tokenA,
      tokenB,
    );
    return txData.private.result;
  }

  async getPairId(tokenA: ShieldedCoinInfo, tokenB: ShieldedCoinInfo): Promise<Uint8Array> {
    const txData = await this.deployedContract.callTx.getPairId(tokenA, tokenB);
    return txData.private.result;
  }

  async getLpTokenTotalSupply(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): Promise<bigint> {
    const txData = await this.deployedContract.callTx.getLpTokenTotalSupply(
      tokenA,
      tokenB,
    );
    return txData.private.result;
  }
}
