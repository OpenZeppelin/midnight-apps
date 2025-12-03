import {
  type CircuitContext,
  type ContractState,
  QueryContext,
  constructorContext,
} from '@midnight-ntwrk/compact-runtime';
import { sampleContractAddress } from '@midnight-ntwrk/zswap';
import type {
  U128,
  U256,
} from '../../../artifacts/math/Index/contract/index.d.cts';
import {
  Contract,
  type Ledger,
  ledger,
} from '../../../artifacts/math/test/Max.mock/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import { type MaxPrivateState, MaxWitnesses } from '../witnesses/Max';

export class MaxSimulator
  implements IContractSimulator<MaxPrivateState, Ledger>
{
  readonly contract: Contract<MaxPrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<MaxPrivateState>;

  constructor() {
    this.contract = new Contract<MaxPrivateState>(MaxWitnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(constructorContext({}, '0'.repeat(64)));
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

  public getCurrentPrivateState(): MaxPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public MAX_UINT8(): bigint {
    const result = this.contract.circuits.MAX_UINT8(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public MAX_UINT16(): bigint {
    const result = this.contract.circuits.MAX_UINT16(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public MAX_UINT32(): bigint {
    const result = this.contract.circuits.MAX_UINT32(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public MAX_UINT64(): bigint {
    const result = this.contract.circuits.MAX_UINT64(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public MAX_UINT128(): bigint {
    const result = this.contract.circuits.MAX_UINT128(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public MAX_FIELD(): bigint {
    const result = this.contract.circuits.MAX_FIELD(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public MAX_UINT254(): U256 {
    const result = this.contract.circuits.MAX_UINT254(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public MAX_U128(): U128 {
    const result = this.contract.circuits.MAX_U128(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public MAX_U256(): U256 {
    const result = this.contract.circuits.MAX_U256(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }
}
