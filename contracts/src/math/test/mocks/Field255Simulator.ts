import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  Contract,
  ledger,
  type U256,
} from '@src/artifacts/math/test/mocks/contracts/Field255.mock/contract/index.js';
import {
  Field255PrivateState,
  Field255Witnesses,
} from '@src/math/test/mocks/witnesses/Field255.js';

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
   * Returns the maximum Field value (BLS12-381 scalar field prime minus 1).
   */
  public MAX_FIELD(): bigint {
    return this.circuits.impure.MAX_FIELD();
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
}
