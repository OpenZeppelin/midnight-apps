/**
 * @module @openzeppelin/midnight-apps-math-contract
 * @description Main entry point for the Math contract package, exporting private state utilities, witness implementations, and type definitions.
 */

// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  type Uint64PrivateState,
  Uint64Witnesses,
} from './witnesses/Uint64.js';
export {
  type Uint128PrivateState,
  Uint128Witnesses,
} from './witnesses/Uint128.js';
export {
  type Uint256PrivateState,
  Uint256Witnesses,
} from './witnesses/Uint256.js';
export {
  type Field254PrivateState,
  Field254Witnesses,
} from './witnesses/Field254.js';
export {
  type Bytes32PrivateState,
  Bytes32Witnesses,
} from './witnesses/Bytes32.js';
export {
  type MaxPrivateState,
  MaxWitnesses,
} from './witnesses/Max.js';
export { sqrtBigint } from './utils/sqrtBigint.js';
export type { IContractSimulator } from './types/test.js';
export type { EmptyState } from './types/state.js';
