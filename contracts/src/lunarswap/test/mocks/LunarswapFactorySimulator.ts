import type {
  Pair,
  QualifiedShieldedCoinInfo,
  ShieldedCoinInfo,
} from '@artifacts/lunarswap/test/mocks/contracts/LunarswapFactory.mock/contract/index.js';
import {
  Contract,
  ledger,
} from '@artifacts/lunarswap/test/mocks/contracts/LunarswapFactory.mock/contract/index.js';
import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  LunarswapFactoryPrivateState,
  LunarswapFactoryWitnesses,
} from './witnesses/LunarswapFactory.js';

/**
 * Base simulator for LunarswapFactory mock contract
 */
const LunarswapFactorySimulatorBase = createSimulator<
  LunarswapFactoryPrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof LunarswapFactoryWitnesses>,
  Contract<LunarswapFactoryPrivateState>,
  readonly []
>({
  contractFactory: (witnesses) =>
    new Contract<LunarswapFactoryPrivateState>(witnesses),
  defaultPrivateState: () => LunarswapFactoryPrivateState.generate(),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => LunarswapFactoryWitnesses(),
});

/**
 * @description A simulator implementation for testing LunarswapFactory operations.
 */
export class LunarswapFactorySimulator extends LunarswapFactorySimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      LunarswapFactoryPrivateState,
      ReturnType<typeof LunarswapFactoryWitnesses>
    > = {},
  ) {
    super([], options);
  }

  // Query operations
  public getAllPairLength(): bigint {
    return this.circuits.impure.getAllPairLength();
  }

  public exists(id: Uint8Array): boolean {
    return this.circuits.impure.exists(id);
  }

  public getPair(id: Uint8Array): Pair {
    return this.circuits.impure.getPair(id);
  }

  public getReserves(
    id: Uint8Array,
    reserve0Id: Uint8Array,
    reserve1Id: Uint8Array,
  ): [QualifiedShieldedCoinInfo, QualifiedShieldedCoinInfo] {
    return this.circuits.impure.getReserves(id, reserve0Id, reserve1Id);
  }

  // Mutation operations
  public createPair(
    id: Uint8Array,
    token0: ShieldedCoinInfo,
    token1: ShieldedCoinInfo,
  ): Pair {
    return this.circuits.impure.createPair(id, token0, token1);
  }

  public updatePair(id: Uint8Array, pair: Pair): Pair {
    return this.circuits.impure.updatePair(id, pair);
  }

  public removePair(pair: Pair): void {
    this.circuits.impure.removePair(pair);
  }
}
