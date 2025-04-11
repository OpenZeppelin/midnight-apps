import {
  type CircuitContext,
  type ContractState,
  QueryContext,
  constructorContext,
} from '@midnight-ntwrk/compact-runtime';
import {
  sampleCoinPublicKey,
  sampleContractAddress,
} from '@midnight-ntwrk/zswap';
import {
  Contract,
  type Ledger,
  ledger,
} from '../artifacts/MockMath/contract/index.cjs';
import type { IContractSimulator } from '../types';
import { MathContractPrivateState, MathWitnesses } from '../witnesses';

export class MathContractSimulator
  implements IContractSimulator<MathContractPrivateState, Ledger>
{
  readonly contract: Contract<MathContractPrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<MathContractPrivateState>;

  constructor() {
    this.contract = new Contract<MathContractPrivateState>(MathWitnesses());
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        MathContractPrivateState.generate(),
        sampleCoinPublicKey(),
      ),
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
    // Call initialize to set ledger constants
    const initResult = this.contract.circuits.initialize(this.circuitContext);
    this.circuitContext = initResult.context;
    this.contractAddress = this.circuitContext.transactionContext.address;
  }

  public getCurrentPublicState(): Ledger {
    return ledger(this.circuitContext.transactionContext.state);
  }

  public getCurrentPrivateState(): MathContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public add(addend: bigint, augend: bigint): bigint {
    const result = this.contract.circuits.add(
      this.circuitContext,
      addend,
      augend,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public sub(minuend: bigint, subtrahend: bigint): bigint {
    const result = this.contract.circuits.sub(
      this.circuitContext,
      minuend,
      subtrahend,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public mul(multiplicand: bigint, multiplier: bigint): bigint {
    const result = this.contract.circuits.mul(
      this.circuitContext,
      multiplicand,
      multiplier,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public div(dividend: bigint, divisor: bigint): bigint {
    const result = this.contract.circuits.div(
      this.circuitContext,
      dividend,
      divisor,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public remainder(dividend: bigint, divisor: bigint): bigint {
    const result = this.contract.circuits.remainder(
      this.circuitContext,
      dividend,
      divisor,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrt(radical: bigint): bigint {
    const result = this.contract.circuits.sqrt(this.circuitContext, radical);
    this.circuitContext = result.context;
    return result.result;
  }

  public isMultiple(value: bigint, divisor: bigint): boolean {
    const result = this.contract.circuits.isMultiple(
      this.circuitContext,
      value,
      divisor,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public min(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.min(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public max(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.max(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }
}
