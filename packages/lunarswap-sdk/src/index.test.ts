import { describe, expect, it } from "vitest";
import { calculateAddLiquidityAmounts, SLIPPAGE_TOLERANCE, calculateAmountOut } from "./index";

describe("Liquidity Calculations", () => {
	describe("calculateAddLiquidityAmounts", () => {
		it("should calculate amounts for existing pair", () => {
			const result = calculateAddLiquidityAmounts(1000n, 1000n, 2000n, 1000n, 50);
			expect(result.amountAOptimal).toBe(1000n);
			expect(result.amountBOptimal).toBe(500n);
			expect(result.amountAMin).toBe(995n);
			expect(result.amountBMin).toBe(497n);
		});

		it("should calculate amounts for new pair", () => {
			const result = calculateAddLiquidityAmounts(2000n, 1000n, 0n, 0n, 50);
			expect(result.amountAOptimal).toBe(2000n);
			expect(result.amountBOptimal).toBe(1000n);
			expect(result.amountAMin).toBe(1990n);
			expect(result.amountBMin).toBe(995n);
		});

		it("should handle different slippage tolerances", () => {
			const reserves = { usdc: 10000n, night: 5000n };
			const desired = { usdc: 1000n, night: 1000n };

			const veryLow = calculateAddLiquidityAmounts(
				desired.usdc,
				desired.night,
				reserves.usdc,
				reserves.night,
				SLIPPAGE_TOLERANCE.VERY_LOW,
			);
			const low = calculateAddLiquidityAmounts(
				desired.usdc,
				desired.night,
				reserves.usdc,
				reserves.night,
				SLIPPAGE_TOLERANCE.LOW,
			);

			// Higher slippage tolerance should result in lower minimum amounts
			expect(veryLow.amountAMin).toBeGreaterThan(low.amountAMin);
		});
	});

	describe("SLIPPAGE_TOLERANCE", () => {
		it("should have correct values", () => {
			expect(SLIPPAGE_TOLERANCE.VERY_LOW).toBe(10);
			expect(SLIPPAGE_TOLERANCE.LOW).toBe(50);
			expect(SLIPPAGE_TOLERANCE.MEDIUM).toBe(100);
			expect(SLIPPAGE_TOLERANCE.HIGH).toBe(500);
			expect(SLIPPAGE_TOLERANCE.VERY_HIGH).toBe(1000);
		});
	});

	describe("calculateAmountOut", () => {
		it("should calculate correct output amount for standard swap", () => {
			// Test case: 1000 USDC in, 10000 USDC reserve, 5000 NIGHT reserve, 0.3% fee
			const amountIn = 1000n;
			const reserveIn = 10000n;
			const reserveOut = 5000n;
			const fee = 30; // 30 basis points (0.3%)

			const amountOut = calculateAmountOut(amountIn, reserveIn, reserveOut, fee);

			// Expected calculation:
			// amountInWithFee = 1000 * (10000 - 30) = 1000 * 9970 = 9970000
			// numerator = 9970000 * 5000 = 49850000000
			// denominator = 10000 * 10000 + 9970000 = 100000000 + 9970000 = 109970000
			// amountOut = 49850000000 / 109970000 ≈ 453.27 ≈ 453
			expect(amountOut).toBe(453n);
		});

		it("should handle zero fee correctly", () => {
			const amountIn = 1000n;
			const reserveIn = 10000n;
			const reserveOut = 5000n;
			const fee = 0;

			const amountOut = calculateAmountOut(amountIn, reserveIn, reserveOut, fee);

			// With zero fee, should get exactly 500 (1000 * 5000 / 10000)
			expect(amountOut).toBe(500n);
		});

		it("should handle high fee correctly", () => {
			const amountIn = 1000n;
			const reserveIn = 10000n;
			const reserveOut = 5000n;
			const fee = 100; // 100 basis points (1%)

			const amountOut = calculateAmountOut(amountIn, reserveIn, reserveOut, fee);

			// With 1% fee, should get less than 500
			expect(amountOut).toBeLessThan(500n);
			expect(amountOut).toBeGreaterThan(0n);
		});

		it("should throw error for invalid amounts", () => {
			expect(() => calculateAmountOut(0n, 1000n, 1000n)).toThrow("Invalid amounts or reserves");
			expect(() => calculateAmountOut(1000n, 0n, 1000n)).toThrow("Invalid amounts or reserves");
			expect(() => calculateAmountOut(1000n, 1000n, 0n)).toThrow("Invalid amounts or reserves");
		});

		it("should throw error for invalid fee", () => {
			expect(() => calculateAmountOut(1000n, 1000n, 1000n, -1)).toThrow("Invalid fee");
			expect(() => calculateAmountOut(1000n, 1000n, 1000n, 10001)).toThrow("Invalid fee");
		});
	});
});
