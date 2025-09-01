import {
  type CircuitContext,
  type CoinPublicKey,
  type ContractState,
  QueryContext,
  constructorContext,
  sampleContractAddress,
} from '@midnight-ntwrk/compact-runtime';
import {
  type Ledger,
  Contract as MockQueue,
  ledger,
} from '../artifacts/Queue.mock/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import {
  QueueContractPrivateState,
  QueueWitnesses,
} from '../witnesses/QueueWitnesses';

export class QueueContractSimulator
  implements IContractSimulator<QueueContractPrivateState, Ledger>
{
  readonly contract: MockQueue<QueueContractPrivateState>;
  readonly contractAddress: string;
  readonly sender: CoinPublicKey;

  circuitContext: CircuitContext<QueueContractPrivateState>;

  constructor(sender: CoinPublicKey) {
    this.contract = new MockQueue<QueueContractPrivateState>(QueueWitnesses);
    this.sender = sender;
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(QueueContractPrivateState.generate(), this.sender),
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

  public getCurrentPublicState(): Ledger {
    return ledger(this.circuitContext.transactionContext.state);
  }

  public getCurrentPrivateState(): QueueContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public enqueue(item: bigint): Ledger {
    const result = this.contract.impureCircuits.enqueue(
      this.circuitContext,
      item,
    );
    this.circuitContext = result.context;
    return ledger(this.circuitContext.transactionContext.state);
  }

  public dequeue(): [Ledger, bigint] {
    const result = this.contract.impureCircuits.dequeue(
      this.circuitContext,
    );
    this.circuitContext = result.context;
    // Handle the Maybe<T> return type - if it's none, return 0, otherwise return the value
    const value = result.result.is_some ? result.result.value : 0n;
    return [ledger(this.circuitContext.transactionContext.state), value];
  }

  public isEmpty(): boolean {
    return this.contract.impureCircuits.isEmpty(this.circuitContext).result;
  }
}
