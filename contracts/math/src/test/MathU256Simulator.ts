// MathU256Simulator.ts
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
import type {
  DivResultU256,
  U256,
} from '../artifacts/Index/contract/index.d.cts';
import {
  Contract,
  type Ledger,
  ledger,
} from '../artifacts/MockMathU256/contract/index.cjs'; // Adjust path based on your project
import type { IContractSimulator } from '../types/test';
import {
  MathU256ContractPrivateState,
  MathU256Witnesses,
} from '../witnesses/MathU256';

export class MathU256Simulator
  implements IContractSimulator<MathU256ContractPrivateState, Ledger>
{
  readonly contract: Contract<MathU256ContractPrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<MathU256ContractPrivateState>;

  constructor() {
    this.contract = new Contract<MathU256ContractPrivateState>(
      MathU256Witnesses(),
    );
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        MathU256ContractPrivateState.generate(),
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
    this.contractAddress = this.circuitContext.transactionContext.address;
  }

  public getCurrentPublicState(): Ledger {
    return ledger(this.circuitContext.transactionContext.state);
  }

  public getCurrentPrivateState(): MathU256ContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public isZero(a: U256): boolean {
    const result = this.contract.circuits.isZero(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }

  public ZERO_U256(): U256 {
    const result = this.contract.circuits.ZERO_U256(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public MAX_U256(): U256 {
    const result = this.contract.circuits.MAX_U256(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public eq(a: U256, b: U256): boolean {
    const result = this.contract.circuits.eq(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public le(a: U256, b: U256): boolean {
    const result = this.contract.circuits.le(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gt(a: U256, b: U256): boolean {
    const result = this.contract.circuits.gt(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public add(a: U256, b: U256): U256 {
    const result = this.contract.circuits.add(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sub(a: U256, b: U256): U256 {
    const result = this.contract.circuits.sub(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mul(a: U256, b: U256): U256 {
    const result = this.contract.circuits.mul(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public div(a: U256, b: U256): U256 {
    const result = this.contract.circuits.div(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public rem(a: U256, b: U256): U256 {
    const result = this.contract.circuits.rem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divRem(a: U256, b: U256): DivResultU256 {
    const result = this.contract.circuits.divRem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrt(radicand: U256): bigint {
    const result = this.contract.circuits.sqrt(this.circuitContext, radicand);
    this.circuitContext = result.context;
    return result.result;
  }

  public min(a: U256, b: U256): U256 {
    const result = this.contract.circuits.min(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public max(a: U256, b: U256): U256 {
    const result = this.contract.circuits.max(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public isMultiple(value: U256, divisor: U256): boolean {
    const result = this.contract.circuits.isMultiple(
      this.circuitContext,
      value,
      divisor,
    );
    this.circuitContext = result.context;
    return result.result;
  }
}
