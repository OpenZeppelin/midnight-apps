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
import type { DivResultU64 } from '../artifacts/Index/contract/index.cjs';
import {
  Contract,
  type Ledger,
  ledger,
} from '../artifacts/MockMathU64/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import {
  MathU64ContractPrivateState,
  MathU64Witnesses,
} from '../witnesses/MathU64';

export class MathContractSimulator
  implements IContractSimulator<MathU64ContractPrivateState, Ledger>
{
  readonly contract: Contract<MathU64ContractPrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<MathU64ContractPrivateState>;

  constructor() {
    this.contract = new Contract<MathU64ContractPrivateState>(
      MathU64Witnesses(),
    );
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        MathU64ContractPrivateState.generate(),
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
    this.contractAddress = this.circuitContext.transactionContext.address;
  }

  public getCurrentPublicState(): Ledger {
    return ledger(this.circuitContext.transactionContext.state);
  }

  public getCurrentPrivateState(): MathU64ContractPrivateState {
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

  public rem(dividend: bigint, divisor: bigint): bigint {
    const result = this.contract.circuits.rem(
      this.circuitContext,
      dividend,
      divisor,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public divRem(dividend: bigint, divisor: bigint): DivResultU64 {
    const result = this.contract.circuits.divRem(
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

export function createMilecuiousSimulator({
  mockSqrt,
  mockDiv,
}: {
  mockSqrt?: (radicand: bigint) => bigint;
  mockDiv?: (a: bigint, b: bigint) => { quotient: bigint; remainder: bigint };
}): MathContractSimulator {
  const baseWitnesses = MathU64Witnesses();

  const witnesses = (): ReturnType<typeof MathU64Witnesses> => ({
    ...baseWitnesses,
    ...(mockSqrt && {
      sqrtU64Locally(
        context: WitnessContext<Ledger, MathU64ContractPrivateState>,
        radicand: bigint,
      ): [MathU64ContractPrivateState, bigint] {
        return [context.privateState, mockSqrt(radicand)];
      },
    }),
    ...(mockDiv && {
      divU64Locally(
        context: WitnessContext<Ledger, MathU64ContractPrivateState>,
        a: bigint,
        b: bigint,
      ): [
        MathU64ContractPrivateState,
        { quotient: bigint; remainder: bigint },
      ] {
        return [context.privateState, mockDiv(a, b)];
      },
    }),
  });

  const contract = new Contract<MathU64ContractPrivateState>(witnesses());

  const { currentPrivateState, currentContractState, currentZswapLocalState } =
    contract.initialState(
      constructorContext(
        MathU64ContractPrivateState.generate(),
        sampleCoinPublicKey(),
      ),
    );

  const badSimulator = new MathContractSimulator();
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
