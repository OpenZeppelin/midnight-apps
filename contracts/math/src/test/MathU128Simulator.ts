import {
  type CircuitContext,
  type ContractState,
  QueryContext,
  type WitnessContext,
  constructorContext,
} from '@midnight-ntwrk/compact-runtime';
import {
  sampleCoinPublicKey,
  sampleContractAddress,
} from '@midnight-ntwrk/zswap';
import type {
  DivResultU128,
  U128,
  U256,
} from '../artifacts/Index/contract/index.d.cts';
import {
  Contract,
  type Ledger,
  ledger,
} from '../artifacts/MockMathU128/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import {
  MathU128ContractPrivateState,
  MathU128Witnesses,
} from '../witnesses/MathU128';

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

  public isZero(value: bigint): boolean {
    const result = this.contract.circuits.isZero(this.circuitContext, value);
    this.circuitContext = result.context;
    return result.result;
  }

  public isZeroU128(value: U128): boolean {
    const result = this.contract.circuits.isZeroU128(
      this.circuitContext,
      value,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public eq(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.eq(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public eqU128(a: U128, b: U128): boolean {
    const result = this.contract.circuits.eqU128(this.circuitContext, a, b);
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

  public add(a: bigint, b: bigint): U256 {
    const result = this.contract.circuits.add(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public addU128(a: U128, b: U128): U256 {
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

  public mul(a: bigint, b: bigint): U256 {
    const result = this.contract.circuits.mul(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mulU128(a: U128, b: U128): U256 {
    const result = this.contract.circuits.mulU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public div(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.div(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divU128(a: U128, b: U128): U128 {
    const result = this.contract.circuits.divU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public rem(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.rem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public remU128(a: U128, b: U128): U128 {
    const result = this.contract.circuits.remU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divRem(a: bigint, b: bigint): DivResultU128 {
    const result = this.contract.circuits.divRem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divRemU128(a: U128, b: U128): DivResultU128 {
    const result = this.contract.circuits.divRemU128(this.circuitContext, a, b);
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

export function createMaliciousSimulator({
  mockSqrt,
  mockDiv,
}: {
  mockSqrt?: (radicand: bigint) => bigint;
  mockDiv?: (
    a: bigint,
    b: bigint,
  ) => {
    quotient: bigint;
    remainder: bigint;
  };
}): MathU128Simulator {
  const MAX_U64 = 2n ** 64n - 1n;

  const baseWitnesses = MathU128Witnesses();

  const witnesses = {
    ...baseWitnesses,
    ...(mockSqrt && {
      sqrtU128Locally(
        context: WitnessContext<Ledger, MathU128ContractPrivateState>,
        radicand: bigint,
      ): [MathU128ContractPrivateState, bigint] {
        return [context.privateState, mockSqrt(radicand)];
      },
    }),
    ...(mockDiv && {
      divU128Locally(
        context: WitnessContext<Ledger, MathU128ContractPrivateState>,
        a: bigint,
        b: bigint,
      ): [MathU128ContractPrivateState, DivResultU128] {
        const { quotient, remainder } = mockDiv(a, b);
        return [
          context.privateState,
          {
            quotient: {
              low: quotient & MAX_U64,
              high: quotient >> 64n,
            },
            remainder: {
              low: remainder & MAX_U64,
              high: remainder >> 64n,
            },
          },
        ];
      },
    }),
  };

  const contract = new Contract<MathU128ContractPrivateState>(witnesses);

  const { currentPrivateState, currentContractState, currentZswapLocalState } =
    contract.initialState(
      constructorContext(
        MathU128ContractPrivateState.generate(),
        sampleCoinPublicKey(),
      ),
    );

  const badSimulator = new MathU128Simulator();
  Object.defineProperty(badSimulator, 'contract', {
    value: contract,
    writable: false,
    configurable: true,
  });

  badSimulator.circuitContext = {
    currentPrivateState,
    currentZswapLocalState,
    originalState: currentContractState,
    transactionContext: badSimulator.circuitContext.transactionContext,
  };

  return badSimulator;
}
