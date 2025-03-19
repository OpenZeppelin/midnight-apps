import type * as Contract from '../artifacts/role/contract/index.cjs';

export type RoleValue = {
  role: Contract.Role;
  commitment: Uint8Array;
  path?: Contract.MerkleTreePath<Uint8Array>;
};
