/**
 * @module @openzeppelin/midnight-apps-access-contract
 * @description Main entry point for the AccessControl contract package, exporting private state utilities, witness implementations, and type definitions.
 * @remarks This module serves as the primary export point for TypeScript consumers of the AccessControl contract.
 */

// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  AccessContractPrivateState,
  AccessControlWitnesses,
} from './witnesses/AccessControlWitnesses.js';

export type { IAccessControlWitnesses } from './witnesses/interface.js';

export type {
  Role,
  Ledger,
} from './types/ledger.js';

export type { RoleValue } from './types/role.js';

export type { IContractSimulator } from './types/test.js';
