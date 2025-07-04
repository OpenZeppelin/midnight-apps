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
  type CoinInfo,
  Contract,
  type Ledger,
  ledger,
} from '../artifacts/MockCoin/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import { CoinContractPrivateState, CoinWitnesses } from '../witnesses/Coin';

export class CoinContractSimulator
  implements IContractSimulator<CoinContractPrivateState, Ledger>
{
  readonly contract: Contract<CoinContractPrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<CoinContractPrivateState>;

  constructor() {
    this.contract = new Contract<CoinContractPrivateState>(CoinWitnesses());
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(
        CoinContractPrivateState.generate(),
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

  public getCurrentPrivateState(): CoinContractPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public fromCoin(
    coin: CoinInfo,
    mt_index: bigint,
  ): { nonce: Uint8Array; color: Uint8Array; value: bigint; mt_index: bigint } {
    const result = this.contract.circuits.fromCoin(
      this.circuitContext,
      coin,
      mt_index,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public toCoin(qualifiedCoin: {
    nonce: Uint8Array;
    color: Uint8Array;
    value: bigint;
    mt_index: bigint;
  }): CoinInfo {
    const result = this.contract.circuits.toCoin(
      this.circuitContext,
      qualifiedCoin,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public add(a: CoinInfo, b: CoinInfo): CoinInfo {
    const result = this.contract.circuits.add(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sub(a: CoinInfo, b: CoinInfo): CoinInfo {
    const result = this.contract.circuits.sub(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mul(a: CoinInfo, b: CoinInfo): CoinInfo {
    const result = this.contract.circuits.mul(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public div(a: CoinInfo, b: CoinInfo): CoinInfo {
    const result = this.contract.circuits.div(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divRem(
    a: CoinInfo,
    b: CoinInfo,
  ): {
    quotient: CoinInfo;
    remainder: CoinInfo;
  } {
    const result = this.contract.circuits.divRem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public rem(a: CoinInfo, b: CoinInfo): CoinInfo {
    const result = this.contract.circuits.rem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrt(a: CoinInfo): CoinInfo {
    const result = this.contract.circuits.sqrt(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }

  public min(a: CoinInfo, b: CoinInfo): CoinInfo {
    const result = this.contract.circuits.min(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public max(a: CoinInfo, b: CoinInfo): CoinInfo {
    const result = this.contract.circuits.max(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sortGt(a: CoinInfo, b: CoinInfo): [CoinInfo, CoinInfo] {
    const result = this.contract.circuits.sortGtByColor(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public sortLt(a: CoinInfo, b: CoinInfo): [CoinInfo, CoinInfo] {
    const result = this.contract.circuits.sortLtByColor(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public eqValue(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.eqValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public ltValue(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.ltValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lteValue(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.lteValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gtValue(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.gtValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gteValue(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.gteValue(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public eqColor(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.eqColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public ltColor(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.ltColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lteColor(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.lteColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gtColor(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.gtColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gteColor(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.gteColor(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public eq(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.eq(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public isSameColor(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.isSameColor(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public isSameValue(a: CoinInfo, b: CoinInfo): boolean {
    const result = this.contract.circuits.isSameValue(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }
}
