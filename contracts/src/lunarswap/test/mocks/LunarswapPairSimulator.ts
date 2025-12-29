import type {
  Pair,
  ShieldedCoinInfo,
} from '@artifacts/lunarswap/test/mocks/contracts/LunarswapPair.mock/contract/index.js';
import {
  Contract,
  ledger,
} from '@artifacts/lunarswap/test/mocks/contracts/LunarswapPair.mock/contract/index.js';
import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  LunarswapPairPrivateState,
  LunarswapPairWitnesses,
} from './witnesses/LunarswapPair.js';

/**
 * Base simulator for LunarswapPair mock contract
 */
const LunarswapPairSimulatorBase = createSimulator<
  LunarswapPairPrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof LunarswapPairWitnesses>,
  Contract<LunarswapPairPrivateState>,
  readonly []
>({
  contractFactory: (witnesses) =>
    new Contract<LunarswapPairPrivateState>(witnesses),
  defaultPrivateState: () => LunarswapPairPrivateState.generate(),
  contractArgs: () => [],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => LunarswapPairWitnesses(),
});

/**
 * @description A simulator implementation for testing LunarswapPair operations.
 */
export class LunarswapPairSimulator extends LunarswapPairSimulatorBase {
  constructor(
    options: BaseSimulatorOptions<
      LunarswapPairPrivateState,
      ReturnType<typeof LunarswapPairWitnesses>
    > = {},
  ) {
    super([], options);
  }

  // Pair initialization
  public initializePair(
    id: Uint8Array,
    token0: ShieldedCoinInfo,
    token1: ShieldedCoinInfo,
  ): Pair {
    return this.circuits.impure.initializePair(id, token0, token1);
  }
}
