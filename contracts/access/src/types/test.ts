import type {
  CircuitContext,
  CoinPublicKey,
  ContractState,
} from '@midnight-ntwrk/compact-runtime';

/**
 * Generic interface for mock contract implementations.
 * @template PrivateState - The type of the contract's private state.
 * @template L - The type of the contract's ledger (public state).
 */
export interface MockContract<PrivateState, Ledger> {
  /** The contract's deployed address. */
  readonly contractAddress: string;

  /** The admin's public key. */
  readonly admin: CoinPublicKey;

  /** The current circuit context. */
  circuitContext: CircuitContext<PrivateState>;

  /** Retrieves the current ledger state. */
  getCurrentPublicState(): Ledger;

  /** Retrieves the current private state. */
  getCurrentPrivateState(): PrivateState;

  /** Retrieves the current contract state. */
  getCurrentContractState(): ContractState;
}
