import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { DivResult, DivResultU128, Ledger } from '../artifacts/Index/contract/index.cjs';

export interface IMathWitnesses<P> {
  sqrtLocally(
    context: WitnessContext<Ledger, P>,
    radicand: bigint,
  ): [P, bigint];

  divLocally(
    context: WitnessContext<Ledger, P>,
    dividend: bigint,
    divisor: bigint,
  ): [P, DivResult];
}

export interface IMathU128Witnesses<L, P> {
  sqrtU128Locally(context: WitnessContext<L, P>, radicand: bigint): [P, bigint];

  divU128Locally(
    context: WitnessContext<L, P>,
    dividend: bigint,
    divisor: bigint,
  ): [P, DivResultU128];
}
