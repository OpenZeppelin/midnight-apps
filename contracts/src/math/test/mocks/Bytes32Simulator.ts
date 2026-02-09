import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  Contract,
  ledger,
  type U256,
} from '@src/artifacts/math/test/mocks/contracts/Bytes32.mock/contract/index.js';
import type { Bytes32PrivateState } from '@src/math/test/mocks/witnesses/Bytes32.js';
import { Bytes32Witnesses } from '@src/math/test/mocks/witnesses/Bytes32.js';

/**
 * Base simulator for Bytes32 mock contract
 */
const Bytes32SimulatorBase = createSimulator<
  Bytes32PrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof Bytes32Witnesses>,
  Contract<Bytes32PrivateState>,
  readonly []
>({
  contractFactory: (witnesses) => new Contract<Bytes32PrivateState>(witnesses),
  defaultPrivateState: () => ({}),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => Bytes32Witnesses(),
});

/**
 * @description A simulator implementation for testing Bytes32 conversion and comparison operations.
 */
export class Bytes32Simulator extends Bytes32SimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      Bytes32PrivateState,
      ReturnType<typeof Bytes32Witnesses>
    > = {},
  ) {
    super([], options);
  }

  /**
   * Converts a 32-byte array to a U256 struct using little-endian byte ordering.
   */
  public toU256(value: Uint8Array): U256 {
    return this.circuits.impure.toU256(value);
  }

  /**
   * Converts Bytes<32> to a vector of 32 bytes (Vector<32, Uint<8>>).
   */
  public toVector(bytes: Uint8Array): bigint[] {
    return this.circuits.impure.toVector(bytes);
  }

  /**
   * Compares two Bytes<32> for equality.
   */
  public eq(a: Uint8Array, b: Uint8Array): boolean {
    return this.circuits.impure.eq(a, b);
  }

  /**
   * Compares two Bytes<32> for less than.
   */
  public lt(a: Uint8Array, b: Uint8Array): boolean {
    return this.circuits.impure.lt(a, b);
  }

  /**
   * Compares two Bytes<32> for less than or equal.
   */
  public lte(a: Uint8Array, b: Uint8Array): boolean {
    return this.circuits.impure.lte(a, b);
  }

  /**
   * Compares two Bytes<32> for greater than.
   */
  public gt(a: Uint8Array, b: Uint8Array): boolean {
    return this.circuits.impure.gt(a, b);
  }

  /**
   * Compares two Bytes<32> for greater than or equal.
   */
  public gte(a: Uint8Array, b: Uint8Array): boolean {
    return this.circuits.impure.gte(a, b);
  }

  /**
   * Checks if a Bytes<32> is zero.
   */
  public isZero(a: Uint8Array): boolean {
    return this.circuits.impure.isZero(a);
  }
}
