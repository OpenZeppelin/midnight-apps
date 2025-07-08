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
		feeToSetter: ZswapCoinPublicKey,
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
			feeToSetter,
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

	public addLiquidity(
		tokenA: CoinInfo,
		tokenB: CoinInfo,
		amountAMin: bigint,
		amountBMin: bigint,
		to: Either<ZswapCoinPublicKey, ContractAddress>,
		sender?: CoinPublicKey,
	): [bigint, bigint, bigint] {
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
		return result.result;
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

	public getLiquidityTokenName(sender?: CoinPublicKey): string {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getLiquidityTokenName(context);
		this.circuitContext = result.context;
		return result.result;
	}

	public getLiquidityTokenSymbol(sender?: CoinPublicKey): string {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getLiquidityTokenSymbol(context);
		this.circuitContext = result.context;
		return result.result;
	}

	public getLiquidityTokenDecimals(sender?: CoinPublicKey): bigint {
		const context = sender
			? {
					...this.circuitContext,
					currentZswapLocalState: emptyZswapLocalState(sender),
				}
			: this.circuitContext;
		const result = this.contract.circuits.getLiquidityTokenDecimals(context);
		this.circuitContext = result.context;
		return result.result;
	}

	public getLiquidityTotalSupply(
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
		const result = this.contract.circuits.getLiquidityTotalSupply(
			context,
			tokenA,
			tokenB,
		);
		this.circuitContext = result.context;
		return result.result;
	}
}
