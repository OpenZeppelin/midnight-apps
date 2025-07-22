/**
 * @module @midnight-dapps/math-contract
 * @description Main entry point for the Math contract package, exporting private state utilities, witness implementations, and type definitions.
 */

// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  type Uint64ContractPrivateState,
  Uint64Witnesses,
} from './witnesses/Uint64';
export {
  type Uint128ContractPrivateState,
  Uint128Witnesses,
} from './witnesses/Uint128';
export {
  type Uint256ContractPrivateState,
  Uint256Witnesses,
} from './witnesses/Uint256';
export { sqrtBigint } from './utils/sqrtBigint';
export type { IContractSimulator } from './types/test';
export type { EmptyState } from './types/state';
