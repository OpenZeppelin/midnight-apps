import type {
	CoinInfo,
	ContractAddress,
	Either,
	ZswapCoinPublicKey,
} from "@midnight-dapps/compact-std";
import {
	type CircuitContext,
	type CoinPublicKey,
	type ContractState,
	QueryContext,
	constructorContext,
	emptyZswapLocalState,
} from "@midnight-ntwrk/compact-runtime";
import {
	sampleCoinPublicKey,
	sampleContractAddress,
} from "@midnight-ntwrk/zswap";
import {
	Contract,
	type Ledger,
	type Pair,
	type QualifiedCoinInfo,
	ledger,
} from "../artifacts/Lunarswap/contract/index.cjs";
import type { IContractSimulator } from "../types/test";
import {
	LunarswapPrivateState,
	LunarswapWitnesses,
} from "../witnesses/Lunarswap";

export class LunarswapSimulator
	implements IContractSimulator<LunarswapPrivateState, Ledger>
{
	readonly contract: Contract<LunarswapPrivateState>;
	readonly contractAddress: string;
	readonly sender: CoinPublicKey;
	circuitContext: CircuitContext<LunarswapPrivateState>;

	constructor(
		lpName: string,
		lpSymbol: string,
		lpNonce: Uint8Array,
		lpDecimals: bigint,
		sender?: CoinPublicKey,
	) {
		this.contract = new Contract<LunarswapPrivateState>(LunarswapWitnesses());
		this.sender = sender ?? sampleCoinPublicKey();
		const {
			currentPrivateState,
			currentContractState,
			currentZswapLocalState,
		} = this.contract.initialState(
			constructorContext(LunarswapPrivateState.generate(), this.sender),
			lpName,
			lpSymbol,
			lpNonce,
			lpDecimals,
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

	public getCurrentPrivateState(): LunarswapPrivateState {
		return this.circuitContext.currentPrivateState;
	}

	public getCurrentContractState(): ContractState {
		return this.circuitContext.originalState;
	}

	public isPairExists(
		tokenA: CoinInfo,
		tokenB: CoinInfo,
		sender?: CoinPublicKey,
	): boolean {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.isPairExists(context, tokenA, tokenB);
		this.circuitContext = result.context;
		return result.result;
	}

	public addLiquidity(
		tokenA: CoinInfo,
		tokenB: CoinInfo,
		amountAMin: bigint,
		amountBMin: bigint,
		to: Either<ZswapCoinPublicKey, ContractAddress>,
		sender?: CoinPublicKey,
	): void {
		const result = this.contract.circuits.addLiquidity(
			{
				...this.circuitContext,
				currentZswapLocalState: sender
					? emptyZswapLocalState(sender)
					: this.circuitContext.currentZswapLocalState,
			},
			tokenA,
			tokenB,
			amountAMin,
			amountBMin,
			to,
		);
		this.circuitContext = result.context;
	}

	public removeLiquidity(
		tokenA: CoinInfo,
		tokenB: CoinInfo,
		liquidity: CoinInfo,
		amountAMin: bigint,
		amountBMin: bigint,
		to: Either<ZswapCoinPublicKey, ContractAddress>,
		sender?: CoinPublicKey,
	): void {
		const result = this.contract.circuits.removeLiquidity(
			{
				...this.circuitContext,
				currentZswapLocalState: sender
					? emptyZswapLocalState(sender)
					: this.circuitContext.currentZswapLocalState,
			},
			tokenA,
			tokenB,
			liquidity,
			amountAMin,
			amountBMin,
			to,
		);
		this.circuitContext = result.context;
	}

	public swapExactTokensForTokens(
		tokenIn: CoinInfo,
		tokenOut: CoinInfo,
		amountIn: bigint,
		amountOutMin: bigint,
		to: Either<ZswapCoinPublicKey, ContractAddress>,
		sender?: CoinPublicKey,
	): void {
		const result = this.contract.circuits.swapExactTokensForTokens(
			{
				...this.circuitContext,
				currentZswapLocalState: sender
					? emptyZswapLocalState(sender)
					: this.circuitContext.currentZswapLocalState,
			},
			tokenIn,
			tokenOut,
			amountIn,
			amountOutMin,
			to,
		);
		this.circuitContext = result.context;
	}

	public swapTokensForExactTokens(
		tokenIn: CoinInfo,
		tokenOut: CoinInfo,
		amountOut: bigint,
		amountInMax: bigint,
		to: Either<ZswapCoinPublicKey, ContractAddress>,
		sender?: CoinPublicKey,
	): void {
		const result = this.contract.circuits.swapTokensForExactTokens(
			{
				...this.circuitContext,
				currentZswapLocalState: sender
					? emptyZswapLocalState(sender)
					: this.circuitContext.currentZswapLocalState,
			},
			tokenIn,
			tokenOut,
			amountOut,
			amountInMax,
			to,
		);
		this.circuitContext = result.context;
	}

	public getPair(
		tokenA: CoinInfo,
		tokenB: CoinInfo,
		sender?: CoinPublicKey,
	): Pair {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getPair(context, tokenA, tokenB);
		this.circuitContext = result.context;
		return result.result;
	}

	public getPairReserves(
		tokenA: CoinInfo,
		tokenB: CoinInfo,
		sender?: CoinPublicKey,
	): [bigint, bigint] {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getPairReserves(
			context,
			tokenA,
			tokenB,
		);
		this.circuitContext = result.context;
		return result.result;
	}

	public getPairIdentity(
		tokenA: CoinInfo,
		tokenB: CoinInfo,
		sender?: CoinPublicKey,
	): Uint8Array {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getPairIdentity(
			context,
			tokenA,
			tokenB,
		);
		this.circuitContext = result.context;
		return result.result;
	}

	public getAllPairLength(sender?: CoinPublicKey): bigint {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getAllPairLength(context);
		this.circuitContext = result.context;
		return result.result;
	}

	public getLpTokenName(sender?: CoinPublicKey): string {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getLpTokenName(context);
		this.circuitContext = result.context;
		return result.result;
	}

	public getLpTokenSymbol(sender?: CoinPublicKey): string {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getLpTokenSymbol(context);
		this.circuitContext = result.context;
		return result.result;
	}

	public getLpTokenDecimals(sender?: CoinPublicKey): bigint {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getLpTokenDecimals(context);
		this.circuitContext = result.context;
		return result.result;
	}

	public getLpTokenTotalSupply(
		tokenA: CoinInfo,
		tokenB: CoinInfo,
		sender?: CoinPublicKey,
	): QualifiedCoinInfo {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getLpTokenTotalSupply(
			context,
			tokenA,
			tokenB,
		);
		this.circuitContext = result.context;
		return result.result;
	}
}
