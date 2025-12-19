import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  Contract,
  type DivResultU256,
  type U256,
  ledger,
} from '../../../../artifacts/math/test/mocks/contracts/Uint256.mock/contract/index.js';
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
    return this.circuits.impure.MODULUS();
  }

  public MODULUS_U256(): U256 {
    return this.circuits.impure.MODULUS_U256();
  }

  public ZERO_U256(): U256 {
    return this.circuits.impure.ZERO_U256();
  }

  public toBytes(value: U256): Uint8Array {
    return this.circuits.impure.toBytes(value);
  }

  public eq(a: U256, b: U256): boolean {
    return this.circuits.impure.eq(a, b);
  }

  public lt(a: U256, b: U256): boolean {
    return this.circuits.impure.lt(a, b);
  }

  public lte(a: U256, b: U256): boolean {
    return this.circuits.impure.lte(a, b);
  }

  public gt(a: U256, b: U256): boolean {
    return this.circuits.impure.gt(a, b);
  }

  public gte(a: U256, b: U256): boolean {
    return this.circuits.impure.gte(a, b);
  }

  public add(a: U256, b: U256): U256 {
    return this.circuits.impure.add(a, b);
  }

  public sub(a: U256, b: U256): U256 {
    return this.circuits.impure.sub(a, b);
  }

  public mul(a: U256, b: U256): U256 {
    return this.circuits.impure.mul(a, b);
  }

  public div(a: U256, b: U256): U256 {
    return this.circuits.impure.div(a, b);
  }

  public rem(a: U256, b: U256): U256 {
    return this.circuits.impure.rem(a, b);
  }

  public divRem(a: U256, b: U256): DivResultU256 {
    return this.circuits.impure.divRem(a, b);
  }

  public sqrt(radicand: U256): bigint {
    return this.circuits.impure.sqrt(radicand);
  }

  public min(a: U256, b: U256): U256 {
    return this.circuits.impure.min(a, b);
  }

  public max(a: U256, b: U256): U256 {
    return this.circuits.impure.max(a, b);
  }

  public isZero(a: U256): boolean {
    return this.circuits.impure.isZero(a);
  }

  public isExceedingFieldSize(a: U256): boolean {
    return this.circuits.impure.isExceedingFieldSize(a);
  }

  public isLowestLimbOnly(val: U256, limbValue: bigint): boolean {
    return this.circuits.impure.isLowestLimbOnly(val, limbValue);
  }

  public isSecondLimbOnly(val: U256, limbValue: bigint): boolean {
    return this.circuits.impure.isSecondLimbOnly(val, limbValue);
  }

  public isThirdLimbOnly(val: U256, limbValue: bigint): boolean {
    return this.circuits.impure.isThirdLimbOnly(val, limbValue);
  }

  public isHighestLimbOnly(val: U256, limbValue: bigint): boolean {
    return this.circuits.impure.isHighestLimbOnly(val, limbValue);
  }

  public isMultiple(value: U256, divisor: U256): boolean {
    return this.circuits.impure.isMultiple(value, divisor);
  }

  public MAX_UINT254(): U256 {
    return this.circuits.impure.MAX_UINT254();
  }

  public MAX_U256(): U256 {
    return this.circuits.impure.MAX_U256();
  }
}
