import type { Witnesses } from '@artifacts/lunarswap/test/mocks/contracts/LunarswapFactory.mock/contract/index.js';

/**
 * @description Represents the private state of the LunarswapFactory module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type LunarswapFactoryPrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the LunarswapFactory module.
 */
export const LunarswapFactoryPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh LunarswapFactoryPrivateState instance (empty for now).
   */
  generate: (): LunarswapFactoryPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for LunarswapFactory module operations.
 * @remarks LunarswapFactory doesn't require specific witnesses as it primarily manages state.
 */
export const LunarswapFactoryWitnesses =
  (): Witnesses<LunarswapFactoryPrivateState> => ({});
