import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import type {
  ContractAddress,
  Either,
  ShieldedCoinInfo,
  Witnesses,
  ZswapCoinPublicKey,
} from '@src/artifacts/shielded-token/ShieldedFungibleToken/contract/index.js';
import {
  Contract,
  ledger,
} from '@src/artifacts/shielded-token/ShieldedFungibleToken/contract/index.js';

export type ShieldedFungibleTokenPrivateState = Record<string, never>;

export const ShieldedFungibleTokenWitnesses =
  (): Witnesses<ShieldedFungibleTokenPrivateState> => ({});

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
  defaultPrivateState: (): ShieldedFungibleTokenPrivateState => ({}),
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

  public color(): Uint8Array {
    return this.circuits.impure.color();
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
