import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Role } from '../../../artifacts/access/Index/contract/index.cjs';
// TODO: (team): I noticed that we are using the mock contract's ledger type here, but I am not sure if this is correct way.
import type { Ledger } from '../../../artifacts/access/test/AccessControl.mock/contract/index.cjs';
import type { Maybe, MerkleTreePath } from '../../types/StandardLibrary.js';
/**
 * @description Interface defining the witness methods for access control operations.
 * Matches the structure expected by Index and MockAccessControl artifacts.
 * @template P - The private state type.
 */
export interface IAccessControlWitnesses<P> {
  /**
   * Updates the private state with a new role assignment.
   * @param context - The witness context containing ledger and private state.
   * @param userRoleCommit - The commitment hash of the user-role pair.
   * @param role - The role to assign.
   * @param index - The Merkle tree index for the commitment.
   * @returns A tuple of the updated private state and an empty array as the witness result.
   */
  wit_updateRole(
    context: WitnessContext<Ledger, P>,
    userRoleCommit: Uint8Array,
    role: Role,
    index: bigint,
  ): [P, []];

  /**
   * Retrieves the Merkle tree path for a user-role commitment.
   * @param context - The witness context containing ledger and private state.
   * @param userRoleCommit - The commitment hash to look up.
   * @returns A tuple of the private state and a Maybe containing the Merkle path or an empty path.
   */
  wit_getRoleMerklePath(
    context: WitnessContext<Ledger, P>,
    userRoleCommit: Uint8Array,
  ): [P, Maybe<MerkleTreePath<Uint8Array>>];

  /**
   * Retrieves the secret key from the private state.
   * @param context - The witness context containing the private state.
   * @returns A tuple of the private state and the secret key as a Uint8Array.
   */
  wit_getSecretKey(context: WitnessContext<Ledger, P>): [P, Uint8Array];
}
