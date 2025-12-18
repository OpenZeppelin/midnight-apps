/**
 * @module @openzeppelin/midnight-apps-math-contract
 * @description Main entry point for the Math contract package, exporting private state utilities, witness implementations, and type definitions.
 */

export type { EmptyState } from './types/state';
export type { IContractSimulator } from './types/test';
// biome-ignore lint/performance/noBarrelFile: entrypoint module
export { sqrtBigint } from './utils/sqrtBigint';
export {
  type Bytes32PrivateState,
  Bytes32Witnesses,
} from './witnesses/Bytes32';
export {
  type Field254PrivateState,
  Field254Witnesses,
} from './witnesses/Field254';
export {
  type MaxPrivateState,
  MaxWitnesses,
} from './witnesses/Max';
// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  type Uint64PrivateState,
  Uint64Witnesses,
} from './witnesses/Uint64';
export {
  type Uint128PrivateState,
  Uint128Witnesses,
} from './witnesses/Uint128';
export {
  type Uint256PrivateState,
  Uint256Witnesses,
} from './witnesses/Uint256';
