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
}
