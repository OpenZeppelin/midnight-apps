/**
 * @module @midnight-dapps/math-contract
 * @description Main entry point for the Math contract package, exporting private state utilities, witness implementations, and type definitions.
 */

// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  type MathContractPrivateState,
  MathWitnesses,
} from './witnesses/MathWitnesses';
export { sqrtBigint } from './utils/sqrtBigint';
export type { IContractSimulator } from './types/test';
export type { EmptyState } from './types/state';
