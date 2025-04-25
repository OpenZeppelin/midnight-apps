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
import type { U256 } from '../artifacts/Index/contract/index.cjs';
import {
  Contract,
  type Ledger,
  ledger,
} from '../artifacts/MockMathU256/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import {
  MathU256ContractPrivateState,
  MathU256Witnesses,
} from '../witnesses/MathU256';

/**
 * @description Simulator for the MathU256 contract, providing methods to interact with its circuit functions.
 */
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
    // Call initialize to set ledger constants
    const initResult = this.contract.circuits.initialize(this.circuitContext);
    this.circuitContext = initResult.context;
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

  public toU256(value: bigint): { low: bigint; high: bigint } {
    const result = this.contract.circuits.toU256(this.circuitContext, value);
    this.circuitContext = result.context;
    return { low: result.result.low, high: result.result.high };
  }

  public fromU256(value: { low: bigint; high: bigint }): bigint {
    const u256: U256 = { low: value.low, high: value.high };
    const result = this.contract.circuits.fromU256(this.circuitContext, u256);
    this.circuitContext = result.context;
    return result.result;
  }

  public add(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.add(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public addU256(
    a: { low: bigint; high: bigint },
    b: { low: bigint; high: bigint },
  ): { low: bigint; high: bigint } {
    const aU256: U256 = { low: a.low, high: a.high };
    const bU256: U256 = { low: b.low, high: b.high };
    const result = this.contract.circuits.addU256(
      this.circuitContext,
      aU256,
      bU256,
    );
    this.circuitContext = result.context;
    return { low: result.result.low, high: result.result.high };
  }

  public sub(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.sub(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public subU256(
    a: { low: bigint; high: bigint },
    b: { low: bigint; high: bigint },
  ): { low: bigint; high: bigint } {
    const aU256: U256 = { low: a.low, high: a.high };
    const bU256: U256 = { low: b.low, high: b.high };
    const result = this.contract.circuits.subU256(
      this.circuitContext,
      aU256,
      bU256,
    );
    this.circuitContext = result.context;
    return { low: result.result.low, high: result.result.high };
  }

  public mul(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.mul(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mulU256(
    a: { low: bigint; high: bigint },
    b: { low: bigint; high: bigint },
  ): { low: bigint; high: bigint } {
    const aU256: U256 = { low: a.low, high: a.high };
    const bU256: U256 = { low: b.low, high: b.high };
    const result = this.contract.circuits.mulU256(
      this.circuitContext,
      aU256,
      bU256,
    );
    this.circuitContext = result.context;
    return { low: result.result.low, high: result.result.high };
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

  public divU256(
    dividend: { low: bigint; high: bigint },
    divisor: { low: bigint; high: bigint },
  ): { low: bigint; high: bigint } {
    const dividendU256: U256 = { low: dividend.low, high: dividend.high };
    const divisorU256: U256 = { low: divisor.low, high: divisor.high };
    const result = this.contract.circuits.divU256(
      this.circuitContext,
      dividendU256,
      divisorU256,
    );
    this.circuitContext = result.context;
    return { low: result.result.low, high: result.result.high };
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

  public remU256(
    dividend: { low: bigint; high: bigint },
    divisor: { low: bigint; high: bigint },
  ): { low: bigint; high: bigint } {
    const dividendU256: U256 = { low: dividend.low, high: dividend.high };
    const divisorU256: U256 = { low: divisor.low, high: divisor.high };
    const result = this.contract.circuits.remU256(
      this.circuitContext,
      dividendU256,
      divisorU256,
    );
    this.circuitContext = result.context;
    return { low: result.result.low, high: result.result.high };
  }

  public sqrt(radicand: bigint): bigint {
    const result = this.contract.circuits.sqrt(this.circuitContext, radicand);
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrtU256(radicand: { low: bigint; high: bigint }): bigint {
    const radicandU256: U256 = { low: radicand.low, high: radicand.high };
    const result = this.contract.circuits.sqrtU256(
      this.circuitContext,
      radicandU256,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public lessThan(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.lessThan(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lessThanU256(
    aU256: { low: bigint; high: bigint },
    bU256: { low: bigint; high: bigint },
  ): boolean {
    const result = this.contract.circuits.lessThanU256(
      this.circuitContext,
      aU256,
      bU256,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public greaterThan(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.greaterThan(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public greaterThanU256(
    aU256: { low: bigint; high: bigint },
    bU256: { low: bigint; high: bigint },
  ): boolean {
    const result = this.contract.circuits.greaterThanU256(
      this.circuitContext,
      aU256,
      bU256,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public min(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.min(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public minU256(
    a: { low: bigint; high: bigint },
    b: { low: bigint; high: bigint },
  ): { low: bigint; high: bigint } {
    const aU256: U256 = { low: a.low, high: a.high };
    const bU256: U256 = { low: b.low, high: b.high };
    const result = this.contract.circuits.minU256(
      this.circuitContext,
      aU256,
      bU256,
    );
    this.circuitContext = result.context;
    return { low: result.result.low, high: result.result.high };
  }

  public max(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.max(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public maxU256(
    a: { low: bigint; high: bigint },
    b: { low: bigint; high: bigint },
  ): { low: bigint; high: bigint } {
    const aU256: U256 = { low: a.low, high: a.high };
    const bU256: U256 = { low: b.low, high: b.high };
    const result = this.contract.circuits.maxU256(
      this.circuitContext,
      aU256,
      bU256,
    );
    this.circuitContext = result.context;
    return { low: result.result.low, high: result.result.high };
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

  public isMultipleU256(
    value: { low: bigint; high: bigint },
    divisor: { low: bigint; high: bigint },
  ): boolean {
    const valueU256: U256 = { low: value.low, high: value.high };
    const divisorU256: U256 = { low: divisor.low, high: divisor.high };
    const result = this.contract.circuits.isMultipleU256(
      this.circuitContext,
      valueU256,
      divisorU256,
    );
    this.circuitContext = result.context;
    return result.result;
  }
}
