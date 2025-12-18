import {
  type CircuitContext,
  type ContractState,
  constructorContext,
  QueryContext,
  type WitnessContext,
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
} from '../artifacts/Uint64.mock/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import { Uint64PrivateState, Uint64Witnesses } from '../witnesses/Uint64';

export class Uint64Simulator
  implements IContractSimulator<Uint64PrivateState, Ledger>
{
  readonly contract: Contract<Uint64PrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<Uint64PrivateState>;

  constructor() {
    this.contract = new Contract<Uint64PrivateState>(Uint64Witnesses());
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(Uint64PrivateState.generate(), sampleCoinPublicKey()),
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

  public getCurrentPrivateState(): Uint64PrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
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

  public divRem(a: bigint, b: bigint): DivResultU64 {
    const result = this.contract.circuits.divRem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrt(radical: bigint): bigint {
    const result = this.contract.circuits.sqrt(this.circuitContext, radical);
    this.circuitContext = result.context;
    return result.result;
  }

  public isMultiple(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.isMultiple(this.circuitContext, a, b);
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

export function createMaliciousSimulator({
  mockSqrt,
  mockDiv,
}: {
  mockSqrt?: (radicand: bigint) => bigint;
  mockDiv?: (a: bigint, b: bigint) => { quotient: bigint; remainder: bigint };
}): Uint64Simulator {
  const baseWitnesses = Uint64Witnesses();

  const witnesses = (): ReturnType<typeof Uint64Witnesses> => ({
    ...baseWitnesses,
    ...(mockSqrt && {
      sqrtU64Locally(
        context: WitnessContext<Ledger, Uint64PrivateState>,
        radicand: bigint,
      ): [Uint64PrivateState, bigint] {
        return [context.privateState, mockSqrt(radicand)];
      },
    }),
    ...(mockDiv && {
      divU64Locally(
        context: WitnessContext<Ledger, Uint64PrivateState>,
        a: bigint,
        b: bigint,
      ): [Uint64PrivateState, { quotient: bigint; remainder: bigint }] {
        return [context.privateState, mockDiv(a, b)];
      },
    }),
  });

  const contract = new Contract<Uint64PrivateState>(witnesses());

  const { currentPrivateState, currentContractState, currentZswapLocalState } =
    contract.initialState(
      constructorContext(Uint64PrivateState.generate(), sampleCoinPublicKey()),
    );

  const badSimulator = new Uint64Simulator();
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
