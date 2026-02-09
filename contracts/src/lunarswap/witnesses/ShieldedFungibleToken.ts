import type { Ledger } from '../artifacts/ShieldedFungibleToken/contract/index.cjs';
import type { EmptyState } from '../types/state';
import type { IShieldedFungibleTokenWitnesses } from './interfaces';

/**
 * @description Represents the private state of the ShieldedFungibleToken module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type ShieldedFungibleTokenPrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the ShieldedFungibleToken module.
 */
export const ShieldedFungibleTokenPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh ShieldedFungibleTokenPrivateState instance (empty for now).
   */
  generate: (): ShieldedFungibleTokenPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for ShieldedFungibleToken module operations.
 * @returns An object implementing the IShieldedFungibleTokenWitnesses interface for ShieldedFungibleTokenPrivateState.
 */
export const ShieldedFungibleTokenWitnesses =
  (): IShieldedFungibleTokenWitnesses<
    Ledger,
    ShieldedFungibleTokenPrivateState
  > => ({
    // Currently no custom witnesses are needed for ShieldedFungibleToken
    // All operations are handled by the underlying ShieldedERC20 module
  });
