import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type {
  DivResult,
  DivResultU256,
} from '../artifacts/Index/contract/index.cjs';

export interface IMathWitnesses<L, P> {
  sqrtLocally(context: WitnessContext<L, P>, radicand: bigint): [P, bigint];

  divLocally(
    context: WitnessContext<L, P>,
    dividend: bigint,
    divisor: bigint,
  ): [P, DivResult];
}

export interface IMathU256Witnesses<L, P> {
  sqrtU256Locally(context: WitnessContext<L, P>, radicand: bigint): [P, bigint];

  divU256Locally(
    context: WitnessContext<L, P>,
    dividend: bigint,
    divisor: bigint,
  ): [P, DivResultU256];

  divLocally(
    context: WitnessContext<L, P>,
    dividend: bigint,
    divisor: bigint,
  ): [P, DivResult];
}
