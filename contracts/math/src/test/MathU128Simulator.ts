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
  import type { U128 } from '../artifacts/Index/contract/index.d.cts';
  import {
    Contract,
    type Ledger,
    ledger,
  } from '../artifacts/MockMathU128/contract/index.cjs';
  import type { IContractSimulator } from '../types/test';
  import {
    MathU128ContractPrivateState,
    MathU128Witnesses,
  } from '../witnesses/MathU128Witnesses';
  
  export class MathU128Simulator
    implements IContractSimulator<MathU128ContractPrivateState, Ledger>
  {
    readonly contract: Contract<MathU128ContractPrivateState>;
    readonly contractAddress: string;
    circuitContext: CircuitContext<MathU128ContractPrivateState>;
  
    constructor() {
      this.contract = new Contract<MathU128ContractPrivateState>(
        MathU128Witnesses(),
      );
      const {
        currentPrivateState,
        currentContractState,
        currentZswapLocalState,
      } = this.contract.initialState(
        constructorContext(
          MathU128ContractPrivateState.generate(),
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
  
    public getCurrentPrivateState(): MathU128ContractPrivateState {
      return this.circuitContext.currentPrivateState;
    }
  
    public getCurrentContractState(): ContractState {
      return this.circuitContext.originalState;
    }
  
    public toU128(value: bigint): U128 {
      const result = this.contract.impureCircuits.toU128(
        this.circuitContext,
        value,
      );
      this.circuitContext = result.context;
      return result.result;
    }
  
    public fromU128(value: U128): bigint {
      const result = this.contract.circuits.fromU128(this.circuitContext, value);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public le(a: bigint, b: bigint): boolean {
      const result = this.contract.circuits.le(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public leU128(a: U128, b: U128): boolean {
      const result = this.contract.circuits.leU128(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public gt(a: bigint, b: bigint): boolean {
      const result = this.contract.circuits.gt(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public gtU128(a: U128, b: U128): boolean {
      const result = this.contract.circuits.gtU128(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public add(a: bigint, b: bigint): bigint {
      const result = this.contract.circuits.add(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public addU128(a: U128, b: U128): U128 {
      const result = this.contract.circuits.addU128(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public sub(a: bigint, b: bigint): bigint {
      const result = this.contract.circuits.sub(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public subU128(a: U128, b: U128): U128 {
      const result = this.contract.circuits.subU128(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public mul(a: bigint, b: bigint): bigint {
      const result = this.contract.circuits.mul(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public mulU128(a: U128, b: U128): U128 {
      const result = this.contract.circuits.mulU128(this.circuitContext, a, b);
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
  
    public divU128(dividend: U128, divisor: U128): U128 {
      const result = this.contract.circuits.divU128(
        this.circuitContext,
        dividend,
        divisor,
      );
      this.circuitContext = result.context;
      return result.result;
    }
  
    public rem(dividend: bigint, divisor: bigint): bigint {
      const result = this.contract.circuits.rem(
        this.circuitContext,
        dividend,
        divisor,
      );
      this.circuitContext = result.context;
      return result.result;
    }
  
    public remU128(dividend: U128, divisor: U128): U128 {
      const result = this.contract.circuits.remU128(
        this.circuitContext,
        dividend,
        divisor,
      );
      this.circuitContext = result.context;
      return result.result;
    }
  
    public sqrt(radicand: bigint): bigint {
      const result = this.contract.circuits.sqrt(this.circuitContext, radicand);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public sqrtU128(radicand: U128): bigint {
      const result = this.contract.circuits.sqrtU128(
        this.circuitContext,
        radicand,
      );
      this.circuitContext = result.context;
      return result.result;
    }
  
    public min(a: bigint, b: bigint): bigint {
      const result = this.contract.circuits.min(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public minU128(a: U128, b: U128): U128 {
      const result = this.contract.circuits.minU128(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public max(a: bigint, b: bigint): bigint {
      const result = this.contract.circuits.max(this.circuitContext, a, b);
      this.circuitContext = result.context;
      return result.result;
    }
  
    public maxU128(a: U128, b: U128): U128 {
      const result = this.contract.circuits.maxU128(this.circuitContext, a, b);
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
  
    public isMultipleU128(value: U128, divisor: U128): boolean {
      const result = this.contract.circuits.isMultipleU128(
        this.circuitContext,
        value,
        divisor,
      );
      this.circuitContext = result.context;
      return result.result;
    }
  }
  