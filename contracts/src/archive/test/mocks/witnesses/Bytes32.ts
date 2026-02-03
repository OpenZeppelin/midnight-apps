import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  DivResultU128,
  U256,
} from '@src/artifacts/math/Index/contract/index.d.cts';
import type { Ledger } from '@src/artifacts/math/test/Bytes32.mock/contract/index.js';
import type { EmptyState } from '../types/state.js';

/**
 * @description Represents the private state of the Bytes32 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Bytes32PrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the Bytes32 module.
 */
export const Bytes32PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh Bytes32ContractPrivateState instance (empty for now).
   */
  generate: (): Bytes32PrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for Bytes32 module operations.
 * @returns An object implementing the Bytes32 witnesses interface.
 */
export const Bytes32Witnesses = () => ({
  // Witness functions required by MathU256_fromField
  divUint254Locally(
    context: WitnessContext<Ledger, Bytes32PrivateState>,
    a: bigint,
    b: bigint,
  ): [Bytes32PrivateState, { quotient: U256; remainder: U256 }] {
    const quotient = a / b;
    const remainder = a % b;

    // Convert to U256 struct format
    const quotientLow = quotient & ((1n << 128n) - 1n);
    const quotientHigh = quotient >> 128n;
    const remainderLow = remainder & ((1n << 128n) - 1n);
    const remainderHigh = remainder >> 128n;

    return [
      context.privateState,
      {
        quotient: {
          low: {
            low: quotientLow & ((1n << 64n) - 1n),
            high: quotientLow >> 64n,
          },
          high: {
            low: quotientHigh & ((1n << 64n) - 1n),
            high: quotientHigh >> 64n,
          },
        },
        remainder: {
          low: {
            low: remainderLow & ((1n << 64n) - 1n),
            high: remainderLow >> 64n,
          },
          high: {
            low: remainderHigh & ((1n << 64n) - 1n),
            high: remainderHigh >> 64n,
          },
        },
      },
    ];
  },

  divUint128Locally(
    context: WitnessContext<Ledger, Bytes32PrivateState>,
    a: bigint,
    b: bigint,
  ): [Bytes32PrivateState, DivResultU128] {
    const quotient = a / b;
    const remainder = a % b;

    return [
      context.privateState,
      {
        quotient: {
          low: quotient & ((1n << 64n) - 1n),
          high: quotient >> 64n,
        },
        remainder: {
          low: remainder & ((1n << 64n) - 1n),
          high: remainder >> 64n,
        },
      },
    ];
  },
});
