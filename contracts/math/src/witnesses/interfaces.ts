import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  DivResultU64,
  DivResultU128,
  DivResultU256,
  Ledger,
  U128,
  U256,
} from '../artifacts/Index/contract/index.cjs';

export interface IMathU64Witnesses<P> {
  sqrtU64Locally(
    context: WitnessContext<Ledger, P>,
    radicand: bigint,
  ): [P, bigint];

  divU64Locally(
    context: WitnessContext<Ledger, P>,
    a: bigint,
    b: bigint,
  ): [P, DivResultU64];
}

export interface IMathU128Witnesses<L, P> {
  sqrtU128Locally(context: WitnessContext<L, P>, radicand: U128): [P, bigint];

  divU128Locally(
    context: WitnessContext<L, P>,
    a: U128,
    b: U128,
  ): [P, DivResultU128];

  divUint128Locally(
    context: WitnessContext<L, P>,
    a: bigint,
    b: bigint,
  ): [P, DivResultU128];
}

export interface IMathU256Witnesses<L, P> {
  sqrtU256Locally(context: WitnessContext<L, P>, radicand: U256): [P, bigint];

  divU256Locally(
    context: WitnessContext<L, P>,
    a: U256,
    b: U256,
  ): [P, DivResultU256];

  divU128Locally(
    context: WitnessContext<L, P>,
    a: U128,
    b: U128,
  ): [P, DivResultU128];

  divUint128Locally(
    context: WitnessContext<L, P>,
    a: bigint,
    b: bigint,
  ): [P, DivResultU128];

  divUint254Locally(
    context: WitnessContext<L, P>,
    a: bigint,
    b: bigint,
  ): [P, DivResultU256];
}

/**
 * @description Interface defining the witness methods for Coin operations.
 * Matches the structure expected by MockCoin artifacts.
 * @template L - The ledger type.
 * @template P - The private state type.
 */
export interface ICoinWitnesses<L, P> {
  /**
   * Performs division of two bigint values locally and returns the result as DivResultU256.
   * @param context - The witness context containing ledger and private state.
   * @param a_0 - The dividend.
   * @param b_0 - The divisor.
   * @returns A tuple of the private state and the division result.
   */
  divUint254Locally(
    context: WitnessContext<L, P>,
    a_0: bigint,
    b_0: bigint,
  ): [P, DivResultU256];

  /**
   * Performs division of two U128 values locally and returns the result as DivResultU128.
   * @param context - The witness context containing ledger and private state.
   * @param a_0 - The dividend.
   * @param b_0 - The divisor.
   * @returns A tuple of the private state and the division result.
   */
  divU128Locally(
    context: WitnessContext<L, P>,
    a_0: U128,
    b_0: U128,
  ): [P, DivResultU128];

  /**
   * Performs division of two bigint values locally and returns the result as DivResultU128.
   * @param context - The witness context containing ledger and private state.
   * @param a_0 - The dividend.
   * @param b_0 - The divisor.
   * @returns A tuple of the private state and the division result.
   */
  divUint128Locally(
    context: WitnessContext<L, P>,
    a_0: bigint,
    b_0: bigint,
  ): [P, DivResultU128];

  /**
   * Calculates the square root of a U128 value locally.
   * @param context - The witness context containing ledger and private state.
   * @param radicand_0 - The value to calculate the square root of.
   * @returns A tuple of the private state and the square root result.
   */
  sqrtU128Locally(context: WitnessContext<L, P>, radicand_0: U128): [P, bigint];
}

/**
 * @description Interface defining the witness methods for QualifiedCoin operations.
 * Matches the structure expected by MockQualifiedCoin artifacts.
 * @template L - The ledger type.
 * @template P - The private state type.
 */
export interface IQualifiedCoinWitnesses<L, P> {
  /**
   * Performs division of two bigint values locally and returns the result as DivResultU256.
   * @param context - The witness context containing ledger and private state.
   * @param a_0 - The dividend.
   * @param b_0 - The divisor.
   * @returns A tuple of the private state and the division result.
   */
  divUint254Locally(
    context: WitnessContext<L, P>,
    a_0: bigint,
    b_0: bigint,
  ): [P, DivResultU256];

  /**
   * Performs division of two U128 values locally and returns the result as DivResultU128.
   * @param context - The witness context containing ledger and private state.
   * @param a_0 - The dividend.
   * @param b_0 - The divisor.
   * @returns A tuple of the private state and the division result.
   */
  divU128Locally(
    context: WitnessContext<L, P>,
    a_0: U128,
    b_0: U128,
  ): [P, DivResultU128];

  /**
   * Performs division of two bigint values locally and returns the result as DivResultU128.
   * @param context - The witness context containing ledger and private state.
   * @param a_0 - The dividend.
   * @param b_0 - The divisor.
   * @returns A tuple of the private state and the division result.
   */
  divUint128Locally(
    context: WitnessContext<L, P>,
    a_0: bigint,
    b_0: bigint,
  ): [P, DivResultU128];

  /**
   * Calculates the square root of a U128 value locally.
   * @param context - The witness context containing ledger and private state.
   * @param radicand_0 - The value to calculate the square root of.
   * @returns A tuple of the private state and the square root result.
   */
  sqrtU128Locally(context: WitnessContext<L, P>, radicand_0: U128): [P, bigint];
}
