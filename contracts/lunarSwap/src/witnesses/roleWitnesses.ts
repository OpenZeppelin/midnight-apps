import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import * as Contract from '../artifacts/role/contract/index.cjs';
import type { RoleValue } from '../types';

export type RoleContractPrivateState = {
  roles: Record<string, RoleValue>;
};

// Operations on PrivateState
export const RoleContractPrivateState = {
  generate: (): RoleContractPrivateState => {
    return { roles: {} };
  },

  updateRole: (
    state: RoleContractPrivateState,
    user: Contract.ZswapCoinPublicKey,
    role: Contract.Role,
    commitment: Uint8Array,
  ): RoleContractPrivateState => {
    // Covert user Bytes<32> to string
    const userKey = Buffer.from(user.bytes).toString('hex');
    return {
      ...state,
      roles: {
        ...state.roles,
        [userKey]: {
          role,
          commitment,
          path: state.roles[userKey]?.path,
        },
      },
    };
  },

  getRole: (
    state: RoleContractPrivateState,
    user: Contract.ZswapCoinPublicKey,
  ): Contract.Role => {
    const userKey = Buffer.from(user.bytes).toString('hex');
    return state.roles[userKey]?.role ?? Contract.Role.None;
  },

  getRolePath: (
    state: RoleContractPrivateState,
    user: Contract.ZswapCoinPublicKey,
  ): Contract.Maybe<Contract.MerkleTreePath<Uint8Array>> => {
    const userKey = Buffer.from(user.bytes).toString('hex');
    const path = state.roles[userKey]?.path;
    return path
      ? { is_some: true, value: path }
      : { is_some: false, value: null as any };
  },

  updatePath: (
    state: RoleContractPrivateState,
    user: Contract.ZswapCoinPublicKey,
    path: Contract.MerkleTreePath<Uint8Array>,
  ): RoleContractPrivateState => {
    const userkey = Buffer.from(user.bytes).toString('hex');
    const existing = state.roles[userkey];
    if (!existing) return state;
    return {
      ...state,
      roles: {
        ...state.roles,
        [userkey]: { ...existing, path },
      },
    };
  },
};

export const RoleWitnesses =
  (): Contract.Witnesses<RoleContractPrivateState> => ({
    getRole(
      context: WitnessContext<Contract.Ledger, RoleContractPrivateState>,
      user: Contract.ZswapCoinPublicKey,
    ): [RoleContractPrivateState, Contract.Role] {
      return [
        context.privateState,
        RoleContractPrivateState.getRole(context.privateState, user),
      ];
    },
    updateRole(
      context: WitnessContext<Contract.Ledger, RoleContractPrivateState>,
      userRoleCommit: Uint8Array,
      user: Contract.ZswapCoinPublicKey,
      role: Contract.Role,
    ): [RoleContractPrivateState, []] {
      return [
        RoleContractPrivateState.updateRole(
          context.privateState,
          user,
          role,
          userRoleCommit,
        ),
        [],
      ];
    },
    // getRolePath(context: WitnessContext<Contract.Ledger, RoleContractPrivateState>, user: Contract.ZswapCoinPublicKey): [RoleContractPrivateState, Contract.Maybe<Contract.MerkleTreePath<Uint8Array>>] {
    //     const path = RoleContractPrivateState.getRolePath(context.privateState, user);
    // }
  });
