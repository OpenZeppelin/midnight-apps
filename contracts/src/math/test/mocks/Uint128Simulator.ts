import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import type {
  DivResultU128,
  U128,
  U256,
} from '@src/artifacts/math/test/mocks/contracts/Uint128.mock/contract/index.js';
import {
  Contract,
  ledger,
} from '@src/artifacts/math/test/mocks/contracts/Uint128.mock/contract/index.js';
import { Uint128PrivateState, Uint128Witnesses } from './witnesses/Uint128.js';

/**
 * Base simulator for Uint128 mock contract
 */
const Uint128SimulatorBase = createSimulator<
  Uint128PrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof Uint128Witnesses>,
  Contract<Uint128PrivateState>,
  readonly []
>({
  contractFactory: (witnesses) => new Contract<Uint128PrivateState>(witnesses),
  defaultPrivateState: () => Uint128PrivateState.generate(),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => Uint128Witnesses(),
});

/**
 * @description A simulator implementation for testing Uint128 math operations.
 */
export class Uint128Simulator extends Uint128SimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      Uint128PrivateState,
      ReturnType<typeof Uint128Witnesses>
    > = {},
  ) {
    super([], options);
  }

  public MODULUS(): bigint {
    return this.circuits.pure.MODULUS();
  }

  public ZERO_U128(): U128 {
    return this.circuits.pure.ZERO_U128();
  }

  public toU128(value: bigint): U128 {
    return this.circuits.impure.toU128(value);
  }

  public fromU128(value: U128): bigint {
    return this.circuits.pure.fromU128(value);
  }

  public isZero(value: bigint): boolean {
    return this.circuits.pure.isZero(value);
  }

  public isZeroU128(value: U128): boolean {
    return this.circuits.pure.isZeroU128(value);
  }

  public eq(a: bigint, b: bigint): boolean {
    return this.circuits.pure.eq(a, b);
  }

  public eqU128(a: U128, b: U128): boolean {
    return this.circuits.pure.eqU128(a, b);
  }

  public lt(a: bigint, b: bigint): boolean {
    return this.circuits.pure.lt(a, b);
  }

  public ltU128(a: U128, b: U128): boolean {
    return this.circuits.pure.ltU128(a, b);
  }

  public lte(a: bigint, b: bigint): boolean {
    return this.circuits.pure.lte(a, b);
  }

  public lteU128(a: U128, b: U128): boolean {
    return this.circuits.pure.lteU128(a, b);
  }

  public gt(a: bigint, b: bigint): boolean {
    return this.circuits.pure.gt(a, b);
  }

  public gtU128(a: U128, b: U128): boolean {
    return this.circuits.pure.gtU128(a, b);
  }

  public gte(a: bigint, b: bigint): boolean {
    return this.circuits.pure.gte(a, b);
  }

  public gteU128(a: U128, b: U128): boolean {
    return this.circuits.pure.gteU128(a, b);
  }

  public add(a: bigint, b: bigint): U256 {
    return this.circuits.impure.add(a, b);
  }

  public addU128(a: U128, b: U128): U256 {
    return this.circuits.impure.addU128(a, b);
  }

  public addChecked(a: bigint, b: bigint): bigint {
    return this.circuits.pure.addChecked(a, b);
  }

  public addCheckedU128(a: U128, b: U128): bigint {
    return this.circuits.pure.addCheckedU128(a, b);
  }

  public sub(a: bigint, b: bigint): bigint {
    return this.circuits.pure.sub(a, b);
  }

  public subU128(a: U128, b: U128): U128 {
    return this.circuits.pure.subU128(a, b);
  }

  public mul(a: bigint, b: bigint): U256 {
    return this.circuits.impure.mul(a, b);
  }

  public mulU128(a: U128, b: U128): U256 {
    return this.circuits.impure.mulU128(a, b);
  }

  public mulChecked(a: bigint, b: bigint): bigint {
    return this.circuits.impure.mulChecked(a, b);
  }

  public mulCheckedU128(a: U128, b: U128): bigint {
    return this.circuits.impure.mulCheckedU128(a, b);
  }

  public div(a: bigint, b: bigint): bigint {
    return this.circuits.impure.div(a, b);
  }

  public divU128(a: U128, b: U128): U128 {
    return this.circuits.impure.divU128(a, b);
  }

  public rem(a: bigint, b: bigint): bigint {
    return this.circuits.impure.rem(a, b);
  }

  public remU128(a: U128, b: U128): U128 {
    return this.circuits.impure.remU128(a, b);
  }

  public divRem(a: bigint, b: bigint): DivResultU128 {
    return this.circuits.impure.divRem(a, b);
  }

  public divRemU128(a: U128, b: U128): DivResultU128 {
    return this.circuits.impure.divRemU128(a, b);
  }

  public sqrt(radicand: bigint): bigint {
    return this.circuits.impure.sqrt(radicand);
  }

  public sqrtU128(radicand: U128): bigint {
    return this.circuits.impure.sqrtU128(radicand);
  }

  public min(a: bigint, b: bigint): bigint {
    return this.circuits.pure.min(a, b);
  }

  public minU128(a: U128, b: U128): U128 {
    return this.circuits.pure.minU128(a, b);
  }

  public max(a: bigint, b: bigint): bigint {
    return this.circuits.pure.max(a, b);
  }

  public maxU128(a: U128, b: U128): U128 {
    return this.circuits.pure.maxU128(a, b);
  }

  public isMultiple(value: bigint, divisor: bigint): boolean {
    return this.circuits.impure.isMultiple(value, divisor);
  }

  public isMultipleU128(value: U128, divisor: U128): boolean {
    return this.circuits.impure.isMultipleU128(value, divisor);
  }

  public MAX_UINT128(): bigint {
    return this.circuits.pure.MAX_UINT128();
  }

  public MAX_U128(): U128 {
    return this.circuits.pure.MAX_U128();
  }
}
