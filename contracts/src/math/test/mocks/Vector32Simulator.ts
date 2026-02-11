import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  Contract,
  ledger,
  type U256,
} from '@src/artifacts/math/test/mocks/contracts/Vector32.mock/contract/index.js';
import type { Vector32PrivateState } from '@src/math/test/mocks/witnesses/Vector32.js';
import { Vector32Witnesses } from '@src/math/test/mocks/witnesses/Vector32.js';

/**
 * Base simulator for Vector32 mock contract
 */
const Vector32SimulatorBase = createSimulator<
  Vector32PrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof Vector32Witnesses>,
  Contract<Vector32PrivateState>,
  readonly []
>({
  contractFactory: (witnesses) => new Contract<Vector32PrivateState>(witnesses),
  defaultPrivateState: () => ({}),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => Vector32Witnesses(),
});

/**
 * @description A simulator implementation for testing Vector32 conversion operations.
 */
export class Vector32Simulator extends Vector32SimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      Vector32PrivateState,
      ReturnType<typeof Vector32Witnesses>
    > = {},
  ) {
    super([], options);
  }

  /**
   * Converts Vector<32, Uint<8>> to U256 (little-endian).
   */
  public toU256(vec: bigint[]): U256 {
    return this.circuits.impure.toU256(vec);
  }

  /**
   * Converts Vector<32, Uint<8>> to Bytes<32>.
   */
  public toBytes(vec: bigint[]): Uint8Array {
    return this.circuits.impure.toBytes(vec);
  }
}
