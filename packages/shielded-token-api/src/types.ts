import type { FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
// Value import required for typeof in type derivation (cannot use import type)
// biome-ignore lint/style/useImportType: typeof needs value at compile time
import shieldedTokenContractInfo from '@openzeppelin/midnight-apps-contracts/dist/artifacts/shielded-token/ShieldedFungibleToken/compiler/contract-info.json';
import type {
  Contract,
  Witnesses,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/shielded-token/ShieldedFungibleToken/contract';

export type ShieldedFungibleTokenPrivateState = Record<string, never>;

/** Circuit metadata from contract-info.json */
type CircuitInfo = (typeof shieldedTokenContractInfo)['circuits'][number];

/** Impure circuits only */
type ImpureCircuitInfo = Extract<CircuitInfo, { pure: false }>;

/** All impure circuit keys - derived from contract-info.json */
export type ShieldedFungibleTokenCircuitKeys = ImpureCircuitInfo['name'];

export const ShieldedFungibleTokenPrivateStateId =
  'shieldedFungibleTokenPrivateState';

export type ShieldedFungibleTokenContract = Contract<
  ShieldedFungibleTokenPrivateState,
  Witnesses<ShieldedFungibleTokenPrivateState>
>;

export type ShieldedFungibleTokenProviders = MidnightProviders<
  ShieldedFungibleTokenCircuitKeys,
  typeof ShieldedFungibleTokenPrivateStateId,
  ShieldedFungibleTokenPrivateState
>;

export type DeployedShieldedFungibleTokenContract =
  FoundContract<ShieldedFungibleTokenContract>;
