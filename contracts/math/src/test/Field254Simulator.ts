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
  DivResultU256,
  U256,
} from '../artifacts/Index/contract/index.d.cts';
import {
  Contract,
  type Ledger,
  ledger,
} from '../artifacts/MockField254/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import {
  Field254ContractPrivateState,
  Field254Witnesses,
} from '../witnesses/Field254';

export class Field254Simulator
  implements IContractSimulator<Field254ContractPrivateState, Ledger>
{
  readonly contract: Contract<Field254ContractPrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<Field254ContractPrivateState>;

  constructor() {
    this.contract = new Contract<Field254ContractPrivateState>(
      Field254Witnesses(),
    );
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        Field254ContractPrivateState.generate(),
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

  public getCurrentPrivateState(): Field254ContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public fromField(a: bigint): U256 {
    const result = this.contract.circuits.fromField(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }

  public toField(a: U256): bigint {
    const result = this.contract.circuits.toField(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }

  public eq(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.eq(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lt(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.lt(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lte(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.lte(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gt(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.gt(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gte(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.gte(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public add(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.add(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sub(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.sub(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mul(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.mul(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public div(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.div(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public rem(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.rem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divRem(a: bigint, b: bigint): DivResultU256 {
    const result = this.contract.circuits.divRem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrt(radicand: bigint): bigint {
    const result = this.contract.circuits.sqrt(this.circuitContext, radicand);
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

  public isZero(a: bigint): boolean {
    const result = this.contract.circuits.isZero(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }
}

export function createMaliciousField254Simulator({
  mockSqrtU256,
  mockDivU256,
}: {
  mockSqrtU256?: (radicand: U256) => bigint;
  mockDivU256?: (a: U256, b: U256) => { quotient: bigint; remainder: bigint };
}): Field254Simulator {
  const MAX_U64 = 2n ** 64n - 1n;

  const baseWitnesses = Field254Witnesses();

  const witnesses = {
    ...baseWitnesses,
    ...(mockSqrtU256 && {
      sqrtU256Locally(
        context: WitnessContext<Ledger, Field254ContractPrivateState>,
        radicand: U256,
      ): [Field254ContractPrivateState, bigint] {
        return [context.privateState, mockSqrtU256(radicand)];
      },
    }),
    ...(mockDivU256 && {
      divU256Locally(
        context: WitnessContext<Ledger, Field254ContractPrivateState>,
        a: U256,
        b: U256,
      ): [Field254ContractPrivateState, DivResultU256] {
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
  };

  const contract = new Contract<Field254ContractPrivateState>(witnesses);

  const { currentPrivateState, currentContractState, currentZswapLocalState } =
    contract.initialState(
      constructorContext(
        Field254ContractPrivateState.generate(),
        sampleCoinPublicKey(),
      ),
    );

  const badSimulator = new Field254Simulator();
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
