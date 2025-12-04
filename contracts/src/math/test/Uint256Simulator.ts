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
  DivResultU128,
  DivResultU256,
  U256,
} from '../../../artifacts/math/Index/contract/index.d.cts';
import {
  Contract,
  type Ledger,
  ledger,
} from '../../../artifacts/math/test/Uint256.mock/contract/index.cjs';
import type { IContractSimulator } from '../types/test.js';
import { Uint256PrivateState, Uint256Witnesses } from '../witnesses/Uint256.js';

export class Uint256Simulator
  implements IContractSimulator<Uint256PrivateState, Ledger>
{
  readonly contract: Contract<Uint256PrivateState>;
  readonly contractAddress: string;
  circuitContext: CircuitContext<Uint256PrivateState>;

  constructor() {
    this.contract = new Contract<Uint256PrivateState>(Uint256Witnesses());
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(Uint256PrivateState.generate(), sampleCoinPublicKey()),
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

  public getCurrentPrivateState(): Uint256PrivateState {
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

  public MODULUS_U256(): U256 {
    const result = this.contract.circuits.MODULUS_U256(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public ZERO_U256(): U256 {
    const result = this.contract.circuits.ZERO_U256(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public fromU256(a: U256): bigint {
    const result = this.contract.circuits.fromU256(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }

  public toU256(a: bigint): U256 {
    const result = this.contract.circuits.toU256(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }

  public eq(a: U256, b: U256): boolean {
    const result = this.contract.circuits.eq(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lt(a: U256, b: U256): boolean {
    const result = this.contract.circuits.lt(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public lte(a: U256, b: U256): boolean {
    const result = this.contract.circuits.lte(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gt(a: U256, b: U256): boolean {
    const result = this.contract.circuits.gt(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public gte(a: U256, b: U256): boolean {
    const result = this.contract.circuits.gte(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public add(a: U256, b: U256): U256 {
    const result = this.contract.circuits.add(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sub(a: U256, b: U256): U256 {
    const result = this.contract.circuits.sub(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public mul(a: U256, b: U256): U256 {
    const result = this.contract.circuits.mul(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public div(a: U256, b: U256): U256 {
    const result = this.contract.circuits.div(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public rem(a: U256, b: U256): U256 {
    const result = this.contract.circuits.rem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public divRem(a: U256, b: U256): DivResultU256 {
    const result = this.contract.circuits.divRem(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public sqrt(radicand: U256): bigint {
    const result = this.contract.circuits.sqrt(this.circuitContext, radicand);
    this.circuitContext = result.context;
    return result.result;
  }

  public min(a: U256, b: U256): U256 {
    const result = this.contract.circuits.min(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public max(a: U256, b: U256): U256 {
    const result = this.contract.circuits.max(this.circuitContext, a, b);
    this.circuitContext = result.context;
    return result.result;
  }

  public isZero(a: U256): boolean {
    const result = this.contract.circuits.isZero(this.circuitContext, a);
    this.circuitContext = result.context;
    return result.result;
  }

  public isExceedingFieldSize(a: U256): boolean {
    const result = this.contract.circuits.isExceedingFieldSize(
      this.circuitContext,
      a,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public isLowestLimbOnly(val: U256, limbValue: bigint): boolean {
    const result = this.contract.circuits.isLowestLimbOnly(
      this.circuitContext,
      val,
      limbValue,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public isSecondLimbOnly(val: U256, limbValue: bigint): boolean {
    const result = this.contract.circuits.isSecondLimbOnly(
      this.circuitContext,
      val,
      limbValue,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public isThirdLimbOnly(val: U256, limbValue: bigint): boolean {
    const result = this.contract.circuits.isThirdLimbOnly(
      this.circuitContext,
      val,
      limbValue,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public isHighestLimbOnly(val: U256, limbValue: bigint): boolean {
    const result = this.contract.circuits.isHighestLimbOnly(
      this.circuitContext,
      val,
      limbValue,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public isMultiple(value: U256, divisor: U256): boolean {
    const result = this.contract.circuits.isMultiple(
      this.circuitContext,
      value,
      divisor,
    );
    this.circuitContext = result.context;
    return result.result;
  }
}

export function createMaliciousSimulator({
  mockSqrtU256,
  mockDivU256,
  mockDivU128,
}: {
  mockSqrtU256?: (radicand: U256) => bigint;
  mockDivU256?: (a: U256, b: U256) => { quotient: bigint; remainder: bigint };
  mockDivU128?: (
    a: bigint,
    b: bigint,
  ) => { quotient: bigint; remainder: bigint };
}): Uint256Simulator {
  const MAX_U64 = 2n ** 64n - 1n;

  const baseWitnesses = Uint256Witnesses();

  const witnesses = {
    ...baseWitnesses,
    ...(mockSqrtU256 && {
      sqrtU256Locally(
        context: WitnessContext<Ledger, Uint256PrivateState>,
        radicand: U256,
      ): [Uint256PrivateState, bigint] {
        return [context.privateState, mockSqrtU256(radicand)];
      },
    }),
    ...(mockDivU256 && {
      divU256Locally(
        context: WitnessContext<Ledger, Uint256PrivateState>,
        a: U256,
        b: U256,
      ): [Uint256PrivateState, DivResultU256] {
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
    ...(mockDivU128 && {
      divU128Locally(
        context: WitnessContext<Ledger, Uint256PrivateState>,
        a: bigint,
        b: bigint,
      ): [Uint256PrivateState, DivResultU128] {
        const { quotient, remainder } = mockDivU128(a, b);
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
    divUint128Locally(
      context: WitnessContext<Ledger, Uint256PrivateState>,
      a: bigint,
      b: bigint,
    ): [Uint256PrivateState, DivResultU128] {
      return baseWitnesses.divUint128Locally(context, a, b);
    },
  };

  const contract = new Contract<Uint256PrivateState>(witnesses);

  const { currentPrivateState, currentContractState, currentZswapLocalState } =
    contract.initialState(
      constructorContext(Uint256PrivateState.generate(), sampleCoinPublicKey()),
    );

  const badSimulator = new Uint256Simulator();
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
