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
import type {
  DivResultU128,
  U128,
  U256,
} from '../artifacts/Index/contract/index.d.cts';
import {
  Contract,
  type Ledger,
  ledger,
} from '../artifacts/Uint128.mock/contract/index.cjs';
import type { IContractSimulator } from '../types/test';
import { Uint128PrivateState, Uint128Witnesses } from '../witnesses/Uint128';

export class Uint128Simulator
  implements IContractSimulator<Uint128PrivateState, Ledger>
{
  readonly contract: Contract<Uint128PrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<Uint128PrivateState>;

  constructor() {
    this.contract = new Contract<Uint128PrivateState>(Uint128Witnesses());
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(Uint128PrivateState.generate(), sampleCoinPublicKey()),
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

  public getCurrentPrivateState(): Uint128PrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public MODULUS(): bigint {
    const result = this.contract.circuits.MODULUS(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public ZERO_U128(): U128 {
    const result = this.contract.circuits.ZERO_U128(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public toU128(value: bigint): U128 {
    const result = this.contract.impureCircuits.toU128(
      this.circuitContext,
      value,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public fromU128(value: U128): bigint {
    const result = this.contract.circuits.fromU128(this.circuitContext, value);
    this.circuitContext = result.context;
    return result.result;
  }

  public isZero(value: bigint): boolean {
    const result = this.contract.circuits.isZero(this.circuitContext, value);
    this.circuitContext = result.context;
    return result.result;
  }

  public isZeroU128(value: U128): boolean {
    const result = this.contract.circuits.isZeroU128(
      this.circuitContext,
      value,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public eq(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.eq(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public eqU128(a: U128, b: U128): boolean {
    const result = this.contract.circuits.eqU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lt(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.lt(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public ltU128(a: U128, b: U128): boolean {
    const result = this.contract.circuits.ltU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lte(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.lte(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lteU128(a: U128, b: U128): boolean {
    const result = this.contract.circuits.lteU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gt(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.gt(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gtU128(a: U128, b: U128): boolean {
    const result = this.contract.circuits.gtU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gte(a: bigint, b: bigint): boolean {
    const result = this.contract.circuits.gte(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gteU128(a: U128, b: U128): boolean {
    const result = this.contract.circuits.gteU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public add(a: bigint, b: bigint): U256 {
    const result = this.contract.circuits.add(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public addU128(a: U128, b: U128): U256 {
    const result = this.contract.circuits.addU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public addChecked(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.addChecked(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public addCheckedU128(a: U128, b: U128): bigint {
    const result = this.contract.circuits.addCheckedU128(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public sub(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.sub(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public subU128(a: U128, b: U128): U128 {
    const result = this.contract.circuits.subU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mul(a: bigint, b: bigint): U256 {
    const result = this.contract.circuits.mul(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mulU128(a: U128, b: U128): U256 {
    const result = this.contract.circuits.mulU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mulChecked(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.mulChecked(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mulCheckedU128(a: U128, b: U128): bigint {
    const result = this.contract.circuits.mulCheckedU128(
      this.circuitContext,
      a,
      b,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public div(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.div(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divU128(a: U128, b: U128): U128 {
    const result = this.contract.circuits.divU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public rem(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.rem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public remU128(a: U128, b: U128): U128 {
    const result = this.contract.circuits.remU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divRem(a: bigint, b: bigint): DivResultU128 {
    const result = this.contract.circuits.divRem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divRemU128(a: U128, b: U128): DivResultU128 {
    const result = this.contract.circuits.divRemU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrt(radicand: bigint): bigint {
    const result = this.contract.circuits.sqrt(this.circuitContext, radicand);
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrtU128(radicand: U128): bigint {
    const result = this.contract.circuits.sqrtU128(
      this.circuitContext,
      radicand,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public min(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.min(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public minU128(a: U128, b: U128): U128 {
    const result = this.contract.circuits.minU128(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public max(a: bigint, b: bigint): bigint {
    const result = this.contract.circuits.max(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public maxU128(a: U128, b: U128): U128 {
    const result = this.contract.circuits.maxU128(this.circuitContext, a, b);
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

  public isMultipleU128(value: U128, divisor: U128): boolean {
    const result = this.contract.circuits.isMultipleU128(
      this.circuitContext,
      value,
      divisor,
    );
    this.circuitContext = result.context;
    return result.result;
  }
}

export function createMaliciousSimulator({
  mockSqrt,
  mockDiv,
}: {
  mockSqrt?: (radicand: bigint) => bigint;
  mockDiv?: (
    a: bigint,
    b: bigint,
  ) => {
    quotient: bigint;
    remainder: bigint;
  };
}): Uint128Simulator {
  const MAX_U64 = 2n ** 64n - 1n;

  const baseWitnesses = Uint128Witnesses();

  const witnesses = {
    ...baseWitnesses,
    ...(mockSqrt && {
      sqrtU128Locally(
        context: WitnessContext<Ledger, Uint128PrivateState>,
        radicand: U128,
      ): [Uint128PrivateState, bigint] {
        return [
          context.privateState,
          mockSqrt(BigInt(radicand.high) * 2n ** 64n + BigInt(radicand.low)),
        ];
      },
    }),
    ...(mockDiv && {
      divU128Locally(
        context: WitnessContext<Ledger, Uint128PrivateState>,
        a: U128,
        b: U128,
      ): [Uint128PrivateState, DivResultU128] {
        const aValue = (BigInt(a.high) << 64n) + BigInt(a.low);
        const bValue = (BigInt(b.high) << 64n) + BigInt(b.low);
        const { quotient, remainder } = mockDiv(aValue, bValue);
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
    ...(mockDiv && {
      divUint128Locally(
        context: WitnessContext<Ledger, Uint128PrivateState>,
        a: bigint,
        b: bigint,
      ): [Uint128PrivateState, DivResultU128] {
        const { quotient, remainder } = mockDiv(a, b);
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
  };

  const contract = new Contract<Uint128PrivateState>(witnesses);

  const { currentPrivateState, currentContractState, currentZswapLocalState } =
    contract.initialState(
      constructorContext(Uint128PrivateState.generate(), sampleCoinPublicKey()),
    );

  const badSimulator = new Uint128Simulator();
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
