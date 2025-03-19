import {
  type CircuitContext,
  type CoinPublicKey,
  QueryContext,
  constructorContext,
  encodeCoinPublicKey,
} from '@midnight-ntwrk/compact-runtime';
import {
  sampleCoinPublicKey,
  sampleContractAddress,
} from '@midnight-ntwrk/zswap';
import { Contract as RoleContract } from '../../artifacts/role/contract/index.cjs';
import * as Contract from '../../artifacts/role/contract/index.cjs';
import {
  RoleContractPrivateState,
  RoleWitnesses,
} from '../../witnesses/roleWitnesses';

export class RoleContractMock {
  readonly contract: RoleContract<RoleContractPrivateState>;
  readonly contractAddress: string;
  readonly admin: CoinPublicKey;
  circuitContext: CircuitContext<RoleContractPrivateState>;

  constructor(admin: CoinPublicKey) {
    this.contract = new RoleContract<RoleContractPrivateState>(RoleWitnesses());
    this.admin = admin;
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        RoleContractPrivateState.generate(),
        sampleCoinPublicKey(),
      ),
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

  public getLedger(): Contract.Ledger {
    return Contract.ledger(this.circuitContext.transactionContext.state);
  }

  public getPrivateState(): RoleContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public addRole(
    user: Contract.ZswapCoinPublicKey,
    role: Contract.Role,
    coin: Contract.CoinInfo,
  ) {
    this.contract.impureCircuits.addRole(this.circuitContext, user, role, coin);
  }
}
