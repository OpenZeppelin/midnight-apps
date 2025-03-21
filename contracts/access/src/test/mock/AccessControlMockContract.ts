import {
  type CircuitContext,
  type CoinPublicKey,
  type ContractState,
  QueryContext,
  constructorContext,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/compact-runtime';
import { sampleContractAddress } from '@midnight-ntwrk/zswap';
// TODO add those two imports in one line
import { Contract as TestAccessControlContract } from '../../artifacts/TestAccessControl/contract/index.cjs';
import * as Contract from '../../artifacts/TestAccessControl/contract/index.cjs';
import {
  AccessContractPrivateState,
  AccessControlWitnesses,
} from '../../witnesses';

export class TestAccessControlMockContract {
  readonly contract: TestAccessControlContract<AccessContractPrivateState>;
  readonly contractAddress: string;
  readonly admin: CoinPublicKey;

  circuitContext: CircuitContext<AccessContractPrivateState>;

  constructor(admin: CoinPublicKey) {
    this.contract = new TestAccessControlContract<AccessContractPrivateState>(
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

  public getCurrentLedger(): Contract.Ledger {
    return Contract.ledger(this.circuitContext.transactionContext.state);
  }

  public getCurrentPrivateState(): AccessContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public testGrantRole(user: Contract.ZswapCoinPublicKey, role: Contract.Role) {
    this.contract.impureCircuits.testGrantRole(this.circuitContext, user, role);
  }
}
