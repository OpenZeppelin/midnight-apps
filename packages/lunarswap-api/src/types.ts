import type {
  LunarswapPrivateState,
  Contract,
  Witnesses,
  Ledger,
} from '@midnight-dapps/lunarswap-v1';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { FoundContract } from '@midnight-ntwrk/midnight-js-contracts';

// Define EmptyState locally
export type EmptyState = Record<string, never>;

export type LunarswapPrivateStates = {
  readonly lunarswapPrivateState: LunarswapPrivateState;
};

export type LunarswapPublicState = {
  readonly pool: Ledger['pool'];
};

export type LunarswapContract = Contract<
  LunarswapPrivateState,
  Witnesses<LunarswapPrivateState>
>;

export type LunarswapCircuitKeys = Exclude<
  keyof LunarswapContract['impureCircuits'],
  number | symbol
>;

export const LunarswapPrivateStateId = 'lunarswapPrivateState';

export type LunarswapProviders = MidnightProviders<
  LunarswapCircuitKeys,
  typeof LunarswapPrivateStateId,
  LunarswapPrivateState
>;

export type DeployedLunarswapContract = FoundContract<LunarswapContract>;
