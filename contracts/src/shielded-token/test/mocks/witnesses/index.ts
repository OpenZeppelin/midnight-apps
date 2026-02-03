import type { Witnesses } from '@src/artifacts/shielded-token/ShieldedFungibleToken/contract/index.js';

// This is how we type an empty object.
export type ShieldedFungibleTokenPrivateState = Record<string, never>;
export const ShieldedFungibleTokenWitnesses: Witnesses<ShieldedFungibleTokenPrivateState> =
  {};
