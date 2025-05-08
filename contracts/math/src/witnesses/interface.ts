import type { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import type { DivResult, Ledger } from '../artifacts/Index/contract/index.cjs';

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
