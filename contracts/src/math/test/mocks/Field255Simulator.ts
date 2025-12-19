import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  Contract,
  type DivResultField,
  type U256,
  ledger,
} from '../../../../artifacts/math/test/mocks/contracts/Field255.mock/contract/index.js';
import {
  Field255PrivateState,
  Field255Witnesses,
} from './witnesses/Field255.js';

/**
 * Base simulator for Field255 mock contract
 */
const Field255SimulatorBase = createSimulator<
  Field255PrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof Field255Witnesses>,
  Contract<Field255PrivateState>,
  readonly []
>({
  contractFactory: (witnesses) => new Contract<Field255PrivateState>(witnesses),
  defaultPrivateState: () => Field255PrivateState.generate(),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => Field255Witnesses(),
});

/**
 * @description A simulator implementation for testing Field255 math operations.
 */
export class Field255Simulator extends Field255SimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      Field255PrivateState,
      ReturnType<typeof Field255Witnesses>
    > = {},
  ) {
    super([], options);
  }

  /**
   * Converts a Field value to Bytes<32> representation.
   */
  public toBytes(value: bigint): Uint8Array {
    return this.circuits.impure.toBytes(value);
  }

  /**
   * Converts a Field value to a U256 struct.
   */
  public toU256(value: bigint): U256 {
    return this.circuits.impure.toU256(value);
  }

  /**
   * Checks if two Field values are equal.
   */
  public eq(a: bigint, b: bigint): boolean {
    return this.circuits.impure.eq(a, b);
  }

  /**
   * Checks if one Field value is less than another.
   */
  public lt(a: bigint, b: bigint): boolean {
    return this.circuits.impure.lt(a, b);
  }

  /**
   * Checks if one Field value is less than or equal to another.
   */
  public lte(a: bigint, b: bigint): boolean {
    return this.circuits.impure.lte(a, b);
  }

  /**
   * Checks if one Field value is greater than another.
   */
  public gt(a: bigint, b: bigint): boolean {
    return this.circuits.impure.gt(a, b);
  }

  /**
   * Checks if one Field value is greater than or equal to another.
   */
  public gte(a: bigint, b: bigint): boolean {
    return this.circuits.impure.gte(a, b);
  }

  /**
   * Checks if a Field value is zero.
   */
  public isZero(a: bigint): boolean {
    return this.circuits.impure.isZero(a);
  }

  /**
   * Safely adds two Field values with overflow check.
   * @throws If the sum exceeds MAX_FIELD (overflow)
   */
  public add(a: bigint, b: bigint): bigint {
    return this.circuits.impure.add(a, b);
  }

  /**
   * Adds two Field values using modular arithmetic (no overflow check).
   * If the sum exceeds MAX_FIELD, the result wraps around.
   */
  public unsafeAdd(a: bigint, b: bigint): bigint {
    return this.circuits.impure.unsafeAdd(a, b);
  }

  /**
   * Safely subtracts one Field value from another with underflow check.
   * @throws If b > a (underflow)
   */
  public sub(a: bigint, b: bigint): bigint {
    return this.circuits.impure.sub(a, b);
  }

  /**
   * Subtracts one Field value from another using modular arithmetic (no underflow check).
   * If b > a, the result wraps around: unsafeSub(5, 10) = field_order - 5
   */
  public unsafeSub(a: bigint, b: bigint): bigint {
    return this.circuits.impure.unsafeSub(a, b);
  }

  /**
   * Safely multiplies two Field values with overflow check.
   * @throws If the product exceeds MAX_FIELD (overflow)
   */
  public mul(a: bigint, b: bigint): bigint {
    return this.circuits.impure.mul(a, b);
  }

  /**
   * Multiplies two Field values using modular arithmetic (no overflow check).
   * If the product exceeds MAX_FIELD, the result wraps around.
   */
  public unsafeMul(a: bigint, b: bigint): bigint {
    return this.circuits.impure.unsafeMul(a, b);
  }

  /**
   * Divides one Field value by another, returning the quotient.
   */
  public div(a: bigint, b: bigint): bigint {
    return this.circuits.impure.div(a, b);
  }

  /**
   * Computes the remainder of dividing one Field value by another.
   */
  public rem(a: bigint, b: bigint): bigint {
    return this.circuits.impure.rem(a, b);
  }

  /**
   * Computes both quotient and remainder of dividing one Field value by another.
   */
  public divRem(a: bigint, b: bigint): DivResultField {
    return this.circuits.impure.divRem(a, b);
  }

  /**
   * Computes the floor of the square root of a Field value.
   */
  public sqrt(radicand: bigint): bigint {
    return this.circuits.impure.sqrt(radicand);
  }

  /**
   * Returns the smaller of two Field values.
   */
  public min(a: bigint, b: bigint): bigint {
    return this.circuits.impure.min(a, b);
  }

  /**
   * Returns the larger of two Field values.
   */
  public max(a: bigint, b: bigint): bigint {
    return this.circuits.impure.max(a, b);
  }
}
