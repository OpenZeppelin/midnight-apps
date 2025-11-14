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

// Helper function to convert bigint to Bytes<32> (Uint8Array)
const bigintToBytes32 = (value: bigint): Uint8Array => {
  const bytes = new Uint8Array(32);
  let remaining = value;

  // Convert bigint to bytes (little-endian)
  for (let i = 0; i < 32 && remaining > 0n; i++) {
    bytes[i] = Number(remaining & 0xffn);
    remaining = remaining >> 8n;
  }

  return bytes;
};

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

  public derivePublicKey(secretKey: bigint): unknown {
    const secretKeyBytes = bigintToBytes32(secretKey);
    const result = this.contract.circuits.derivePublicKey(
      this.circuitContext,
      secretKeyBytes,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public generateKeyPair(secretKey: bigint): SchnorrKeyPair {
    const secretKeyBytes = bigintToBytes32(secretKey);
    const result = this.contract.circuits.generateKeyPair(
      this.circuitContext,
      secretKeyBytes,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public sign(
    secretKey: bigint,
    message: Uint8Array,
    nonce: bigint,
  ): SchnorrSignature {
    const secretKeyBytes = bigintToBytes32(secretKey);
    const nonceBytes = bigintToBytes32(nonce);
    const result = this.contract.circuits.sign(
      this.circuitContext,
      secretKeyBytes,
      message,
      nonceBytes,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public verifySignature(
    publicKey: unknown,
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

  public hashToScalar(data: Uint8Array): bigint {
    const result = this.contract.circuits.hashToScalar(
      this.circuitContext,
      data,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public isValidPublicKey(publicKey: unknown): boolean {
    const result = this.contract.circuits.isValidPublicKey(
      this.circuitContext,
      publicKey,
    );
    this.circuitContext = result.context;
    return result.result;
  }
}

