/**
 * @module @openzeppelin/midnight-apps-structs-contract
 * @description Main entry point for the AccessControl contract package, exporting private state utilities, witness implementations, and type definitions.
 */

// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  type QueueContractPrivateState,
  QueueWitnesses,
} from './witnesses/QueueWitnesses';
