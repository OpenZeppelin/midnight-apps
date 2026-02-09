import {
  type CircuitContext,
  type CoinPublicKey,
  emptyZswapLocalState,
  QueryContext,
} from '@midnight-ntwrk/compact-runtime';
import type { IContractSimulator } from '../types';

// TODO: that is being used in contracts/access and contracts/data-structure,
// should be moved to unified shared pkg.
/**
 * Prepares a new `CircuitContext` using the given sender and contract.
 *
 * Useful for mocking or updating the circuit context with a custom sender.
 *
 * @template P - The type of the contract's private state.
 * @template L - The type of the contract's ledger (public state).
 * @template C - The specific type of the contract implementing `IContract`.
 *
 * @param contract - The contract instance implementing `MockContract`.
 * @param sender - The public key to set as the sender in the new circuit context.
 * @returns A new `CircuitContext` with the sender and updated context values.
 */
export function useCircuitContextSender<
  P,
  L,
  C extends IContractSimulator<P, L>,
>(contract: C, sender: CoinPublicKey): CircuitContext<P> {
  const currentPrivateState = contract.getCurrentPrivateState();
  const originalState = contract.getCurrentContractState();
  const contractAddress = contract.contractAddress;

  return {
    originalState,
    currentPrivateState,
    transactionContext: new QueryContext(originalState.data, contractAddress),
    currentZswapLocalState: emptyZswapLocalState(sender),
  };
}
