import * as crypto from 'node:crypto';
import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import * as Contract from '..//artifacts/MockAccessControl/contract/index.cjs';
import type { RoleValue } from '../types';
import { maybeFromNullable } from '../utils';
import { emptyMerkleTreePath } from '../utils/test';

export type AccessContractPrivateState = {
  secretKey: Buffer;
  roles: Record<string, RoleValue>;
};

// Operations on PrivateState
export const AccessContractPrivateState = {
  generate: (): AccessContractPrivateState => {
    return { secretKey: crypto.getRandomValues(Buffer.alloc(32)), roles: {} };
  },

  updateRole: (
    state: AccessContractPrivateState,
    userRoleCommit: Uint8Array,
    role: Contract.AccessControl_Role,
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

  getRole: (
    state: AccessContractPrivateState,
    user: Contract.ZswapCoinPublicKey,
  ): Contract.AccessControl_Role => {
    const userKey = Buffer.from(user.bytes).toString('hex');
    return state.roles[userKey]?.role ?? Contract.AccessControl_Role.None;
  },

  updatePath: (
    state: AccessContractPrivateState,
    userRoleCommit: Uint8Array,
    path: Contract.MerkleTreePath<Uint8Array>,
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

export const AccessControlWitnesses =
  (): Contract.Witnesses<AccessContractPrivateState> => ({
    updateRole(
      context: WitnessContext<Contract.Ledger, AccessContractPrivateState>,
      userRoleCommit: Uint8Array,
      role: Contract.AccessControl_Role,
      index: bigint,
    ): [AccessContractPrivateState, []] {
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
    getRolePath(
      context: WitnessContext<Contract.Ledger, AccessContractPrivateState>,
      userRoleCommit: Uint8Array,
    ): [
      AccessContractPrivateState,
      Contract.Maybe<Contract.MerkleTreePath<Uint8Array>>,
    ] {
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
        maybeFromNullable(
          context.ledger.accessControlRoleCommits.pathForLeaf(
            context.privateState.roles[userRoleCommitString].index,
            userRoleCommit,
          ),
          emptyMerkleTreePath,
        ),
      ];
    },
    getSecretKey(
      context: WitnessContext<Contract.Ledger, AccessContractPrivateState>,
    ): [AccessContractPrivateState, Uint8Array] {
      return [context.privateState, context.privateState.secretKey];
    },
  });
