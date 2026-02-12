import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  Contract,
  type ContractAddress,
  type Either,
  ledger,
  type Pair,
  type QualifiedShieldedCoinInfo,
  type ShieldedCoinInfo,
  type ZswapCoinPublicKey,
} from '@src/artifacts/lunarswap/Lunarswap/contract/index.js';
import {
  LunarswapPrivateState,
  LunarswapWitnesses,
} from '../../witnesses/Lunarswap.js';

/**
 * Base simulator for Lunarswap contract
 */
const LunarswapSimulatorBase = createSimulator<
  LunarswapPrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof LunarswapWitnesses>,
  Contract<LunarswapPrivateState>,
  readonly [string, string, Uint8Array, bigint]
>({
  contractFactory: (witnesses) =>
    new Contract<LunarswapPrivateState>(witnesses),
  defaultPrivateState: () => LunarswapPrivateState.generate(),
  contractArgs: (name, symbol, nonce, decimals) => [
    name,
    symbol,
    nonce,
    decimals,
  ],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => LunarswapWitnesses(),
});

/**
 * @description A simulator implementation for testing Lunarswap operations.
 */
export class LunarswapSimulator extends LunarswapSimulatorBase {
  constructor(
    name: string,
    symbol: string,
    nonce: Uint8Array,
    decimals: bigint,
    options: BaseSimulatorOptions<
      LunarswapPrivateState,
      ReturnType<typeof LunarswapWitnesses>
    > = {},
  ) {
    super([name, symbol, nonce, decimals], options);
  }

  public addLiquidity(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): void {
    this.circuits.impure.addLiquidity(
      tokenA,
      tokenB,
      amountAMin,
      amountBMin,
      to,
    );
  }

  public removeLiquidity(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    liquidity: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): void {
    this.circuits.impure.removeLiquidity(
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      to,
    );
  }

  public swapExactTokensForTokens(
    tokenIn: ShieldedCoinInfo,
    tokenOut: ShieldedCoinInfo,
    amountIn: bigint,
    amountOutMin: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): void {
    this.circuits.impure.swapExactTokensForTokens(
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMin,
      to,
    );
  }

  public swapTokensForExactTokens(
    tokenIn: ShieldedCoinInfo,
    tokenOut: ShieldedCoinInfo,
    amountOut: bigint,
    amountInMax: bigint,
    to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): void {
    this.circuits.impure.swapTokensForExactTokens(
      tokenIn,
      tokenOut,
      amountOut,
      amountInMax,
      to,
    );
  }

  public isPairExists(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): boolean {
    return this.circuits.impure.isPairExists(tokenA, tokenB);
  }

  public getAllPairLength(): bigint {
    return this.circuits.impure.getAllPairLength();
  }

  public getPair(tokenA: ShieldedCoinInfo, tokenB: ShieldedCoinInfo): Pair {
    return this.circuits.impure.getPair(tokenA, tokenB);
  }

  public getPairReserves(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): [QualifiedShieldedCoinInfo, QualifiedShieldedCoinInfo] {
    return this.circuits.impure.getPairReserves(tokenA, tokenB);
  }

  public getPairId(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): Uint8Array {
    return this.circuits.impure.getPairId(tokenA, tokenB);
  }

  public getReserveId(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): Uint8Array {
    return this.circuits.pure.getIdentity(tokenA, tokenB, false);
  }

  public getSortedCoins(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): [ShieldedCoinInfo, ShieldedCoinInfo] {
    return this.circuits.impure.sortCoinByColor(tokenA, tokenB);
  }

  public getSortedCoinsAndAmounts(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
  ): [ShieldedCoinInfo, ShieldedCoinInfo, bigint, bigint] {
    const [sortedTokenA, sortedTokenB] = this.circuits.impure.sortCoinByColor(
      tokenA,
      tokenB,
    );
    const amount0Min =
      sortedTokenA.color === tokenA.color ? amountAMin : amountBMin;
    const amount1Min =
      sortedTokenA.color === tokenA.color ? amountBMin : amountAMin;
    return [sortedTokenA, sortedTokenB, amount0Min, amount1Min];
  }

  public getLpTokenTotalSupply(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): bigint {
    return this.circuits.impure.getLpTokenTotalSupply(tokenA, tokenB);
  }
}
