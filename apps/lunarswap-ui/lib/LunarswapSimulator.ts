import {
  type CircuitContext,
  type ContractState,
  CostModel,
  createConstructorContext,
  dummyContractAddress,
  dummyUserAddress,
  emptyZswapLocalState,
  QueryContext,
} from '@midnight-ntwrk/compact-runtime';
import {
  Contract,
  type ContractAddress,
  type Either,
  ledger,
  type Pair,
  type QualifiedShieldedCoinInfo,
  type ShieldedCoinInfo,
  type ZswapCoinPublicKey,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/contract';
import {
  LunarswapPrivateState,
  LunarswapWitnesses,
} from '@openzeppelin/midnight-apps-contracts/dist/lunarswap/witnesses/Lunarswap';

/**
 * @description A simulator implementation for Lunarswap operations.
 * Used for local circuit computations when needed.
 */
export class LunarswapSimulator {
  private contract: Contract<LunarswapPrivateState>;
  private context: CircuitContext<LunarswapPrivateState>;
  private privateState: LunarswapPrivateState;

  constructor(
    name: string = 'Lunarswap',
    symbol: string = 'LUNAR',
    nonce: Uint8Array = new Uint8Array(32),
    decimals: bigint = BigInt(18),
  ) {
    this.privateState = LunarswapPrivateState.generate();
    const witnesses = LunarswapWitnesses();
    this.contract = new Contract<LunarswapPrivateState>(witnesses);

    // Initialize contract state
    const constructorCtx = createConstructorContext(
      this.privateState,
      dummyUserAddress(),
    );
    const initialState = this.contract.initialState(
      constructorCtx,
      name,
      symbol,
      nonce,
      decimals,
    );

    // Create circuit context
    const chargedState = (initialState.currentContractState as ContractState)
      .data;

    this.context = {
      currentPrivateState: initialState.currentPrivateState,
      currentZswapLocalState: emptyZswapLocalState(dummyUserAddress()),
      currentQueryContext: new QueryContext(
        chargedState,
        dummyContractAddress(),
      ),
      costModel: CostModel.initialCostModel(),
    };
  }

  public addLiquidity(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    _to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): void {
    const dummyUser = dummyUserAddress() as unknown as Either<
      ZswapCoinPublicKey,
      ContractAddress
    >;
    const result = this.contract.impureCircuits.addLiquidity(
      this.context,
      tokenA,
      tokenB,
      amountAMin,
      amountBMin,
      dummyUser,
    );
    this.context = result.context;
  }

  public removeLiquidity(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    liquidity: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
    _to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): void {
    const fakeTo = [] as unknown as Either<ZswapCoinPublicKey, ContractAddress>;
    const result = this.contract.impureCircuits.removeLiquidity(
      this.context,
      tokenA,
      tokenB,
      liquidity,
      amountAMin,
      amountBMin,
      fakeTo,
    );
    this.context = result.context;
  }

  public swapExactTokensForTokens(
    tokenIn: ShieldedCoinInfo,
    tokenOut: ShieldedCoinInfo,
    amountIn: bigint,
    amountOutMin: bigint,
    _to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): void {
    const fakeTo = [] as unknown as Either<ZswapCoinPublicKey, ContractAddress>;
    const result = this.contract.impureCircuits.swapExactTokensForTokens(
      this.context,
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMin,
      fakeTo,
    );
    this.context = result.context;
  }

  public swapTokensForExactTokens(
    tokenIn: ShieldedCoinInfo,
    tokenOut: ShieldedCoinInfo,
    amountOut: bigint,
    amountInMax: bigint,
    _to: Either<ZswapCoinPublicKey, ContractAddress>,
  ): void {
    const fakeTo = [] as unknown as Either<ZswapCoinPublicKey, ContractAddress>;
    const result = this.contract.impureCircuits.swapTokensForExactTokens(
      this.context,
      tokenIn,
      tokenOut,
      amountOut,
      amountInMax,
      fakeTo,
    );
    this.context = result.context;
  }

  public isPairExists(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): boolean {
    const result = this.contract.impureCircuits.isPairExists(
      this.context,
      tokenA,
      tokenB,
    );
    return result.result;
  }

  public getAllPairLength(): bigint {
    const result = this.contract.impureCircuits.getAllPairLength(this.context);
    return result.result;
  }

  public getPair(tokenA: ShieldedCoinInfo, tokenB: ShieldedCoinInfo): Pair {
    const result = this.contract.impureCircuits.getPair(
      this.context,
      tokenA,
      tokenB,
    );
    return result.result;
  }

  public getPairReserves(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): [QualifiedShieldedCoinInfo, QualifiedShieldedCoinInfo] {
    const result = this.contract.impureCircuits.getPairReserves(
      this.context,
      tokenA,
      tokenB,
    );
    return result.result;
  }

  public getPairId(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): Uint8Array {
    const result = this.contract.impureCircuits.getPairId(
      this.context,
      tokenA,
      tokenB,
    );
    return result.result;
  }

  public getReserveId(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): Uint8Array {
    const result = this.contract.circuits.getIdentity(
      this.context,
      tokenA,
      tokenB,
      false,
    );
    return result.result;
  }

  public getSortedCoins(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): [ShieldedCoinInfo, ShieldedCoinInfo] {
    const result = this.contract.impureCircuits.sortCoinByColor(
      this.context,
      tokenA,
      tokenB,
    );
    return result.result;
  }

  public getSortedCoinsAndAmounts(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    amountAMin: bigint,
    amountBMin: bigint,
  ): [ShieldedCoinInfo, ShieldedCoinInfo, bigint, bigint] {
    const result = this.contract.impureCircuits.sortCoinByColor(
      this.context,
      tokenA,
      tokenB,
    );
    const [sortedTokenA, sortedTokenB] = result.result;
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
    const result = this.contract.impureCircuits.getLpTokenTotalSupply(
      this.context,
      tokenA,
      tokenB,
    );
    return result.result;
  }
}
