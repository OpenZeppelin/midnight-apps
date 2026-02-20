import type { FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
// Value import required for typeof in type derivation (cannot use import type)
// biome-ignore lint/style/useImportType: typeof needs value at compile time
import lunarswapContractInfo from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/compiler/contract-info.json';
import type {
  Contract,
  Ledger,
  Witnesses,
} from '@openzeppelin/midnight-apps-contracts/dist/artifacts/lunarswap/Lunarswap/contract';
import type { LunarswapPrivateState } from '@openzeppelin/midnight-apps-contracts/dist/lunarswap/witnesses/Lunarswap';

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

/** Circuit metadata from contract-info.json */
type CircuitInfo = (typeof lunarswapContractInfo)['circuits'][number];

/** Impure circuits only (excludes pure circuits like getIdentity) */
type ImpureCircuitInfo = Extract<CircuitInfo, { pure: false }>;

/** Impure circuits that require ZK proof (have verifier keys) */
type ImpureCircuitWithProof = Extract<ImpureCircuitInfo, { proof: true }>;

/** Impure circuits that do NOT require proof (no verifier keys) */
type ImpureCircuitNoProof = Extract<ImpureCircuitInfo, { proof: false }>;

/** All impure circuit keys - derived from contract-info.json */
export type LunarswapCircuitKeys = ImpureCircuitInfo['name'];

/** Circuit keys that require verifier keys (proof: true) - use for ZKConfigProvider when it supports subset */
export type LunarswapCircuitKeysWithProof = ImpureCircuitWithProof['name'];

/** Circuit keys that do NOT require verifier keys (proof: false) */
export type LunarswapCircuitKeysNoProof = ImpureCircuitNoProof['name'];

export const LunarswapPrivateStateId = 'lunarswapPrivateState';

export type LunarswapProviders = MidnightProviders<
  LunarswapCircuitKeys,
  typeof LunarswapPrivateStateId,
  LunarswapPrivateState
>;

export type DeployedLunarswapContract = FoundContract<LunarswapContract>;
