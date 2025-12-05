import { getRandomValues } from 'node:crypto';
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import { Role } from '../../../artifacts/access/Index/contract/index.cjs';
import type { Ledger } from '../../../artifacts/access/test/AccessControl.mock/contract/index.cjs';
import type {
  Maybe,
  MerkleTreePath,
  ZswapCoinPublicKey,
} from '../../types/StandardLibrary.js';
import type { RoleValue } from '../types/role.js';
import { maybeFromNullable } from '../utils/compactHelper.js';
import { emptyMerkleTreePath } from '../utils/test.js';
import type { IAccessControlWitnesses } from './interface.js';

/**
 * @description Represents the private state of an access control contract, storing a secret key and role assignments.
 */
export type AccessContractPrivateState = {
  /** @description A 32-byte secret key used for cryptographic operations, such as nullifier generation. */
  secretKey: Buffer;

  /** @description A record mapping user-role commitment strings to their role values. */
  roles: Record<string, RoleValue>;
};

/**
 * @description Utility object for managing the private state of an access control contract.
 */
export const AccessContractPrivateState = {
  /**
   * @description Generates a new private state with a random secret key and empty roles.
   * @returns A fresh AccessContractPrivateState instance.
   */
  generate: (): AccessContractPrivateState => {
    return { secretKey: getRandomValues(Buffer.alloc(32)), roles: {} };
  },

  /**
   * @description Updates the private state with a new role assignment for a user.
   * @param state - The current private state to update.
   * @param userRoleCommit - The commitment hash of the user-role pair.
   * @param role - The role to assign (e.g., Admin, Lp, Trader, None).
   * @param index - The index of the commitment in the Merkle tree.
   * @returns The updated private state with the new role entry.
   */
  wit_updateRole: (
    state: AccessContractPrivateState,
    userRoleCommit: Uint8Array,
    role: Role,
    index: bigint,
  ): AccessContractPrivateState => {
    const userRoleCommitString = userRoleCommit.toString();
    return {
      ...state,
      roles: {
        ...state.roles,
        [userRoleCommitString]: {
          role,
          commitment: userRoleCommit,
          index,
          path: state.roles[userRoleCommitString]?.path,
        },
      },
    };
  },

  /**
   * @description Retrieves the role for a given user from the private state.
   * @param state - The current private state.
   * @param user - The public key of the user to query.
   * @returns The user’s role, defaulting to None if not found.
   */
  wit_getRoleMerklePath: (
    state: AccessContractPrivateState,
    user: ZswapCoinPublicKey,
  ): Role => {
    const userKey = Buffer.from(user.bytes).toString('hex');
    return state.roles[userKey]?.role ?? Role.None;
  },

  /**
   * @description Updates the Merkle tree path for an existing role in the private state.
   * @param state - The current private state.
   * @param userRoleCommit - The commitment hash of the user-role pair.
   * @param path - The Merkle tree path to store.
   * @returns The updated private state, or unchanged if the role doesn’t exist.
   */
  wit_updatePath: (
    state: AccessContractPrivateState,
    userRoleCommit: Uint8Array,
    path: MerkleTreePath<Uint8Array>,
  ): AccessContractPrivateState => {
    const userRoleCommitString = userRoleCommit.toString();
    const existing = state.roles[userRoleCommitString];
    if (!existing) return state;
    return {
      ...state,
      roles: {
        ...state.roles,
        [userRoleCommitString]: { ...existing, path },
      },
    };
  },
};

/**
 * @description Factory function creating witness implementations for access control operations.
 * @returns An object implementing the Witnesses interface for AccessContractPrivateState.
 */
export const AccessControlWitnesses =
  (): IAccessControlWitnesses<AccessContractPrivateState> => ({
    /**
     * @description Updates the private state with a new role assignment.
     * @param context - The witness context containing ledger and private state.
     * @param userRoleCommit - The commitment hash of the user-role pair.
     * @param role - The role to assign.
     * @param index - The Merkle tree index for the commitment.
     * @returns A tuple of the updated private state and an empty array as the witness result.
     */
    wit_updateRole(
      context: WitnessContext<Ledger, AccessContractPrivateState>,
      userRoleCommit: Uint8Array,
      role: Role,
      index: bigint,
    ): [AccessContractPrivateState, []] {
      return [
        AccessContractPrivateState.wit_updateRole(
          context.privateState,
          userRoleCommit,
          role,
          index,
        ),
        [],
      ];
    },

    /**
     * @description Retrieves the Merkle tree path for a user-role commitment from the ledger or private state.
     * @param context - The witness context containing ledger and private state.
     * @param userRoleCommit - The commitment hash to look up.
     * @returns A tuple of the unchanged private state and a Maybe containing the Merkle path or an empty path.
     */
    wit_getRoleMerklePath(
      context: WitnessContext<Ledger, AccessContractPrivateState>,
      userRoleCommit: Uint8Array,
    ): [AccessContractPrivateState, Maybe<MerkleTreePath<Uint8Array>>] {
      const userRoleCommitString = userRoleCommit.toString();
      const roleEntry = context.privateState.roles[userRoleCommitString];

      if (!roleEntry || typeof roleEntry.index === 'undefined') {
        return [
          context.privateState,
          maybeFromNullable(null, emptyMerkleTreePath),
        ];
      }

      return [
        context.privateState,
        // TODO: known issue: pathForLeaf is not working as expected: Error: invalid index into sparse merkle tree: 0
        maybeFromNullable(
          context.ledger.roleCommits.pathForLeaf(
            context.privateState.roles[userRoleCommitString].index,
            userRoleCommit,
          ),
          emptyMerkleTreePath,
        ),
      ];
    },

    /**
     * @description Retrieves the secret key from the private state.
     * @param context - The witness context containing the private state.
     * @returns A tuple of the unchanged private state and the secret key as a Uint8Array.
     */
    wit_getSecretKey(
      context: WitnessContext<Ledger, AccessContractPrivateState>,
    ): [AccessContractPrivateState, Uint8Array] {
      return [context.privateState, context.privateState.secretKey];
    },
  });
