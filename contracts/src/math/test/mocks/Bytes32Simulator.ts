import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Bytes32.mock/contract/index.js';
import {
  Contract,
  ledger,
  type U256,
} from '@src/artifacts/math/test/mocks/contracts/Bytes32.mock/contract/index.js';
import { wit_unpackBytes32 } from '@src/math/witnesses/wit_unpackBytes32.js';

export type Bytes32PrivateState = Record<string, never>;

export const Bytes32Witnesses = (): Witnesses<Bytes32PrivateState> => ({
  wit_unpackBytes32(_context, bytes) {
    return [{}, wit_unpackBytes32(bytes)];
  },
});

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
 * @description A simulator implementation for testing Bytes32 conversion operations.
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
   * Packs Vector<32, Uint<8>> into Bytes<32>.
   */
  public pack(vec: bigint[]): Uint8Array {
    return this.circuits.impure.pack(vec);
  }

  /**
   * Unpacks Bytes<32> into Vector<32, Uint<8>>.
   */
  public unpack(bytes: Uint8Array): bigint[] {
    return this.circuits.impure.unpack(bytes);
  }

  /**
   * Converts Vector<32, Uint<8>> to U256 (little-endian).
   */
  public vectorToU256(vec: bigint[]): U256 {
    return this.circuits.impure.vectorToU256(vec);
  }

  /**
   * Converts Bytes<32> to U256 (little-endian).
   */
  public bytesToU256(bytes: Uint8Array): U256 {
    return this.circuits.impure.bytesToU256(bytes);
  }
}
