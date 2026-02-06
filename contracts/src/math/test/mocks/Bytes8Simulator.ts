import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  Contract,
  ledger,
} from '@src/artifacts/math/test/mocks/contracts/Bytes8.mock/contract/index.js';
import type { Bytes8PrivateState } from '@src/math/test/mocks/witnesses/Bytes8.js';
import { Bytes8Witnesses } from '@src/math/test/mocks/witnesses/Bytes8.js';

/**
 * Base simulator for Bytes8 mock contract
 */
const Bytes8SimulatorBase = createSimulator<
  Bytes8PrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof Bytes8Witnesses>,
  Contract<Bytes8PrivateState>,
  readonly []
>({
  contractFactory: (witnesses) => new Contract<Bytes8PrivateState>(witnesses),
  defaultPrivateState: () => ({}),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => Bytes8Witnesses(),
});

/**
 * @description A simulator implementation for testing Bytes8 conversion operations.
 */
export class Bytes8Simulator extends Bytes8SimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      Bytes8PrivateState,
      ReturnType<typeof Bytes8Witnesses>
    > = {},
  ) {
    super([], options);
  }

  /**
   * Converts Bytes<8> to Uint<64> using little-endian byte ordering.
   */
  public toUint64(bytes: Uint8Array): bigint {
    return this.circuits.impure.toUint64(bytes);
  }

  /**
   * Converts Bytes<8> to Vector<8, Uint<8>>.
   */
  public toVector(
    bytes: Uint8Array,
  ): [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] {
    return this.circuits.impure.toVector(bytes) as [
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
      bigint,
    ];
  }
}
