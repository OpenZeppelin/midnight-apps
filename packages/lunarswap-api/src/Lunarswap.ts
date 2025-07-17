import type {
  CoinInfo,
  ContractAddress,
  Either,
  ZswapCoinPublicKey,
} from '@midnight-dapps/compact-std';
import {
  Contract,
  ledger,
  LunarswapWitnesses,
  LunarswapPrivateState,
  type Ledger,
} from '@midnight-dapps/lunarswap-v1';
// TODO: Question: Why is ContractAddress exported differently in compact-std and compact-runtime?
// TODO: Question: why is also the coinInfo type are different?
import type { ContractAddress as ContractAddressRuntime, ContractState } from '@midnight-ntwrk/compact-runtime';
import type { ZswapChainState } from '@midnight-ntwrk/ledger';
import { combineLatest, from, map, tap, type Observable } from 'rxjs';
import type { Logger } from 'pino';
import {
  type DeployedLunarswapContract,
  type LunarswapContract,
  type LunarswapProviders,
  type LunarswapPublicState,
  LunarswapPrivateStateId,
} from './types';
import {
  deployContract,
  findDeployedContract,
} from '@midnight-ntwrk/midnight-js-contracts';

const lunarswapContractInstance = new Contract(LunarswapWitnesses());

export interface ILunarswap {
  deployedContractAddressHex: string;
  state$: Observable<LunarswapPublicState>;
  addLiquidity(
    tokenA: CoinInfo,
    tokenB: CoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<void>;
  removeLiquidity(
    tokenA: CoinInfo,
    tokenB: CoinInfo,
    liquidity: CoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<void>;
  swapExactTokensForTokens(
    tokenIn: CoinInfo,
    tokenOut: CoinInfo,
    amountIn: bigint,
    amountOutMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<void>;
  swapTokensForExactTokens(
    tokenIn: CoinInfo,
    tokenOut: CoinInfo,
    amountIn: bigint,
    amountOutMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<void>;
}

export class Lunarswap implements ILunarswap {
  public deployedContractAddressHex: string;
  public state$: Observable<LunarswapPublicState>;

  // Constructor arguments as constants
  public static readonly LP_TOKEN_NAME = 'Lunarswap LP';
  public static readonly LP_TOKEN_SYMBOL = 'LP';
  public static readonly LP_TOKEN_DECIMALS = BigInt(18);  

  private constructor(
    public readonly deployedContract: DeployedLunarswapContract,
    providers: LunarswapProviders,
    public lpTokenNonce: Uint8Array,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddressHex = deployedContract.deployTxData.public.contractAddress;
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
    const lunarswapContractInstance: LunarswapContract = new Contract(LunarswapWitnesses());

    const deployedContract = await deployContract<LunarswapContract>(
      providers,
      {
        contract: lunarswapContractInstance,
        privateStateId: LunarswapPrivateStateId,
        initialPrivateState: await Lunarswap.getPrivateState(providers),
        args: [
          Lunarswap.LP_TOKEN_NAME,      // lpTokenName
          Lunarswap.LP_TOKEN_SYMBOL,    // lpTokenSymbol
          lpTokenNonce,     // lpTokenNonce (32 bytes)
          Lunarswap.LP_TOKEN_DECIMALS,  // lpTokenDecimals
        ],
      },
    );

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
    const contractAddressHex = Buffer.from(contractAddress.bytes).toString('hex');

    const deployedContract = await findDeployedContract(providers, {
      contractAddress: contractAddressHex,
      contract: lunarswapContractInstance as LunarswapContract,
      privateStateId: 'lunarswapPrivateState',
      initialPrivateState: await Lunarswap.getPrivateState(providers),
    });
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
    contractAddress: ContractAddressRuntime
  ): Promise<Ledger | null> {
    const contractState = await providers.publicDataProvider.queryContractState(contractAddress);
    return contractState ? ledger(contractState.data) : null;
  }

  static async getZswapChainState(
    providers: LunarswapProviders,
    contractAddress: ContractAddressRuntime
  ): Promise<ZswapChainState | null> {
    // TODO: Question: Why not just use queryContractState for zswap?
    const result = await providers.publicDataProvider.queryZSwapAndContractState(contractAddress);
    return result ? result[0] : null;
  }

  static async getDeployedContractState(
    providers: LunarswapProviders,
    contractAddress: ContractAddressRuntime
  ): Promise<ContractState | null> {
    const deployedContract = await providers.publicDataProvider.queryDeployContractState(contractAddress);
    return deployedContract ?? null;
  }

  private static async getPrivateState(
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
    tokenA: CoinInfo,
    tokenB: CoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<void> {
    const txData = await this.deployedContract.callTx.addLiquidity(
      tokenA,
      tokenB,
      amountAMin,
      amountBMin,
      to,
    );
    
    this.logger?.trace({
      transactionAdded: {
        circuit: 'addLiquidity',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });

    return;
  }

  async removeLiquidity(
    tokenA: CoinInfo,
    tokenB: CoinInfo,
    liquidity: CoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<void> {
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

    return;
  }

  async swapExactTokensForTokens(
    tokenIn: CoinInfo,
    tokenOut: CoinInfo,
    amountIn: bigint,
    amountOutMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<void> {
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

    return;
  }

  async swapTokensForExactTokens(
    tokenIn: CoinInfo,
    tokenOut: CoinInfo,
    amountOut: bigint,
    amountInMax: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): Promise<void> { 
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

    return;
  }
}
