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
  type QualifiedCoinInfo,
  ledger,
} from '../artifacts/MockQualifiedCoin/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import {
  QualifiedCoinContractPrivateState,
  QualifiedCoinWitnesses,
} from '../witnesses/QualifiedCoin';

export class QualifiedCoinContractSimulator
  implements IContractSimulator<QualifiedCoinContractPrivateState, Ledger>
{
  readonly contract: Contract<QualifiedCoinContractPrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<QualifiedCoinContractPrivateState>;

  constructor() {
    this.contract = new Contract<QualifiedCoinContractPrivateState>(
      QualifiedCoinWitnesses(),
    );
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        QualifiedCoinContractPrivateState.generate(),
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

  public getCurrentPrivateState(): QualifiedCoinContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  // ============================================================================
  // CONVERSION FUNCTIONS
  // ============================================================================

  public fromQCoin(
    coin: { nonce: Uint8Array; color: Uint8Array; value: bigint },
    mt_index: bigint,
  ): QualifiedCoinInfo {
    const result = this.contract.circuits.fromQCoin(
      this.circuitContext,
      coin,
      mt_index,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public toQCoin(qualifiedCoin: QualifiedCoinInfo): {
    nonce: Uint8Array;
    color: Uint8Array;
    value: bigint;
  } {
    const result = this.contract.circuits.toQCoin(
      this.circuitContext,
      qualifiedCoin,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  // ============================================================================
  // ARITHMETIC OPERATIONS
  // ============================================================================

  public add(a: QualifiedCoinInfo, b: QualifiedCoinInfo): QualifiedCoinInfo {
    const result = this.contract.circuits.add(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sub(a: QualifiedCoinInfo, b: QualifiedCoinInfo): QualifiedCoinInfo {
    const result = this.contract.circuits.sub(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mul(a: QualifiedCoinInfo, b: QualifiedCoinInfo): QualifiedCoinInfo {
    const result = this.contract.circuits.mul(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public div(a: QualifiedCoinInfo, b: QualifiedCoinInfo): QualifiedCoinInfo {
    const result = this.contract.circuits.div(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divRem(
    a: QualifiedCoinInfo,
    b: QualifiedCoinInfo,
  ): {
    quotient: QualifiedCoinInfo;
    remainder: QualifiedCoinInfo;
  } {
    const result = this.contract.circuits.divRem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public rem(a: QualifiedCoinInfo, b: QualifiedCoinInfo): QualifiedCoinInfo {
    const result = this.contract.circuits.rem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrt(a: QualifiedCoinInfo): QualifiedCoinInfo {
    const result = this.contract.circuits.sqrt(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }

  public min(a: QualifiedCoinInfo, b: QualifiedCoinInfo): QualifiedCoinInfo {
    const result = this.contract.circuits.min(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public max(a: QualifiedCoinInfo, b: QualifiedCoinInfo): QualifiedCoinInfo {
    const result = this.contract.circuits.max(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sortGt(
    a: QualifiedCoinInfo,
    b: QualifiedCoinInfo,
  ): [QualifiedCoinInfo, QualifiedCoinInfo] {
    const result = this.contract.circuits.sortGtByColor(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public sortLt(
    a: QualifiedCoinInfo,
    b: QualifiedCoinInfo,
  ): [QualifiedCoinInfo, QualifiedCoinInfo] {
    const result = this.contract.circuits.sortLtByColor(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  // ============================================================================
  // BOOLEAN OPERATIONS (COMPARISONS)
  // ============================================================================

  public eqValue(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.eqValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public ltValue(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.ltValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lteValue(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.lteValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gtValue(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.gtValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gteValue(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.gteValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public eqColor(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.eqColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public ltColor(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.ltColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lteColor(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.lteColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gtColor(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.gtColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gteColor(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.gteColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public eq(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.eq(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public isSameColor(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.isSameColor(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public isSameValue(a: QualifiedCoinInfo, b: QualifiedCoinInfo): boolean {
    const result = this.contract.circuits.isSameValue(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }
}
