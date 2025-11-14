import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { Ledger } from '../artifacts/SchnorrBLS12381.mock/contract/index.cjs';
import type { EmptyState } from '../types/state';

/**
 * @description Represents the private state of the SchnorrBLS12381 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type SchnorrBLS12381PrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the SchnorrBLS12381 module.
 */
export const SchnorrBLS12381PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh SchnorrBLS12381PrivateState instance (empty for now).
   */
  generate: (): SchnorrBLS12381PrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for SchnorrBLS12381 module operations.
 * @returns An object implementing the SchnorrBLS12381 witnesses interface.
 */
export const SchnorrBLS12381Witnesses = () => ({
  // Schnorr signatures are pure cryptographic operations that don't require witnesses
});

