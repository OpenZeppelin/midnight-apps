/**
 * Calculates the optimal dependent amount for a given independent amount when adding liquidity
 * This is similar to Uniswap V2's getDependentAmountFromV2Pair function
 *
 * @param independentAmount - The amount of the independent token
 * @param reserveIndependent - Current reserve of the independent token
 * @param reserveDependent - Current reserve of the dependent token
 * @returns The optimal amount of the dependent token
 */
export function calculateOptimalDependentAmount(
	independentAmount: bigint,
	reserveIndependent: bigint,
	reserveDependent: bigint,
): bigint {
	if (
		independentAmount <= 0n ||
		reserveIndependent <= 0n ||
		reserveDependent <= 0n
	) {
		throw new Error("Invalid amounts or reserves");
	}

	// Formula: (independentAmount * reserveDependent) / reserveIndependent
	return (independentAmount * reserveDependent) / reserveIndependent;
}

/**
 * Calculates minimum amounts based on slippage tolerance
 *
 * @param optimalAmount - The optimal amount calculated
 * @param slippageTolerance - Slippage tolerance in basis points (e.g., 50 = 0.5%)
 * @returns The minimum amount based on slippage tolerance
 */
export function calculateMinimumAmount(
	optimalAmount: bigint,
	slippageTolerance: number,
): bigint {
	if (slippageTolerance < 0 || slippageTolerance > 10000) {
		throw new Error(
			"Invalid slippage tolerance. Must be between 0 and 10000 basis points",
		);
	}

	// slippageTolerance is in basis points (e.g., 50 = 0.5%)
	const slippageMultiplier = 10000 - slippageTolerance;
	return (optimalAmount * BigInt(slippageMultiplier)) / 10000n;
}

/**
 * Calculates optimal amounts for both tokens when adding liquidity to an existing pair
 *
 * @param amountADesired - The desired amount of token A
 * @param amountBDesired - The desired amount of token B
 * @param reserveA - Current reserve of token A in the pair
 * @param reserveB - Current reserve of token B in the pair
 * @returns Object with optimal amounts for both tokens
 */
export function calculateOptimalAmounts(
	amountADesired: bigint,
	amountBDesired: bigint,
	reserveA: bigint,
	reserveB: bigint,
): { amountAOptimal: bigint; amountBOptimal: bigint } {
	if (
		amountADesired <= 0n ||
		amountBDesired <= 0n ||
		reserveA <= 0n ||
		reserveB <= 0n
	) {
		throw new Error("Invalid amounts or reserves");
	}

	// Calculate optimal amount B based on desired amount A
	const amountBOptimalFromA = calculateOptimalDependentAmount(
		amountADesired,
		reserveA,
		reserveB,
	);

	// Calculate optimal amount A based on desired amount B
	const amountAOptimalFromB = calculateOptimalDependentAmount(
		amountBDesired,
		reserveB,
		reserveA,
	);

	let amountAOptimal: bigint;
	let amountBOptimal: bigint;

	// Determine which calculation to use based on which optimal amount fits within desired amounts
	if (amountBOptimalFromA <= amountBDesired) {
		// Use amount A as the independent amount
		amountAOptimal = amountADesired;
		amountBOptimal = amountBOptimalFromA;
	} else {
		// Use amount B as the independent amount
		amountAOptimal = amountAOptimalFromB;
		amountBOptimal = amountBDesired;
	}

	return { amountAOptimal, amountBOptimal };
}

/**
 * Calculates optimal amounts and minimum amounts for adding liquidity with slippage tolerance
 * This is the main function that clients should use to prepare addLiquidity parameters
 *
 * @param amountADesired - The desired amount of token A
 * @param amountBDesired - The desired amount of token B
 * @param reserveA - Current reserve of token A in the pair
 * @param reserveB - Current reserve of token B in the pair
 * @param slippageTolerance - Slippage tolerance in basis points (e.g., 50 = 0.5%)
 * @returns Object with optimal amounts and minimum amounts for both tokens
 */
export function calculateAddLiquidityAmounts(
	amountADesired: bigint,
	amountBDesired: bigint,
	reserveA: bigint,
	reserveB: bigint,
	slippageTolerance: number,
): {
	amountAOptimal: bigint;
	amountBOptimal: bigint;
	amountAMin: bigint;
	amountBMin: bigint;
} {
	// Check if this is a new pair (no existing liquidity)
	if (reserveA === 0n && reserveB === 0n) {
		// For new pairs, optimal amounts are the desired amounts
		const amountAOptimal = amountADesired;
		const amountBOptimal = amountBDesired;
		const amountAMin = calculateMinimumAmount(amountAOptimal, slippageTolerance);
		const amountBMin = calculateMinimumAmount(amountBOptimal, slippageTolerance);

		return {
			amountAOptimal,
			amountBOptimal,
			amountAMin,
			amountBMin,
		};
	}

	// For existing pairs, calculate optimal amounts
	const { amountAOptimal, amountBOptimal } = calculateOptimalAmounts(
		amountADesired,
		amountBDesired,
		reserveA,
		reserveB,
	);

	const amountAMin = calculateMinimumAmount(amountAOptimal, slippageTolerance);
	const amountBMin = calculateMinimumAmount(amountBOptimal, slippageTolerance);

	return {
		amountAOptimal,
		amountBOptimal,
		amountAMin,
		amountBMin,
	};
}

/**
 * Helper function to determine if a pair exists and has liquidity
 *
 * @param reserveA - Current reserve of token A
 * @param reserveB - Current reserve of token B
 * @returns True if the pair has liquidity, false otherwise
 */
export function hasLiquidity(reserveA: bigint, reserveB: bigint): boolean {
	return reserveA > 0n && reserveB > 0n;
}

/**
 * Helper function to check if amounts are valid for liquidity provision
 *
 * @param amountA - Amount of token A
 * @param amountB - Amount of token B
 * @returns True if amounts are valid, false otherwise
 */
export function isValidLiquidityAmounts(
	amountA: bigint,
	amountB: bigint,
): boolean {
	return amountA > 0n && amountB > 0n;
}

/**
 * Common slippage tolerance values in basis points
 */
export const SLIPPAGE_TOLERANCE = {
	VERY_LOW: 10, // 0.1%
	LOW: 50, // 0.5%
	MEDIUM: 100, // 1%
	HIGH: 500, // 5%
	VERY_HIGH: 1000, // 10%
} as const;

/**
 * Calculates minimum amounts for liquidity removal based on LP token proportion
 * This is useful for removeLiquidity operations
 *
 * @param lpTokensToRemove - The amount of LP tokens to remove
 * @param totalLpSupply - The total supply of LP tokens for the pair
 * @param reserveA - Current reserve of token A in the pair
 * @param reserveB - Current reserve of token B in the pair
 * @param slippageTolerance - Slippage tolerance in basis points (e.g., 50 = 0.5%)
 * @returns Object with minimum amounts for both tokens
 */
export function calculateRemoveLiquidityMinimums(
	lpTokensToRemove: bigint,
	totalLpSupply: bigint,
	reserveA: bigint,
	reserveB: bigint,
	slippageTolerance: number = SLIPPAGE_TOLERANCE.LOW,
): { amountAMin: bigint; amountBMin: bigint } {
	if (lpTokensToRemove <= 0n || totalLpSupply <= 0n || reserveA <= 0n || reserveB <= 0n) {
		throw new Error("Invalid amounts or reserves");
	}

	if (lpTokensToRemove > totalLpSupply) {
		throw new Error("Cannot remove more LP tokens than total supply");
	}

	// Calculate expected token amounts based on LP token proportion
	// Use total LP supply as the denominator - this is the standard Uniswap V2 formula
	const expectedAmountA = (lpTokensToRemove * reserveA) / totalLpSupply;
	const expectedAmountB = (lpTokensToRemove * reserveB) / totalLpSupply;

	// Calculate minimum amounts using slippage tolerance
	const amountAMin = calculateMinimumAmount(expectedAmountA, slippageTolerance);
	const amountBMin = calculateMinimumAmount(expectedAmountB, slippageTolerance);

	return { amountAMin, amountBMin };
}

/**
 * Calculates the output amount for a token swap using the constant product formula
 * This is similar to Uniswap V2's getAmountOut function
 *
 * @param amountIn - The input amount of tokens
 * @param reserveIn - Current reserve of the input token
 * @param reserveOut - Current reserve of the output token
 * @param fee - Swap fee in basis points (e.g., 30 = 0.3%)
 * @returns The output amount of tokens
 */
export function calculateAmountOut(
	amountIn: bigint,
	reserveIn: bigint,
	reserveOut: bigint,
	fee = 30, // Default 0.3% fee
): bigint {
	if (amountIn <= 0n || reserveIn <= 0n || reserveOut <= 0n) {
		throw new Error("Invalid amounts or reserves");
	}

	if (fee < 0 || fee > 10000) {
		throw new Error("Invalid fee. Must be between 0 and 10000 basis points");
	}

	// Calculate amount in with fee
	const amountInWithFee = amountIn * BigInt(10000 - fee);
	
	// Calculate numerator: amountInWithFee * reserveOut
	const numerator = amountInWithFee * reserveOut;
	
	// Calculate denominator: reserveIn * 10000 + amountInWithFee
	const denominator = reserveIn * 10000n + amountInWithFee;
	
	// Output amount = numerator / denominator
	return numerator / denominator;
}
