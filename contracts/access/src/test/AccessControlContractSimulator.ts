import {
  type CircuitContext,
  type CoinPublicKey,
  type ContractState,
  QueryContext,
  constructorContext,
  emptyZswapLocalState,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/compact-runtime';
import { sampleContractAddress } from '@midnight-ntwrk/zswap';
import type { ZswapCoinPublicKey } from '@openzeppelin-midnight-apps/compact-std';
import type { AccessControl_Role } from '../artifacts/Index/contract/index.cjs';
import {
  type Ledger,
  Contract as MockAccessControl,
  ledger,
} from '../artifacts/MockAccessControl/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import {
  AccessContractPrivateState,
  AccessControlWitnesses,
} from '../witnesses/AccessControlWitnesses';

/**
 * @description A simulator implementation of an access control contract for testing purposes.
 * @template P - The private state type, fixed to AccessContractPrivateState.
 * @template L - The ledger type, fixed to Contract.Ledger.
 */
export class AccessControlContractSimulator
  implements IContractSimulator<AccessContractPrivateState, Ledger>
{
  /** @description The underlying contract instance managing access control logic. */
  readonly contract: MockAccessControl<AccessContractPrivateState>;

  /** @description The deployed address of the contract. */
  readonly contractAddress: string;

  /** @description The public key of the contract's admin. */
  readonly admin: CoinPublicKey;

  /** @description The current circuit context, updated by contract operations. */
  circuitContext: CircuitContext<AccessContractPrivateState>;

  /**
   * @description Initializes the mock access control contract with an admin key.
   * @param admin - The public key of the admin who initializes the contract.
   */
  constructor(admin: CoinPublicKey) {
    this.contract = new MockAccessControl<AccessContractPrivateState>(
      AccessControlWitnesses(),
    );
    this.admin = admin;
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(AccessContractPrivateState.generate(), this.admin),
      {
        bytes: encodeCoinPublicKey(this.admin),
      },
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      originalState: currentContractState,
      transactionContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
    this.contractAddress = this.circuitContext.transactionContext.address;
  }

  /**
   * @description Retrieves the current public ledger state of the contract.
   * @returns The ledger state as defined by the contract.
   */
  public getCurrentPublicState(): Ledger {
    return ledger(this.circuitContext.transactionContext.state);
  }

  /**
   * @description Retrieves the current private state of the contract.
   * @returns The private state of type AccessContractPrivateState.
   */
  public getCurrentPrivateState(): AccessContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  /**
   * @description Retrieves the current contract state.
   * @returns The contract state object.
   */
  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  /**
   * @description Grants a role to a user, updating the circuit context.
   * @param user - The public key of the user to grant the role to.
   * @param role - The role to grant (e.g., Admin, Lp, Trader, None).
   * @param sender - Optional sender public key to set the local Zswap state.
   * @returns The updated circuit context after granting the role.
   */
  public grantRole(
    user: ZswapCoinPublicKey,
    role: AccessControl_Role,
    sender?: CoinPublicKey,
  ): CircuitContext<AccessContractPrivateState> {
    this.circuitContext = this.contract.impureCircuits.testGrantRole(
      {
        ...this.circuitContext,
        currentZswapLocalState: sender
          ? emptyZswapLocalState(sender)
          : this.circuitContext.currentZswapLocalState,
      },
      user,
      role,
    ).context;
    return this.circuitContext;
  }
}
