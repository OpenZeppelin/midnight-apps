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
} from '../artifacts/Pedersen.mock/contract/index.cjs';
import type { Commitment, Opening } from '../artifacts/Pedersen.mock/contract/index.d.cts';
import type { IContractSimulator } from '../types/test';
import { PedersenPrivateState, PedersenWitnesses } from '../witnesses/Pedersen';

export class PedersenSimulator
  implements IContractSimulator<PedersenPrivateState, Ledger>
{
  readonly contract: Contract<PedersenPrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<PedersenPrivateState>;

  constructor() {
    this.contract = new Contract<PedersenPrivateState>(PedersenWitnesses());
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        PedersenPrivateState.generate(),
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

  public getCurrentPrivateState(): PedersenPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public VALUE_GENERATOR(): unknown {
    const result = this.contract.circuits.VALUE_GENERATOR(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public commit(value: bigint, randomness: bigint): Commitment {
    const result = this.contract.circuits.commit(
      this.circuitContext,
      value,
      randomness,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public open(
    commitment: Commitment,
    value: bigint,
    randomness: bigint,
  ): boolean {
    const result = this.contract.circuits.open(
      this.circuitContext,
      commitment,
      value,
      randomness,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public verifyOpening(
    commitment: Commitment,
    opening: Opening,
  ): boolean {
    const result = this.contract.circuits.verifyOpening(
      this.circuitContext,
      commitment,
      opening,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public add(c1: Commitment, c2: Commitment): Commitment {
    const result = this.contract.circuits.add(this.circuitContext, c1, c2);
    this.circuitContext = result.context;
    return result.result;
  }

  public sub(c1: Commitment, c2: Commitment): Commitment {
    const result = this.contract.circuits.sub(this.circuitContext, c1, c2);
    this.circuitContext = result.context;
    return result.result;
  }

  public mockRandom(seed: bigint): bigint {
    const result = this.contract.circuits.mockRandom(
      this.circuitContext,
      seed,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public mockRandomFromData(
    data1: bigint,
    data2: bigint,
    nonce: bigint,
  ): bigint {
    const result = this.contract.circuits.mockRandomFromData(
      this.circuitContext,
      data1,
      data2,
      nonce,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public zero(): Commitment {
    const result = this.contract.circuits.zero(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public isZero(c: Commitment): boolean {
    const result = this.contract.circuits.isZero(this.circuitContext, c);
    this.circuitContext = result.context;
    return result.result;
  }
}

