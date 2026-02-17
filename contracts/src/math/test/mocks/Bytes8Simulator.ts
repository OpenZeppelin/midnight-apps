import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Bytes8.mock/contract/index.js';
import {
  Contract,
  ledger,
} from '@src/artifacts/math/test/mocks/contracts/Bytes8.mock/contract/index.js';
import { wit_unpackBytes8 } from '@src/math/witnesses/wit_unpackBytes8.js';

export type Bytes8PrivateState = Record<string, never>;

export const Bytes8Witnesses = (): Witnesses<Bytes8PrivateState> => ({
  wit_unpackBytes8(_context, bytes) {
    return [{}, wit_unpackBytes8(bytes)];
  },
});

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
   * Packs Vector<8, Uint<8>> into Bytes<8>.
   */
  public pack(
    vec: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
  ): Uint8Array {
    return this.circuits.impure.pack(vec);
  }

  /**
   * Unpacks Bytes<8> into Vector<8, Uint<8>>.
   */
  public unpack(
    bytes: Uint8Array,
  ): [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint] {
    return this.circuits.impure.unpack(bytes) as [
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

  /**
   * Converts Vector<8, Uint<8>> to Uint<64> (little-endian).
   */
  public vectorToUint64(
    vec: [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint],
  ): bigint {
    return this.circuits.impure.vectorToUint64(vec);
  }

  /**
   * Converts Bytes<8> to Uint<64> (little-endian).
   */
  public bytesToUint64(bytes: Uint8Array): bigint {
    return this.circuits.impure.bytesToUint64(bytes);
  }
}
