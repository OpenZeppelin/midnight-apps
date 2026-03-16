import { getRandomValues } from 'node:crypto';
import type {
  AccessControl_Role,
  Maybe,
  MerkleTreeDigest,
  MerkleTreePath,
  Witnesses,
} from '@src/artifacts/access/test/mocks/contracts/AccessControl.mock/contract/index.js';

export type RoleValue = {
  role: AccessControl_Role;
  commitment: Uint8Array;
  index: bigint;
};

/**
 * @description Represents the private state of an access control contract.
 */
export type AccessContractPrivateState = {
  /** @description A 32-byte secret key used for cryptographic operations. */
  secretKey: Uint8Array;

  /** @description A record mapping user-role commitment strings to their role values. */
  roles: Record<string, RoleValue>;
};

/**
 * @description Utility object for managing the private state of an access control contract.
 */
export const AccessContractPrivateState = {
  /**
   * @description Generates a new private state with a secret key and empty roles.
   * @param secretKey - Optional 32-byte secret key. If not provided, a random key will be generated.
   * @returns A new AccessContractPrivateState instance.
   */
  generate: (secretKey?: Uint8Array): AccessContractPrivateState => ({
    secretKey: secretKey ?? getRandomValues(new Uint8Array(32)),
    roles: {},
  }),

  /**
   * @description Updates the private state with a new role assignment for a user.
   */
  updateRole: (
    state: AccessContractPrivateState,
    userRoleCommit: Uint8Array,
    role: AccessControl_Role,
    index: bigint,
  ): AccessContractPrivateState => {
    const key = Buffer.from(userRoleCommit).toString('hex');
    return {
      ...state,
      roles: {
        ...state.roles,
        [key]: { role, commitment: userRoleCommit, index },
      },
    };
  },
};

/**
 * @description Default empty Merkle tree path with depth 10, required for Compact's Vector<10, ...> type.
 */
const emptyMerkleTreePath: MerkleTreePath<Uint8Array> = {
  leaf: new Uint8Array(32),
  path: Array.from(
    { length: 10 },
    (): {
      sibling: MerkleTreeDigest;
      goes_left: boolean;
    } => ({
      sibling: { field: 0n },
      goes_left: false,
    }),
  ),
};

/**
 * @description Factory function creating witness implementations for access control operations.
 */
export const AccessControlWitnesses =
  (): Witnesses<AccessContractPrivateState> => ({
    wit_updateRole(context, userRoleCommit, role, index) {
      return [
        AccessContractPrivateState.updateRole(
          context.privateState,
          userRoleCommit,
          role,
          index,
        ),
        [],
      ];
    },

    wit_getRoleMerklePath(
      context,
      userRoleCommit,
    ): [AccessContractPrivateState, Maybe<MerkleTreePath<Uint8Array>>] {
      const key = Buffer.from(userRoleCommit).toString('hex');
      const roleEntry = context.privateState.roles[key];

      if (!roleEntry) {
        return [
          context.privateState,
          {
            is_some: false,
            value: emptyMerkleTreePath,
          },
        ];
      }

      // Use pathForLeaf for O(1) performance with the tracked index
      // If the index is wrong, the circuit's checkRoot() validation will catch it
      try {
        const merklePath = context.ledger.AccessControl_roleCommits.pathForLeaf(
          roleEntry.index,
          userRoleCommit,
        );

        return [
          context.privateState,
          {
            is_some: true,
            value: {
              leaf: merklePath.leaf,
              path: merklePath.path,
            },
          },
        ];
      } catch {
        // If pathForLeaf fails (e.g., state corruption), return None
        // Circuit validation (checkRoot) ensures security regardless
        return [
          context.privateState,
          {
            is_some: false,
            value: emptyMerkleTreePath,
          },
        ];
      }
    },

    wit_getSecretKey(context) {
      return [context.privateState, context.privateState.secretKey];
    },
  });
