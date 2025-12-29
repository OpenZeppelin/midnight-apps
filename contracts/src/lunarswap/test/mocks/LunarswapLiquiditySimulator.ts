import {
  Contract,
  ledger,
} from '@artifacts/lunarswap/test/mocks/contracts/LunarswapLiquidity.mock/contract/index.js';
import type {
  ContractAddress,
  Either,
  QualifiedShieldedCoinInfo,
  ShieldedCoinInfo,
  ShieldedSendResult,
  ZswapCoinPublicKey,
} from '@artifacts/lunarswap/test/mocks/contracts/LunarswapLiquidity.mock/contract/index.js';
import {
  type BaseSimulatorOptions,
  createSimulator,
} from '@openzeppelin/compact-tools-simulator';
import {
  LunarswapLiquidityPrivateState,
  LunarswapLiquidityWitnesses,
} from './witnesses/LunarswapLiquidity.js';

// Constructor args type
type LunarswapLiquidityArgs = readonly [
  Uint8Array, // nonce
  { inner: unknown }, // name (Opaque<"string">)
  { inner: unknown }, // symbol (Opaque<"string">)
  bigint, // decimals
];

/**
 * Base simulator for LunarswapLiquidity mock contract
 */
const LunarswapLiquiditySimulatorBase = createSimulator<
  LunarswapLiquidityPrivateState,
  ReturnType<typeof ledger>,
  ReturnType<typeof LunarswapLiquidityWitnesses>,
  Contract<LunarswapLiquidityPrivateState>,
  LunarswapLiquidityArgs
>({
  contractFactory: (witnesses) =>
    new Contract<LunarswapLiquidityPrivateState>(witnesses),
  defaultPrivateState: () => LunarswapLiquidityPrivateState.generate(),
  contractArgs: (nonce, name, symbol, decimals) => [
    nonce,
    name,
    symbol,
    decimals,
  ],
  ledgerExtractor: (state) => ledger(state),
  witnessesFactory: () => LunarswapLiquidityWitnesses(),
});

/**
 * @description A simulator implementation for testing LunarswapLiquidity operations.
 */
export class LunarswapLiquiditySimulator extends LunarswapLiquiditySimulatorBase {
  constructor(
    nonce: Uint8Array,
    name: string,
    symbol: string,
    decimals: bigint,
    options: BaseSimulatorOptions<
      LunarswapLiquidityPrivateState,
      ReturnType<typeof LunarswapLiquidityWitnesses>
    > = {},
  ) {
    super([nonce, { inner: name }, { inner: symbol }, decimals], options);
  }

  // Pair token initialization
  public initializePairToken(id: Uint8Array): void {
    this.circuits.impure.initializePairToken(id);
  }

  // Query operations
  public getTotalSupply(id: Uint8Array): QualifiedShieldedCoinInfo {
    return this.circuits.impure.getTotalSupply(id);
  }

  // Mint and burn operations
  public mint(
    id: Uint8Array,
    recipient: Either<ZswapCoinPublicKey, ContractAddress>,
    amount: bigint,
  ): ShieldedCoinInfo {
    return this.circuits.impure.mint(id, recipient, amount);
  }

  public burn(
    id: Uint8Array,
    coin: ShieldedCoinInfo,
    amount: bigint,
  ): ShieldedSendResult {
    return this.circuits.impure.burn(id, coin, amount);
  }
}
