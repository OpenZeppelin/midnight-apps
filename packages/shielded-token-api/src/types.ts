import type { 
  Contract, 
  ShieldedFungibleTokenPrivateState, 
  Witnesses, 
  Ledger 
} from '@midnight-dapps/shielded-token-contract';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import type { FoundContract } from '@midnight-ntwrk/midnight-js-contracts';

// Define EmptyState locally
export type EmptyState = Record<string, never>;

export type ShieldedTokenPrivateStates = {
  readonly shieldedTokenPrivateState: ShieldedFungibleTokenPrivateState;
};

export type ShieldedTokenPublicState = {
  readonly ledger: Ledger;
  readonly privateState: ShieldedFungibleTokenPrivateState | undefined;
};

export type ShieldedTokenContract = Contract<
  ShieldedFungibleTokenPrivateState,
  Witnesses<ShieldedFungibleTokenPrivateState>
>;

export type ShieldedTokenCircuitKeys = Exclude<
  keyof ShieldedTokenContract['impureCircuits'],
  number | symbol
>;

export const ShieldedTokenPrivateStateId = 'shieldedTokenPrivateState' as const;

export type ShieldedTokenProviders = MidnightProviders<
  ShieldedTokenCircuitKeys,
  typeof ShieldedTokenPrivateStateId,
  ShieldedFungibleTokenPrivateState
>;

export type DeployedShieldedTokenContract = FoundContract<ShieldedTokenContract>;
 