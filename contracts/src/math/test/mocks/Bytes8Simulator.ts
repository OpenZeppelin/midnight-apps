import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Bytes8.mock/contract/index.js';
import {
  Contract,
  ledger,
} from '@src/artifacts/math/test/mocks/contracts/Bytes8.mock/contract/index.js';

export type Bytes8PrivateState = Record<string, never>;

export const Bytes8Witnesses = (): Witnesses<Bytes8PrivateState> => ({});

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
   * Converts 8 bytes to Uint<64> (little-endian).
   */
  public toUint64(
    bytes: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
  ): bigint {
    return this.circuits.impure.toUint64(
      bytes[0],
      bytes[1],
      bytes[2],
      bytes[3],
      bytes[4],
      bytes[5],
      bytes[6],
      bytes[7],
    );
  }
}
