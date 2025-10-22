/**
 * @module @openzeppelin/midnight-apps-access-contract/types/ledger
 * @description Re-exports ledger-related types from the AccessControl contract’s Index artifact.
 * @remarks Renames AccessControl_Role to AccessControlRole to follow TypeScript naming conventions (camelCase over snake_case).
 */

/**
 * @description Ledger interface containing the public state of the AccessControl contract.
 * @typedef {Object} AccessControlLedger
 */
// biome-ignore lint/performance/noBarrelFile: entrypoint module
export {
  AccessControl_Role as AccessControlRole,
  Ledger as AccessControlLedger,
} from '../artifacts/Index/contract/index.cjs';
