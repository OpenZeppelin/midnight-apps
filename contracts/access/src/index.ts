/**
 * @module @openzeppelin/midnight-apps-access-contract
 * @description Main entry point for the AccessControl contract package, exporting private state utilities, witness implementations, and type definitions.
 * @remarks This module serves as the primary export point for TypeScript consumers of the AccessControl contract.
 */

export type {
  AccessControlLedger,
  AccessControlRole,
} from './types/ledger';
export type { RoleValue } from './types/role';
export type { IContractSimulator } from './types/test';
// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  AccessContractPrivateState,
  AccessControlWitnesses,
} from './witnesses/AccessControlWitnesses';
export type { IAccessControlWitnesses } from './witnesses/interface';
