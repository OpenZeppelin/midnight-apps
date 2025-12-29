import type {
  QualifiedShieldedCoinInfo,
  ShieldedCoinInfo,
  SplitCoinResult,
} from '@artifacts/lunarswap/test/mocks/contracts/LunarswapLibrary.mock/contract/index.js';
import {
  Contract,
  ledger,
} from '@artifacts/lunarswap/test/mocks/contracts/LunarswapLibrary.mock/contract/index.js';
import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  LunarswapLibraryPrivateState,
  LunarswapLibraryWitnesses,
} from './witnesses/LunarswapLibrary.js';

/**
 * Base simulator for LunarswapLibrary mock contract
 */
const LunarswapLibrarySimulatorBase = createSimulator<
  LunarswapLibraryPrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof LunarswapLibraryWitnesses>,
  Contract<LunarswapLibraryPrivateState>,
  readonly []
>({
  contractFactory: (witnesses) =>
    new Contract<LunarswapLibraryPrivateState>(witnesses),
  defaultPrivateState: () => LunarswapLibraryPrivateState.generate(),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => LunarswapLibraryWitnesses(),
});

/**
 * @description A simulator implementation for testing LunarswapLibrary operations.
 */
export class LunarswapLibrarySimulator extends LunarswapLibrarySimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      LunarswapLibraryPrivateState,
      ReturnType<typeof LunarswapLibraryWitnesses>
    > = {},
  ) {
    super([], options);
  }

  // Split operations
  public splitCoin(
    coin: ShieldedCoinInfo,
    amount: bigint,
  ): SplitCoinResult<ShieldedCoinInfo> {
    return this.circuits.impure.splitCoin(coin, amount);
  }

  public splitQualifiedCoin(
    coin: QualifiedShieldedCoinInfo,
    amount: bigint,
  ): SplitCoinResult<QualifiedShieldedCoinInfo> {
    return this.circuits.impure.splitQualifiedCoin(coin, amount);
  }

  // Sort operations
  public sortCoinsAsc(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
  ): [ShieldedCoinInfo, ShieldedCoinInfo] {
    return this.circuits.impure.sortCoinsAsc(tokenA, tokenB);
  }

  public sortQualifiedCoinsAsc(
    tokenA: QualifiedShieldedCoinInfo,
    tokenB: QualifiedShieldedCoinInfo,
  ): [QualifiedShieldedCoinInfo, QualifiedShieldedCoinInfo] {
    return this.circuits.impure.sortQualifiedCoinsAsc(tokenA, tokenB);
  }

  public sortCoinsAndAmountsAsc(
    tokenA: ShieldedCoinInfo,
    tokenB: ShieldedCoinInfo,
    amountA: bigint,
    amountB: bigint,
  ): [ShieldedCoinInfo, ShieldedCoinInfo, bigint, bigint] {
    return this.circuits.impure.sortCoinsAndAmountsAsc(
      tokenA,
      tokenB,
      amountA,
      amountB,
    );
  }

  // Value manipulation operations
  public addCoinValue(
    coin: ShieldedCoinInfo,
    amount: bigint,
  ): ShieldedCoinInfo {
    return this.circuits.impure.addCoinValue(coin, amount);
  }

  public addQualifiedCoinValue(
    coin: QualifiedShieldedCoinInfo,
    amount: bigint,
  ): QualifiedShieldedCoinInfo {
    return this.circuits.impure.addQualifiedCoinValue(coin, amount);
  }

  public subCoinValue(
    coin: ShieldedCoinInfo,
    amount: bigint,
  ): ShieldedCoinInfo {
    return this.circuits.impure.subCoinValue(coin, amount);
  }

  public subQualifiedCoinValue(
    coin: QualifiedShieldedCoinInfo,
    amount: bigint,
  ): QualifiedShieldedCoinInfo {
    return this.circuits.impure.subQualifiedCoinValue(coin, amount);
  }

  // ID generation
  public getPairId(type0: Uint8Array, type1: Uint8Array): Uint8Array {
    return this.circuits.impure.getPairId(type0, type1);
  }

  public getReserveId(type0: Uint8Array, type1: Uint8Array): Uint8Array {
    return this.circuits.impure.getReserveId(type0, type1);
  }

  // Price/quote operations
  public quote(amount0: bigint, reserve0: bigint, reserve1: bigint): bigint {
    return this.circuits.impure.quote(amount0, reserve0, reserve1);
  }

  public getAmountOut(
    amountIn: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
  ): bigint {
    return this.circuits.impure.getAmountOut(amountIn, reserveIn, reserveOut);
  }

  public getAmountIn(
    amountOut: bigint,
    reserveIn: bigint,
    reserveOut: bigint,
  ): bigint {
    return this.circuits.impure.getAmountIn(amountOut, reserveIn, reserveOut);
  }

  // Type conversion
  public upcastCoinInfo(coin: ShieldedCoinInfo): QualifiedShieldedCoinInfo {
    return this.circuits.impure.upcastCoinInfo(coin);
  }

  public downcastCoinInfo(coin: QualifiedShieldedCoinInfo): ShieldedCoinInfo {
    return this.circuits.impure.downcastCoinInfo(coin);
  }
}
