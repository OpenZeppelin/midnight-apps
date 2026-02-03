import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import type {
  DivResultU256,
  U256,
} from '@src/artifacts/math/Index/contract/index.js';
import {
  Contract,
  ledger,
} from '@src/artifacts/math/test/Uint256.mock/contract/index.js';
import { Uint256PrivateState, Uint256Witnesses } from './witnesses/Uint256.js';

/**
 * Base simulator for Uint256 mock contract
 */
const Uint256SimulatorBase = createSimulator<
  Uint256PrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof Uint256Witnesses>,
  Contract<Uint256PrivateState>,
  readonly []
>({
  contractFactory: (witnesses) => new Contract<Uint256PrivateState>(witnesses),
  defaultPrivateState: () => Uint256PrivateState.generate(),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => Uint256Witnesses(),
});

/**
 * @description A simulator implementation for testing Uint256 math operations.
 */
export class Uint256Simulator extends Uint256SimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      Uint256PrivateState,
      ReturnType<typeof Uint256Witnesses>
    > = {},
  ) {
    super([], options);
  }

  public MODULUS(): bigint {
    return this.circuits.pure.MODULUS();
  }

  public MODULUS_U256(): U256 {
    return this.circuits.pure.MODULUS_U256();
  }

  public ZERO_U256(): U256 {
    return this.circuits.pure.ZERO_U256();
  }

  public fromU256(a: U256): bigint {
    return this.circuits.pure.fromU256(a);
  }

  public toU256(a: bigint): U256 {
    return this.circuits.pure.toU256(a);
  }

  public eq(a: U256, b: U256): boolean {
    return this.circuits.pure.eq(a, b);
  }

  public lt(a: U256, b: U256): boolean {
    return this.circuits.pure.lt(a, b);
  }

  public lte(a: U256, b: U256): boolean {
    return this.circuits.pure.lte(a, b);
  }

  public gt(a: U256, b: U256): boolean {
    return this.circuits.pure.gt(a, b);
  }

  public gte(a: U256, b: U256): boolean {
    return this.circuits.pure.gte(a, b);
  }

  public add(a: U256, b: U256): U256 {
    return this.circuits.pure.add(a, b);
  }

  public sub(a: U256, b: U256): U256 {
    return this.circuits.pure.sub(a, b);
  }

  public mul(a: U256, b: U256): U256 {
    return this.circuits.pure.mul(a, b);
  }

  public div(a: U256, b: U256): U256 {
    return this.circuits.pure.div(a, b);
  }

  public rem(a: U256, b: U256): U256 {
    return this.circuits.pure.rem(a, b);
  }

  public divRem(a: U256, b: U256): DivResultU256 {
    return this.circuits.pure.divRem(a, b);
  }

  public sqrt(radicand: U256): bigint {
    return this.circuits.pure.sqrt(radicand);
  }

  public min(a: U256, b: U256): U256 {
    return this.circuits.pure.min(a, b);
  }

  public max(a: U256, b: U256): U256 {
    return this.circuits.pure.max(a, b);
  }

  public isZero(a: U256): boolean {
    return this.circuits.pure.isZero(a);
  }

  public isExceedingFieldSize(a: U256): boolean {
    return this.circuits.pure.isExceedingFieldSize(a);
  }

  public isLowestLimbOnly(val: U256, limbValue: bigint): boolean {
    return this.circuits.pure.isLowestLimbOnly(val, limbValue);
  }

  public isSecondLimbOnly(val: U256, limbValue: bigint): boolean {
    return this.circuits.pure.isSecondLimbOnly(val, limbValue);
  }

  public isThirdLimbOnly(val: U256, limbValue: bigint): boolean {
    return this.circuits.pure.isThirdLimbOnly(val, limbValue);
  }

  public isHighestLimbOnly(val: U256, limbValue: bigint): boolean {
    return this.circuits.pure.isHighestLimbOnly(val, limbValue);
  }

  public isMultiple(value: U256, divisor: U256): boolean {
    return this.circuits.pure.isMultiple(value, divisor);
  }

  public MAX_UINT254(): U256 {
    return this.circuits.pure.MAX_UINT254();
  }

  public MAX_U256(): U256 {
    return this.circuits.pure.MAX_U256();
  }
}
