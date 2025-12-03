import type {
  CircuitContext,
  CoinPublicKey,
  ContractState,
} from '@midnight-ntwrk/compact-runtime';

// TODO: used in two places contracts/access and contracts/data-structure,
// Should be moved to a separate package in packages/ maybe one package for
// useful test utils and types.
/**
 * Generic interface for mock contract implementations.
 * @template P - The type of the contract's private state.
 * @template L - The type of the contract's ledger (public state).
 */
export interface IContractSimulator<P, L> {
  /** The contract's deployed address. */
  readonly contractAddress: string;

  /** The admin's public key. */
  readonly sender?: CoinPublicKey;

  /** The current circuit context. */
  circuitContext: CircuitContext<P>;

  /** Retrieves the current ledger state. */
  getCurrentPublicState(): L;

  /** Retrieves the current private state. */
  getCurrentPrivateState(): P;

  /** Retrieves the current contract state. */
  getCurrentContractState(): ContractState;
}
