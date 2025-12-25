import type { Witnesses } from '../../../../../artifacts/math/test/mocks/contracts/Uint256.mock/contract/index.js';

/**
 * @description Represents the private state of the MathU256 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Uint256PrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the MathU256 module.
 */
export const Uint256PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh Uint256PrivateState instance (empty for now).
   */
  generate: (): Uint256PrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for MathU256 module operations.
 * @returns An object implementing the Witnesses interface for Uint256PrivateState.
 */
export const Uint256Witnesses = (): Witnesses<Uint256PrivateState> => ({});
