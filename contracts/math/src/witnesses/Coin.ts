import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  DivResultU128,
  DivResultU256,
  U128,
} from '../artifacts/Index/contract/index.cjs';
import type { Ledger } from '../artifacts/MockCoin/contract/index.d.cts';
import type { EmptyState } from '../types/state';
import { sqrtBigint } from '../utils/sqrtBigint';
import type { ICoinWitnesses } from './interfaces';

/**
 * @description Represents the private state of the Coin module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type CoinContractPrivateState = EmptyState;

/**
 * @description Utility object for managing the private state of the Coin module.
 */
export const CoinContractPrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh CoinContractPrivateState instance (empty for now).
   */
  generate: (): CoinContractPrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for Coin module operations.
 * @returns An object implementing the ICoinWitnesses interface.
 */
export const CoinWitnesses = (): ICoinWitnesses<
  Ledger,
  CoinContractPrivateState
> => ({
  /**
   * Performs division of two bigint values locally and returns the result as DivResultU256.
   * @param context - The witness context containing ledger and private state.
   * @param a_0 - The dividend.
   * @param b_0 - The divisor.
   * @returns A tuple of the private state and the division result.
   */
  divUint254Locally(
    context: WitnessContext<Ledger, CoinContractPrivateState>,
    a_0: bigint,
    b_0: bigint,
  ): [CoinContractPrivateState, DivResultU256] {
    if (b_0 === 0n) {
      throw new Error('Division by zero');
    }

    const quotient = a_0 / b_0;
    const remainder = a_0 % b_0;

    // Convert to U256 format (simplified - in practice this would handle the full 256-bit arithmetic)
    const quotientU256: DivResultU256 = {
      quotient: {
        low: {
          low: quotient & 0xffffffffffffffffn,
          high: (quotient >> 64n) & 0xffffffffffffffffn,
        },
        high: { low: 0n, high: 0n },
      },
      remainder: {
        low: {
          low: remainder & 0xffffffffffffffffn,
          high: (remainder >> 64n) & 0xffffffffffffffffn,
        },
        high: { low: 0n, high: 0n },
      },
    };

    return [context.privateState, quotientU256];
  },

  /**
   * Performs division of two U128 values locally and returns the result as DivResultU128.
   * @param context - The witness context containing ledger and private state.
   * @param a_0 - The dividend.
   * @param b_0 - The divisor.
   * @returns A tuple of the private state and the division result.
   */
  divU128Locally(
    context: WitnessContext<Ledger, CoinContractPrivateState>,
    a_0: U128,
    b_0: U128,
  ): [CoinContractPrivateState, DivResultU128] {
    // Convert U128 to bigint for calculation
    const aBig = (a_0.high << 64n) | a_0.low;
    const bBig = (b_0.high << 64n) | b_0.low;

    if (bBig === 0n) {
      throw new Error('Division by zero');
    }

    const quotient = aBig / bBig;
    const remainder = aBig % bBig;

    const quotientU128: DivResultU128 = {
      quotient: {
        low: quotient & 0xffffffffffffffffn,
        high: (quotient >> 64n) & 0xffffffffffffffffn,
      },
      remainder: {
        low: remainder & 0xffffffffffffffffn,
        high: (remainder >> 64n) & 0xffffffffffffffffn,
      },
    };

    return [context.privateState, quotientU128];
  },

  /**
   * Performs division of two bigint values locally and returns the result as DivResultU128.
   * @param context - The witness context containing ledger and private state.
   * @param a_0 - The dividend.
   * @param b_0 - The divisor.
   * @returns A tuple of the private state and the division result.
   */
  divUint128Locally(
    context: WitnessContext<Ledger, CoinContractPrivateState>,
    a_0: bigint,
    b_0: bigint,
  ): [CoinContractPrivateState, DivResultU128] {
    if (b_0 === 0n) {
      throw new Error('Division by zero');
    }

    const quotient = a_0 / b_0;
    const remainder = a_0 % b_0;

    const quotientU128: DivResultU128 = {
      quotient: {
        low: quotient & 0xffffffffffffffffn,
        high: (quotient >> 64n) & 0xffffffffffffffffn,
      },
      remainder: {
        low: remainder & 0xffffffffffffffffn,
        high: (remainder >> 64n) & 0xffffffffffffffffn,
      },
    };

    return [context.privateState, quotientU128];
  },

  /**
   * Calculates the square root of a U128 value locally.
   * @param context - The witness context containing ledger and private state.
   * @param radicand_0 - The value to calculate the square root of.
   * @returns A tuple of the private state and the square root result.
   */
  sqrtU128Locally(
    context: WitnessContext<Ledger, CoinContractPrivateState>,
    radicand_0: U128,
  ): [CoinContractPrivateState, bigint] {
    // Convert U128 to bigint
    const radicandBigInt =
      (BigInt(radicand_0.high) << 64n) + BigInt(radicand_0.low);

    // Compute square root using sqrtBigint, ensuring result fits in Uint<64>
    const root = sqrtBigint(radicandBigInt);
    return [context.privateState, root];
  },
});
