import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  Contract,
  type ContractAddress,
  type Either,
  ledger,
  type ShieldedCoinInfo,
  type ZswapCoinPublicKey,
} from '@src/artifacts/shielded-token/ShieldedFungibleToken/contract/index.js';
import {
  ShieldedFungibleTokenPrivateState,
  ShieldedFungibleTokenWitnesses,
} from './witnesses/ShieldedFungibleToken.js';

/**
 * Base simulator for ShieldedFungibleToken contract
 */
const ShieldedFungibleTokenSimulatorBase = createSimulator<
  ShieldedFungibleTokenPrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof ShieldedFungibleTokenWitnesses>,
  Contract<ShieldedFungibleTokenPrivateState>,
  readonly [Uint8Array, string, string, Uint8Array]
>({
  contractFactory: (witnesses) =>
    new Contract<ShieldedFungibleTokenPrivateState>(witnesses),
  defaultPrivateState: () => ShieldedFungibleTokenPrivateState.generate(),
  contractArgs: (nonce, name, symbol, domain) => [nonce, name, symbol, domain],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => ShieldedFungibleTokenWitnesses(),
});

/**
 * @description A simulator implementation for testing ShieldedFungibleToken operations.
 */
export class ShieldedFungibleTokenSimulator extends ShieldedFungibleTokenSimulatorBase {
  constructor(
    nonce: Uint8Array,
    name: string,
    symbol: string,
    domain: Uint8Array,
    options: BaseSimulatorOptions<
      ShieldedFungibleTokenPrivateState,
      ReturnType<typeof ShieldedFungibleTokenWitnesses>
    > = {},
  ) {
    super([nonce, name, symbol, domain], options);
  }

  public name(): string {
    return this.circuits.impure.name();
  }

  public symbol(): string {
    return this.circuits.impure.symbol();
  }

  public decimals(): bigint {
    return this.circuits.impure.decimals();
  }

  public totalSupply(): bigint {
    return this.circuits.impure.totalSupply();
  }

  public mint(
    recipient: Either<ZswapCoinPublicKey, ContractAddress>,
    amount: bigint,
  ): ShieldedCoinInfo {
    return this.circuits.impure.mint(recipient, amount);
  }

  public burn(
    coin: ShieldedCoinInfo,
    amount: bigint,
  ): {
    change: { is_some: boolean; value: ShieldedCoinInfo };
    sent: ShieldedCoinInfo;
  } {
    return this.circuits.impure.burn(coin, amount);
  }
}
