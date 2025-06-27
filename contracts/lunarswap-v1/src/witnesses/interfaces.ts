import type { WitnessContext } from "@midnight-ntwrk/compact-runtime";
import type {
	DivResultU128,
	U128,
} from "../artifacts/Lunarswap/contract/index.cjs";

export interface ILunarswapWitnesses<L, P> {
	sqrtU128Locally(context: WitnessContext<L, P>, radicand: U128): [P, bigint];

	divU128Locally(
		context: WitnessContext<L, P>,
		a: U128,
		b: U128,
	): [P, DivResultU128];

	divUint128Locally(
		context: WitnessContext<L, P>,
		a: bigint,
		b: bigint,
	): [P, DivResultU128];

	divUint254Locally(
		context: WitnessContext<L, P>,
		a: bigint,
		b: bigint,
	): [
		P,
		{
			quotient: {
				low: { low: bigint; high: bigint };
				high: { low: bigint; high: bigint };
			};
			remainder: {
				low: { low: bigint; high: bigint };
				high: { low: bigint; high: bigint };
			};
		},
	];
}

export type IShieldedFungibleTokenWitnesses<L, P> = Record<string, never>;
