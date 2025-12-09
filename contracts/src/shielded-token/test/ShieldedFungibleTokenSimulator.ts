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
} from '../../../artifacts/shielded-token/ShieldedFungibleToken/contract/index.cjs';
import type {
  CoinInfo,
  ContractAddress,
  Either,
  ZswapCoinPublicKey,
} from '../../types/StandardLibrary.js';
import type { IContractSimulator } from '../types/test.js';
import {
  ShieldedFungibleTokenPrivateState,
  ShieldedFungibleTokenWitnesses,
} from '../witnesses/index.js';

export class ShieldedFungibleTokenSimulator
  implements IContractSimulator<ShieldedFungibleTokenPrivateState, Ledger>
{
  readonly contract: Contract<ShieldedFungibleTokenPrivateState>;
  readonly contractAddress: string;
  readonly sender = sampleCoinPublicKey();
  circuitContext: CircuitContext<ShieldedFungibleTokenPrivateState>;

  constructor(
    nonce: Uint8Array,
    name: string,
    symbol: string,
    domain: Uint8Array,
    sender = sampleCoinPublicKey(),
  ) {
    this.contract = new Contract<ShieldedFungibleTokenPrivateState>(
      ShieldedFungibleTokenWitnesses(),
    );
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      constructorContext(ShieldedFungibleTokenPrivateState.generate(), sender),
      nonce,
      name,
      symbol,
      domain,
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

  public getCurrentPrivateState(): ShieldedFungibleTokenPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public getCurrentContractState(): ContractState {
    return this.circuitContext.originalState;
  }

  public name(): string {
    const result = this.contract.circuits.name(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public symbol(): string {
    const result = this.contract.circuits.symbol(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public decimals(): bigint {
    const result = this.contract.circuits.decimals(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public totalSupply(): bigint {
    const result = this.contract.circuits.totalSupply(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public type(): Uint8Array {
    const result = this.contract.circuits.type(this.circuitContext);
    this.circuitContext = result.context;
    return result.result;
  }

  public mint(
    recipient: Either<ZswapCoinPublicKey, ContractAddress>,
    amount: bigint,
  ): CoinInfo {
    const result = this.contract.circuits.mint(
      this.circuitContext,
      recipient,
      amount,
    );
    this.circuitContext = result.context;
    return result.result;
  }

  public burn(
    coin: CoinInfo,
    amount: bigint,
  ): {
    change: { is_some: boolean; value: CoinInfo };
    sent: CoinInfo;
  } {
    const result = this.contract.circuits.burn(
      this.circuitContext,
      coin,
      amount,
    );
    this.circuitContext = result.context;
    return result.result;
  }
}
