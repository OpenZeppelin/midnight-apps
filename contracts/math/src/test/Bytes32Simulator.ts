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
import {
  Contract,
  type Ledger,
  ledger,
} from '../artifacts/MockBytes32/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import {
  Bytes32ContractPrivateState,
  Bytes32Witnesses,
} from '../witnesses/Bytes32';

export class Bytes32ContractSimulator
  implements IContractSimulator<Bytes32ContractPrivateState, Ledger>
{
  readonly contract: Contract<Bytes32ContractPrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<Bytes32ContractPrivateState>;

  constructor() {
    this.contract = new Contract<Bytes32ContractPrivateState>(
      Bytes32Witnesses(),
    );
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        Bytes32ContractPrivateState.generate(),
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

  public getCurrentPrivateState(): Bytes32ContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public eq(a: Uint8Array, b: Uint8Array): boolean {
    const result = this.contract.circuits.eq(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lt(a: Uint8Array, b: Uint8Array): boolean {
    const result = this.contract.circuits.lt(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lte(a: Uint8Array, b: Uint8Array): boolean {
    const result = this.contract.circuits.lte(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gt(a: Uint8Array, b: Uint8Array): boolean {
    const result = this.contract.circuits.gt(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gte(a: Uint8Array, b: Uint8Array): boolean {
    const result = this.contract.circuits.gte(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public isZero(a: Uint8Array): boolean {
    const result = this.contract.circuits.isZero(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }

  public fromBytes(bytes: Uint8Array): bigint {
    const result = this.contract.circuits.fromBytes(this.circuitContext, bytes);
    this.circuitContext = result.context;
    return result.result;
  }

  public toBytes(field: bigint): Uint8Array {
    const result = this.contract.circuits.toBytes(this.circuitContext, field);
    this.circuitContext = result.context;
    return result.result;
  }
}

export function createMaliciousSimulator({
  mockEq,
  mockLt,
  mockLte,
  mockGt,
  mockGte,
}: {
  mockEq?: (a: Uint8Array, b: Uint8Array) => boolean;
  mockLt?: (a: Uint8Array, b: Uint8Array) => boolean;
  mockLte?: (a: Uint8Array, b: Uint8Array) => boolean;
  mockGt?: (a: Uint8Array, b: Uint8Array) => boolean;
  mockGte?: (a: Uint8Array, b: Uint8Array) => boolean;
}): Bytes32ContractSimulator {
  const baseWitnesses = Bytes32Witnesses();

  const witnesses = (): ReturnType<typeof Bytes32Witnesses> => ({
    ...baseWitnesses,
    ...(mockEq && {
      eqLocally(
        context: WitnessContext<Ledger, Bytes32ContractPrivateState>,
        a: Uint8Array,
        b: Uint8Array,
      ): [Bytes32ContractPrivateState, boolean] {
        return [context.privateState, mockEq(a, b)];
      },
    }),
    ...(mockLt && {
      ltLocally(
        context: WitnessContext<Ledger, Bytes32ContractPrivateState>,
        a: Uint8Array,
        b: Uint8Array,
      ): [Bytes32ContractPrivateState, boolean] {
        return [context.privateState, mockLt(a, b)];
      },
    }),
    ...(mockLte && {
      lteLocally(
        context: WitnessContext<Ledger, Bytes32ContractPrivateState>,
        a: Uint8Array,
        b: Uint8Array,
      ): [Bytes32ContractPrivateState, boolean] {
        return [context.privateState, mockLte(a, b)];
      },
    }),
    ...(mockGt && {
      gtLocally(
        context: WitnessContext<Ledger, Bytes32ContractPrivateState>,
        a: Uint8Array,
        b: Uint8Array,
      ): [Bytes32ContractPrivateState, boolean] {
        return [context.privateState, mockGt(a, b)];
      },
    }),
    ...(mockGte && {
      gteLocally(
        context: WitnessContext<Ledger, Bytes32ContractPrivateState>,
        a: Uint8Array,
        b: Uint8Array,
      ): [Bytes32ContractPrivateState, boolean] {
        return [context.privateState, mockGte(a, b)];
      },
    }),
  });

  const contract = new Contract<Bytes32ContractPrivateState>(witnesses());

  const { currentPrivateState, currentContractState, currentZswapLocalState } =
    contract.initialState(
      constructorContext(
        Bytes32ContractPrivateState.generate(),
        sampleCoinPublicKey(),
      ),
    );

  const badSimulator = new Bytes32ContractSimulator();
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
