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
} from '../artifacts/SchnorrBLS12381.mock/contract/index.cjs';
import type {
  SchnorrKeyPair,
  SchnorrSignature,
} from '../artifacts/SchnorrBLS12381.mock/contract/index.d.cts';
import type { IContractSimulator } from '../types/test';
import {
  SchnorrBLS12381PrivateState,
  SchnorrBLS12381Witnesses,
} from '../witnesses/SchnorrBLS12381';

export class SchnorrBLS12381Simulator
  implements IContractSimulator<SchnorrBLS12381PrivateState, Ledger>
{
  readonly contract: Contract<SchnorrBLS12381PrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<SchnorrBLS12381PrivateState>;

  constructor() {
    this.contract = new Contract<SchnorrBLS12381PrivateState>(
      SchnorrBLS12381Witnesses(),
    );
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        SchnorrBLS12381PrivateState.generate(),
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

  public getCurrentPrivateState(): SchnorrBLS12381PrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public derivePublicKey(secretKey: Uint8Array): { x: bigint; y: bigint } {
    const result = this.contract.circuits.derivePublicKey(
      this.circuitContext,
      secretKey,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public generateKeyPair(secretKey: Uint8Array): SchnorrKeyPair {
    const result = this.contract.circuits.generateKeyPair(
      this.circuitContext,
      secretKey,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public sign(
    secretKey: Uint8Array,
    message: Uint8Array,
    nonce: Uint8Array,
  ): SchnorrSignature {
    const result = this.contract.circuits.sign(
      this.circuitContext,
      secretKey,
      message,
      nonce,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public verifySignature(
    publicKey: { x: bigint; y: bigint },
    message: Uint8Array,
    signature: SchnorrSignature,
  ): boolean {
    const result = this.contract.circuits.verifySignature(
      this.circuitContext,
      publicKey,
      message,
      signature,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public isValidPublicKey(publicKey: { x: bigint; y: bigint }): boolean {
    const result = this.contract.circuits.isValidPublicKey(
      this.circuitContext,
      publicKey,
    );
    this.circuitContext = result.context;
    return result.result;
  }
}

