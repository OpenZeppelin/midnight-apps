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
 * @template PrivateState - The type of the contract's private state.
 * @template L - The type of the contract's ledger (public state).
 */
export interface IContractSimulator<PrivateState, Ledger> {
  /** The contract's deployed address. */
  readonly contractAddress: string;

  /** The admin's public key. */
  readonly sender: CoinPublicKey;

  /** The current circuit context. */
  circuitContext: CircuitContext<PrivateState>;

  /** Retrieves the current ledger state. */
  getCurrentPublicState(): Ledger;

  /** Retrieves the current private state. */
  getCurrentPrivateState(): PrivateState;

  /** Retrieves the current contract state. */
  getCurrentContractState(): ContractState;
}
