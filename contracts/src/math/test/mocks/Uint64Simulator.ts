import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import type { DivResultU64 } from '@src/artifacts/math/test/mocks/contracts/Uint64.mock/contract/index.js';
import {
  Contract,
  ledger,
} from '@src/artifacts/math/test/mocks/contracts/Uint64.mock/contract/index.js';
import { Uint64PrivateState, Uint64Witnesses } from './witnesses/Uint64.js';

/**
 * Base simulator for Uint64 mock contract
 */
const Uint64SimulatorBase = createSimulator<
  Uint64PrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof Uint64Witnesses>,
  Contract<Uint64PrivateState>,
  readonly []
>({
  contractFactory: (witnesses) => new Contract<Uint64PrivateState>(witnesses),
  defaultPrivateState: () => Uint64PrivateState.generate(),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => Uint64Witnesses(),
});

/**
 * @description A simulator implementation for testing Uint64 math operations.
 */
export class Uint64Simulator extends Uint64SimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      Uint64PrivateState,
      ReturnType<typeof Uint64Witnesses>
    > = {},
  ) {
    super([], options);
  }

  public add(a: bigint, b: bigint): bigint {
    return this.circuits.pure.add(a, b);
  }

  public sub(a: bigint, b: bigint): bigint {
    return this.circuits.pure.sub(a, b);
  }

  public mul(a: bigint, b: bigint): bigint {
    return this.circuits.pure.mul(a, b);
  }

  public div(a: bigint, b: bigint): bigint {
    return this.circuits.impure.div(a, b);
  }

  public rem(a: bigint, b: bigint): bigint {
    return this.circuits.impure.rem(a, b);
  }

  public divRem(a: bigint, b: bigint): DivResultU64 {
    return this.circuits.impure.divRem(a, b);
  }

  public sqrt(radical: bigint): bigint {
    return this.circuits.impure.sqrt(radical);
  }

  public isMultiple(a: bigint, b: bigint): boolean {
    return this.circuits.impure.isMultiple(a, b);
  }

  public min(a: bigint, b: bigint): bigint {
    return this.circuits.pure.min(a, b);
  }

  public max(a: bigint, b: bigint): bigint {
    return this.circuits.pure.max(a, b);
  }

  public MAX_UINT8(): bigint {
    return this.circuits.pure.MAX_UINT8();
  }

  public MAX_UINT16(): bigint {
    return this.circuits.pure.MAX_UINT16();
  }

  public MAX_UINT32(): bigint {
    return this.circuits.pure.MAX_UINT32();
  }

  public MAX_UINT64(): bigint {
    return this.circuits.pure.MAX_UINT64();
  }
}
