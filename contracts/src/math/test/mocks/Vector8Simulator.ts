import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  Contract,
  ledger,
} from '@src/artifacts/math/test/mocks/contracts/Vector8.mock/contract/index.js';
import type { Vector8PrivateState } from '@src/math/test/mocks/witnesses/Vector8.js';
import { Vector8Witnesses } from '@src/math/test/mocks/witnesses/Vector8.js';

/**
 * Base simulator for Vector8 mock contract
 */
const Vector8SimulatorBase = createSimulator<
  Vector8PrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof Vector8Witnesses>,
  Contract<Vector8PrivateState>,
  readonly []
>({
  contractFactory: (witnesses) => new Contract<Vector8PrivateState>(witnesses),
  defaultPrivateState: () => ({}),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => Vector8Witnesses(),
});

/**
 * @description A simulator implementation for testing Vector8 conversion operations.
 */
export class Vector8Simulator extends Vector8SimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      Vector8PrivateState,
      ReturnType<typeof Vector8Witnesses>
    > = {},
  ) {
    super([], options);
  }

  /**
   * Converts Vector<8, Uint<8>> to Uint<64> (little-endian).
   */
  public toUint64(
    vec: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
  ): bigint {
    return this.circuits.impure.toUint64(vec);
  }

  /**
   * Converts Vector<8, Uint<8>> to Bytes<8>.
   */
  public toBytes(
    vec: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
  ): Uint8Array {
    return this.circuits.impure.toBytes(vec);
  }
}
