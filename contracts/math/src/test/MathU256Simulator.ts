// MathU256Simulator.ts
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

export function createMaliciousSimulator({
  mockSqrtU256,
  mockDivU256,
  mockDivU128,
}: {
  mockSqrtU256?: (radicand: U256) => bigint;
  mockDivU256?: (a: U256, b: U256) => { quotient: bigint; remainder: bigint };
  mockDivU128?: (
    a: bigint,
    b: bigint,
  ) => { quotient: bigint; remainder: bigint };
}): MathU256Simulator {
  const MAX_U64 = 2n ** 64n - 1n;

  const baseWitnesses = MathU256Witnesses();

  const witnesses = {
    ...baseWitnesses,
    ...(mockSqrtU256 && {
      sqrtU256Locally(
        context: WitnessContext<Ledger, MathU256ContractPrivateState>,
        radicand: U256,
      ): [MathU256ContractPrivateState, bigint] {
        return [context.privateState, mockSqrtU256(radicand)];
      },
    }),
    ...(mockDivU256 && {
      divU256Locally(
        context: WitnessContext<Ledger, MathU256ContractPrivateState>,
        a: U256,
        b: U256,
      ): [MathU256ContractPrivateState, DivResultU256] {
        const { quotient, remainder } = mockDivU256(a, b);

        const qLow = quotient & ((1n << 128n) - 1n);
        const qHigh = quotient >> 128n;
        const rLow = remainder & ((1n << 128n) - 1n);
        const rHigh = remainder >> 128n;

        return [
          context.privateState,
          {
            quotient: {
              low: {
                low: qLow & MAX_U64,
                high: qLow >> 64n,
              },
              high: {
                low: qHigh & MAX_U64,
                high: qHigh >> 64n,
              },
            },
            remainder: {
              low: {
                low: rLow & MAX_U64,
                high: rLow >> 64n,
              },
              high: {
                low: rHigh & MAX_U64,
                high: rHigh >> 64n,
              },
            },
          },
        ];
      },
    }),
    ...(mockDivU128 && {
      divU128Locally(
        context: WitnessContext<Ledger, MathU256ContractPrivateState>,
        a: bigint,
        b: bigint,
      ): [MathU256ContractPrivateState, DivResultU128] {
        const { quotient, remainder } = mockDivU128(a, b);
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
    divUint128Locally(
      context: WitnessContext<Ledger, MathU256ContractPrivateState>,
      a: bigint,
      b: bigint,
    ): [MathU256ContractPrivateState, DivResultU128] {
      return baseWitnesses.divUint128Locally(context, a, b);
    },
  };

  const contract = new Contract<MathU256ContractPrivateState>(witnesses);

  const { currentPrivateState, currentContractState, currentZswapLocalState } =
    contract.initialState(
      constructorContext(
        MathU256ContractPrivateState.generate(),
        sampleCoinPublicKey(),
      ),
    );

  const badSimulator = new MathU256Simulator();
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
