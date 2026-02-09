import { encodeCoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import type { CoinInfo } from '@openzeppelin-midnight-apps/compact-std';
import {
  calculateAddLiquidityAmounts,
  computeAmountOutMin,
  SLIPPAGE_TOLERANCE,
} from '@openzeppelin-midnight-apps/lunarswap-sdk';
import { beforeEach, describe, expect, it } from 'vitest';
import { LunarswapSimulator } from './LunarswapSimulator';
import { ShieldedFungibleTokenSimulator } from './ShieldedFungibleTokenSimulator';

const NONCE = new Uint8Array(32).fill(0x44);
const DOMAIN = new Uint8Array(32).fill(0x44);
const LP_USER =
  'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';
const USER_2 =
  'b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef12345678';

// Helper function to create Either for hex addresses
const createEitherFromHex = (hexString: string) => ({
  is_left: true,
  left: { bytes: encodeCoinPublicKey(hexString) },
  right: { bytes: new Uint8Array(32) },
});

describe('swap', () => {
  let lunarswap: LunarswapSimulator;
  let usdc: ShieldedFungibleTokenSimulator;
  let night: ShieldedFungibleTokenSimulator;
  let foo: ShieldedFungibleTokenSimulator;
  let recipient: ReturnType<typeof createEitherFromHex>;
  let user2Recipient: ReturnType<typeof createEitherFromHex>;

  beforeEach(() => {
    lunarswap = new LunarswapSimulator('Lunarswap LP', 'LP', NONCE, 18n);
    usdc = new ShieldedFungibleTokenSimulator(NONCE, 'USDC', 'USDC', NONCE);
    night = new ShieldedFungibleTokenSimulator(NONCE, 'Night', 'NIGHT', DOMAIN);
    foo = new ShieldedFungibleTokenSimulator(NONCE, 'Foo', 'FOO', DOMAIN);
    recipient = createEitherFromHex(LP_USER);
    user2Recipient = createEitherFromHex(USER_2);
  });

  describe('swapExactTokensForTokens', () => {
    let usdcCoin: CoinInfo;
    let nightCoin: CoinInfo;

    beforeEach(() => {
      // Setup initial liquidity
      usdcCoin = usdc.mint(recipient, 10000n);
      nightCoin = night.mint(recipient, 5000n);
      const result = calculateAddLiquidityAmounts(
        10000n,
        5000n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );

      // Add liquidity and handle potential errors
      try {
        lunarswap.addLiquidity(
          usdcCoin,
          nightCoin,
          result.amountAMin,
          result.amountBMin,
          recipient,
        );
      } catch (error) {
        console.error('addLiquidity failed:', error);
        throw error;
      }

      // Verify the pair exists before getting reserves
      const pairExists = lunarswap.isPairExists(usdcCoin, nightCoin);
      if (!pairExists) {
        throw new Error('Pair was not created after addLiquidity');
      }
    });

    // Debug test to verify pair creation
    it('should create a valid liquidity pair', () => {
      // Verify the pair exists
      const pair = lunarswap.getPair(usdcCoin, nightCoin);
      expect(pair).toBeDefined();

      // Verify reserves are set correctly
      const reserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
      expect(reserves[0].value).toBeGreaterThan(0n);
      expect(reserves[1].value).toBeGreaterThan(0n);

      // Verify we can find the pair pairId
      const pairId = lunarswap.getPairId(usdcCoin, nightCoin);
      expect(pairId).toBeDefined();
    });

    describe('Normal Cases', () => {
      it('should swap exact tokens for tokens (USDC to NIGHT) with correct reserves update', () => {
        const amountIn = 2000n;
        const swapUsdcCoin = usdc.mint(recipient, amountIn);
        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preK = preReserves[0].value * preReserves[1].value;

        // Calculate expected output using the AMM formula
        const fee = 30n; // 0.3% fee
        const amountInWithFee = amountIn * (10000n - fee);
        const numerator = amountInWithFee * preReserves[1].value;
        const denominator = preReserves[0].value * 10000n + amountInWithFee;
        const expectedAmountOut = numerator / denominator;

        // Use the new slippage calculation function
        const amountOutMin = computeAmountOutMin(
          expectedAmountOut,
          SLIPPAGE_TOLERANCE.LOW,
        );

        lunarswap.swapExactTokensForTokens(
          swapUsdcCoin,
          nightCoin,
          amountIn,
          amountOutMin,
          recipient,
        );

        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const postK = postReserves[0].value * postReserves[1].value;

        expect(postK).toBeGreaterThan(preK);
        expect(postReserves[1].value).toBeLessThan(preReserves[1].value);
        expect(postReserves[1].value).toBeGreaterThan(0n);
      });
    });

    describe('Edge Cases', () => {
      it('should handle minimum slippage tolerance', () => {
        const amountIn = 2000n; // Use large amount
        const amountOutMin = 950n; // Higher than expected output (~831)

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountIn);

        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin, // Use fresh token coin for swap
            nightCoin,
            amountIn,
            amountOutMin,
            recipient,
          );
        }).toThrow(
          'LunarswapRouter: swapExactTokensForTokens() - Insufficient output amount',
        );
      });

      it('should handle zero amountOutMin', () => {
        const amountIn = 2000n; // Use large amount
        const amountOutMin = 0n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountIn);

        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin, // Use fresh token coin for swap
            nightCoin,
            amountIn,
            amountOutMin,
            recipient,
          );
        }).not.toThrow();
      });

      it('should handle very small input amounts', () => {
        const amountIn = 500n; // Use a reasonable small amount (10% of NIGHT reserve)
        const amountOutMin = 0n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountIn);

        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin, // Use fresh token coin for swap
            nightCoin,
            amountIn,
            amountOutMin,
            recipient,
          );
        }).not.toThrow();
      });

      it('should handle equal token amounts in reserves', () => {
        // Use 5000/5000 to provide sufficient liquidity for swaps
        const localLunarswap = new LunarswapSimulator(
          'Lunarswap LP',
          'LP',
          NONCE,
          18n,
        );
        const localUsdc = new ShieldedFungibleTokenSimulator(
          NONCE,
          'USDC',
          'USDC',
          NONCE,
        );
        const localNight = new ShieldedFungibleTokenSimulator(
          NONCE,
          'Night',
          'NIGHT',
          DOMAIN,
        );
        const localRecipient = createEitherFromHex(LP_USER);
        const equalUsdc = localUsdc.mint(localRecipient, 5000n);
        const equalNight = localNight.mint(localRecipient, 5000n);
        const result = calculateAddLiquidityAmounts(
          5000n,
          5000n,
          0n,
          0n,
          SLIPPAGE_TOLERANCE.LOW,
        );
        localLunarswap.addLiquidity(
          equalUsdc,
          equalNight,
          result.amountAMin,
          result.amountBMin,
          localRecipient,
        );

        const amountIn = 1000n; // Use reasonable amount for equal reserves
        const amountOutMin = 0n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = localUsdc.mint(localRecipient, amountIn);

        expect(() => {
          localLunarswap.swapExactTokensForTokens(
            swapUsdcCoin, // Use fresh token coin for swap
            equalNight,
            amountIn,
            amountOutMin,
            localRecipient,
          );
        }).not.toThrow();
      });
    });

    describe('Error Handling', () => {
      it('should fail if amountOutMin is too high', () => {
        const amountIn = 1000n;
        const amountOutMin = 2000n; // Unrealistically high

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountIn);

        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin,
            nightCoin,
            amountIn,
            amountOutMin,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if input amount is zero', () => {
        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, 1000n);

        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin,
            nightCoin,
            0n,
            1n,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if input amount is negative (handled as zero)', () => {
        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, 1000n);

        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin,
            nightCoin,
            -1n,
            1n,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if pair does not exist', () => {
        const fooCoin = foo.mint(recipient, 1000n);
        const swapUsdcCoin = usdc.mint(recipient, 100n);

        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin,
            fooCoin,
            100n,
            1n,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if both tokens are the same', () => {
        const swapUsdcCoin = usdc.mint(recipient, 100n);

        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin,
            swapUsdcCoin,
            100n,
            1n,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if amountIn exceeds available liquidity', () => {
        const excessiveAmount = 20000n; // More than total reserves

        // Calculate expected output for the excessive input
        const fee = 30n; // 0.3% fee
        const amountInWithFee = excessiveAmount * (10000n - fee);
        const numerator = amountInWithFee * 5000n; // NIGHT reserve
        const denominator = 10000n * 10000n + amountInWithFee; // USDC reserve
        const expectedAmountOut = numerator / denominator;

        // Set a minimum higher than the expected output to force failure
        const amountOutMin = expectedAmountOut + 100n; // Higher than expected output

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, excessiveAmount);

        // This should fail due to insufficient output amount (huge slippage)
        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin,
            nightCoin,
            excessiveAmount,
            amountOutMin,
            recipient,
          );
        }).toThrow(
          'LunarswapRouter: swapExactTokensForTokens() - Insufficient output amount',
        );
      });

      it('should succeed with excessive input but low minimum', () => {
        const excessiveAmount = 20000n; // More than total reserves
        const amountOutMin = 1n; // Low minimum allows huge slippage

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, excessiveAmount);

        // This should succeed but with huge slippage (like Uniswap V2)
        expect(() => {
          lunarswap.swapExactTokensForTokens(
            swapUsdcCoin,
            nightCoin,
            excessiveAmount,
            amountOutMin,
            recipient,
          );
        }).not.toThrow();
      });
    });

    describe('Mathematical Verification', () => {
      it('should maintain constant product formula (k = x * y)', () => {
        const amountIn = 2000n; // Use large amount
        const amountOutMin = 800n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountIn);

        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preK = preReserves[0].value * preReserves[1].value;

        lunarswap.swapExactTokensForTokens(
          swapUsdcCoin, // Use fresh token coin for swap
          nightCoin,
          amountIn,
          amountOutMin,
          recipient,
        );

        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const postK = postReserves[0].value * postReserves[1].value;

        // K should increase slightly due to fees
        expect(postK).toBeGreaterThan(preK);
      });

      it('should calculate correct output amount based on input', () => {
        const amountIn = 2000n;
        const amountOutMin = 0n;
        const swapUsdcCoin = usdc.mint(recipient, amountIn);
        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preK = preReserves[0].value * preReserves[1].value;
        lunarswap.swapExactTokensForTokens(
          swapUsdcCoin,
          nightCoin,
          amountIn,
          amountOutMin,
          recipient,
        );
        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const postK = postReserves[0].value * postReserves[1].value;
        expect(postK).toBeGreaterThan(preK);
        const actualAmountOut = preReserves[1].value - postReserves[1].value;
        expect(actualAmountOut).toBeGreaterThan(0n);
      });
    });
  });

  describe('swapTokensForExactTokens', () => {
    let usdcCoin: CoinInfo;
    let nightCoin: CoinInfo;

    beforeEach(() => {
      // Setup initial liquidity
      usdcCoin = usdc.mint(recipient, 10000n);
      nightCoin = night.mint(recipient, 5000n);
      const result = calculateAddLiquidityAmounts(
        10000n,
        5000n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );

      // Add liquidity and handle potential errors
      try {
        lunarswap.addLiquidity(
          usdcCoin,
          nightCoin,
          result.amountAMin,
          result.amountBMin,
          recipient,
        );
      } catch (error) {
        console.error('addLiquidity failed:', error);
        throw error;
      }

      // Verify the pair exists before getting reserves
      const pairExists = lunarswap.isPairExists(usdcCoin, nightCoin);
      if (!pairExists) {
        throw new Error('Pair was not created after addLiquidity');
      }
    });

    // Debug test to verify pair creation
    it('should create a valid liquidity pair', () => {
      // Verify the pair exists
      const pair = lunarswap.getPair(usdcCoin, nightCoin);
      expect(pair).toBeDefined();

      // Verify reserves are set correctly
      const reserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
      expect(reserves[0].value).toBeGreaterThan(0n);
      expect(reserves[1].value).toBeGreaterThan(0n);

      // Verify we can find the pair pairId
      const pairId = lunarswap.getPairId(usdcCoin, nightCoin);
      expect(pairId).toBeDefined();
    });

    describe('Normal Cases', () => {
      it('should swap tokens for exact tokens (USDC to NIGHT) with correct reserves update', () => {
        const amountOut = 800n;
        const amountInMax = 2500n;
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);
        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preK = preReserves[0].value * preReserves[1].value;
        lunarswap.swapTokensForExactTokens(
          swapUsdcCoin,
          nightCoin,
          amountOut,
          amountInMax,
          recipient,
        );
        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const postK = postReserves[0].value * postReserves[1].value;
        expect(postK).toBeGreaterThan(preK);
        expect(postReserves[1].value).toBeLessThan(preReserves[1].value);
        expect(postReserves[1].value).toBeGreaterThan(0n);
      });

      it('should swap tokens for exact tokens (NIGHT to USDC) with correct reserves update', () => {
        const amountOut = 1500n; // Use reasonable output amount
        const amountInMax = 4000n; // Allow some slippage

        // Create fresh token coins for the swap
        const swapNightCoin = night.mint(recipient, amountInMax);

        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preUsdcReserve = preReserves[0].value;
        const preNightReserve = preReserves[1].value;

        lunarswap.swapTokensForExactTokens(
          swapNightCoin, // Use fresh token coin for swap
          usdcCoin,
          amountOut,
          amountInMax,
          recipient,
        );

        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const postUsdcReserve = postReserves[0].value;
        const postNightReserve = postReserves[1].value;

        // Verify basic reserve updates
        expect(postUsdcReserve).toBe(preUsdcReserve - amountOut);
        expect(postNightReserve).toBeGreaterThan(preNightReserve);
        expect(postNightReserve).toBeLessThanOrEqual(
          preNightReserve + amountInMax,
        );
      });

      it('should handle small output amounts correctly', () => {
        const amountOut = 200n; // Use reasonable small amount
        const amountInMax = 600n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);

        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preUsdcReserve = preReserves[0].value;
        const preNightReserve = preReserves[1].value;

        lunarswap.swapTokensForExactTokens(
          swapUsdcCoin, // Use fresh token coin for swap
          nightCoin,
          amountOut,
          amountInMax,
          recipient,
        );

        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        expect(postReserves[1].value).toBe(preNightReserve - amountOut);
        expect(postReserves[0].value).toBeGreaterThan(preUsdcReserve);
      });

      it('should handle large output amounts correctly', () => {
        const amountOut = 2000n; // Large amount relative to reserves
        const amountInMax = 6000n;
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);
        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preUsdcReserve = preReserves[0];
        const preNightReserve = preReserves[1];
        try {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin, // Use fresh token coin for swap
            nightCoin,
            amountOut,
            amountInMax,
            recipient,
          );
          const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
          const actualNightDelta =
            preNightReserve.value - postReserves[1].value;
          expect(actualNightDelta).toBeGreaterThanOrEqual(amountOut - 1n);
          expect(actualNightDelta).toBeLessThanOrEqual(amountOut + 1n);
          // Also check input constraint
          const actualUsdcDelta = postReserves[0].value - preUsdcReserve.value;
          expect(actualUsdcDelta).toBeLessThanOrEqual(amountInMax);
        } catch (e) {
          expect(() => {
            throw e;
          }).toThrow(
            'LunarswapRouter: swapTokensForExactTokens() - Insufficient input amount',
          );
        }
      });

      it('should swap to different recipient', () => {
        const amountOut = 800n; // Use reasonable amount
        const amountInMax = 2500n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);

        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preUsdcReserve = preReserves[0];
        const preNightReserve = preReserves[1];

        lunarswap.swapTokensForExactTokens(
          swapUsdcCoin, // Use fresh token coin for swap
          nightCoin,
          amountOut,
          amountInMax,
          user2Recipient,
        );

        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        expect(postReserves[1].value).toBe(preNightReserve.value - amountOut);
        expect(postReserves[0].value).toBeGreaterThan(preUsdcReserve.value);
      });

      it('should handle equal token amounts in reserves', () => {
        // Use 5000/5000 to provide sufficient liquidity for swaps
        const localLunarswap = new LunarswapSimulator(
          'Lunarswap LP',
          'LP',
          NONCE,
          18n,
        );
        const localUsdc = new ShieldedFungibleTokenSimulator(
          NONCE,
          'USDC',
          'USDC',
          NONCE,
        );
        const localNight = new ShieldedFungibleTokenSimulator(
          NONCE,
          'Night',
          'NIGHT',
          DOMAIN,
        );
        const localRecipient = createEitherFromHex(LP_USER);
        const equalUsdc = localUsdc.mint(localRecipient, 5000n);
        const equalNight = localNight.mint(localRecipient, 5000n);
        const result = calculateAddLiquidityAmounts(
          5000n,
          5000n,
          0n,
          0n,
          SLIPPAGE_TOLERANCE.LOW,
        );
        localLunarswap.addLiquidity(
          equalUsdc,
          equalNight,
          result.amountAMin,
          result.amountBMin,
          localRecipient,
        );

        const amountOut = 500n; // Use reasonable amount for equal reserves
        const amountInMax = 2000n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = localUsdc.mint(localRecipient, amountInMax);

        expect(() => {
          localLunarswap.swapTokensForExactTokens(
            swapUsdcCoin, // Use fresh token coin for swap
            equalNight,
            amountOut,
            amountInMax,
            localRecipient,
          );
        }).not.toThrow();
      });
    });

    describe('Edge Cases', () => {
      it('should handle maximum slippage tolerance', () => {
        const amountOut = 800n; // Use large amount
        const amountInMax = 3000n; // Use a more realistic max input

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin, // Use fresh token coin for swap
            nightCoin,
            amountOut,
            amountInMax,
            recipient,
          );
        }).not.toThrow();
      });

      it('should handle zero amountInMax (should fail)', () => {
        const amountOut = 800n; // Use large amount
        const amountInMax = 0n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, 1000n);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin,
            nightCoin,
            amountOut,
            amountInMax,
            recipient,
          );
        }).toThrow();
      });

      it('should handle very small output amounts', () => {
        const amountOut = 100n; // Use a reasonable small amount
        const amountInMax = 400n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin, // Use fresh token coin for swap
            nightCoin,
            amountOut,
            amountInMax,
            recipient,
          );
        }).not.toThrow();
      });

      it('should handle equal token amounts in reserves', () => {
        // Use 5000/5000 to provide sufficient liquidity for swaps
        const localLunarswap = new LunarswapSimulator(
          'Lunarswap LP',
          'LP',
          NONCE,
          18n,
        );
        const localUsdc = new ShieldedFungibleTokenSimulator(
          NONCE,
          'USDC',
          'USDC',
          NONCE,
        );
        const localNight = new ShieldedFungibleTokenSimulator(
          NONCE,
          'Night',
          'NIGHT',
          DOMAIN,
        );
        const localRecipient = createEitherFromHex(LP_USER);
        const equalUsdc = localUsdc.mint(localRecipient, 5000n);
        const equalNight = localNight.mint(localRecipient, 5000n);
        const result = calculateAddLiquidityAmounts(
          5000n,
          5000n,
          0n,
          0n,
          SLIPPAGE_TOLERANCE.LOW,
        );
        localLunarswap.addLiquidity(
          equalUsdc,
          equalNight,
          result.amountAMin,
          result.amountBMin,
          localRecipient,
        );

        const amountOut = 500n; // Use reasonable amount for equal reserves
        const amountInMax = 2000n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = localUsdc.mint(localRecipient, amountInMax);

        expect(() => {
          localLunarswap.swapTokensForExactTokens(
            swapUsdcCoin, // Use fresh token coin for swap
            equalNight,
            amountOut,
            amountInMax,
            localRecipient,
          );
        }).not.toThrow();
      });
    });

    describe('Error Handling', () => {
      it('should fail if amountInMax is too low', () => {
        const amountOut = 900n;
        const amountInMax = 100n; // Too low for the output

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, 1000n);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin,
            nightCoin,
            amountOut,
            amountInMax,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if output amount is zero', () => {
        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, 1000n);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin,
            nightCoin,
            0n,
            1000n,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if output amount is negative', () => {
        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, 1000n);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin,
            nightCoin,
            -1n,
            1000n,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if pair does not exist', () => {
        const fooCoin = foo.mint(recipient, 1000n);
        const swapUsdcCoin = usdc.mint(recipient, 1000n);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin,
            fooCoin,
            100n,
            1000n,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if both tokens are the same', () => {
        const swapUsdcCoin = usdc.mint(recipient, 1000n);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin,
            swapUsdcCoin,
            100n,
            1000n,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if amountOut exceeds available liquidity', () => {
        const excessiveAmount = 10000n; // More than total reserves
        const amountInMax = 1000n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin,
            nightCoin,
            excessiveAmount,
            amountInMax,
            recipient,
          );
        }).toThrow();
      });

      it('should fail if amountInMax is negative', () => {
        const swapUsdcCoin = usdc.mint(recipient, 1000n);

        expect(() => {
          lunarswap.swapTokensForExactTokens(
            swapUsdcCoin,
            nightCoin,
            100n,
            -1n,
            recipient,
          );
        }).toThrow();
      });
    });

    describe('Mathematical Verification', () => {
      it('should maintain constant product formula (k = x * y)', () => {
        const amountOut = 800n; // Use large amount
        const amountInMax = 3000n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);

        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preK = preReserves[0].value * preReserves[1].value;

        lunarswap.swapTokensForExactTokens(
          swapUsdcCoin, // Use fresh token coin for swap
          nightCoin,
          amountOut,
          amountInMax,
          recipient,
        );

        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const postK = postReserves[0].value * postReserves[1].value;

        // K should increase slightly due to fees
        expect(postK).toBeGreaterThan(preK);
      });

      it('should calculate correct input amount based on output', () => {
        const amountOut = 800n;
        const amountInMax = 3000n;
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);
        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preK = preReserves[0].value * preReserves[1].value;
        lunarswap.swapTokensForExactTokens(
          swapUsdcCoin,
          nightCoin,
          amountOut,
          amountInMax,
          recipient,
        );
        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const postK = postReserves[0].value * postReserves[1].value;
        expect(postK).toBeGreaterThan(preK);
        const actualAmountIn = postReserves[0].value - preReserves[0].value;
        expect(actualAmountIn).toBeGreaterThan(0n);
        expect(actualAmountIn).toBeLessThanOrEqual(amountInMax);
      });

      it('should respect amountInMax constraint', () => {
        const amountOut = 800n; // Use large amount
        const amountInMax = 3000n;

        // Create fresh token coins for the swap
        const swapUsdcCoin = usdc.mint(recipient, amountInMax);

        const preReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const preUsdcReserve = preReserves[0].value;

        lunarswap.swapTokensForExactTokens(
          swapUsdcCoin, // Use fresh token coin for swap
          nightCoin,
          amountOut,
          amountInMax,
          recipient,
        );

        const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
        const postUsdcReserve = postReserves[0].value;

        const actualAmountIn = postUsdcReserve - preUsdcReserve;
        expect(actualAmountIn).toBeLessThanOrEqual(amountInMax);
      });
    });
  });

  describe('Cross-Function Tests', () => {
    let usdcCoin: CoinInfo;
    let nightCoin: CoinInfo;

    beforeEach(() => {
      // Setup initial liquidity
      usdcCoin = usdc.mint(recipient, 10000n);
      nightCoin = night.mint(recipient, 5000n);
      const result = calculateAddLiquidityAmounts(
        10000n,
        5000n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );

      // Add liquidity and handle potential errors
      try {
        lunarswap.addLiquidity(
          usdcCoin,
          nightCoin,
          result.amountAMin,
          result.amountBMin,
          recipient,
        );
      } catch (error) {
        console.error('addLiquidity failed:', error);
        throw error;
      }

      // Verify the pair exists before proceeding
      const pairExists = lunarswap.isPairExists(usdcCoin, nightCoin);
      if (!pairExists) {
        throw new Error('Pair was not created after addLiquidity');
      }
    });

    it('should handle multiple swaps in sequence', () => {
      // First swap: exact tokens for tokens
      const amountIn1 = 2000n; // Use large amount
      const amountOutMin1 = 800n;
      const swapUsdcCoin1 = usdc.mint(recipient, amountIn1);
      lunarswap.swapExactTokensForTokens(
        swapUsdcCoin1,
        nightCoin,
        amountIn1,
        amountOutMin1,
        recipient,
      );
      const midReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
      const midUsdcReserve = midReserves[0].value;
      // Second swap: tokens for exact tokens
      const amountOut2 = 400n;
      const amountInMax2 = 1200n;
      const swapNightCoin2 = night.mint(recipient, amountInMax2);
      lunarswap.swapTokensForExactTokens(
        swapNightCoin2,
        usdcCoin,
        amountOut2,
        amountInMax2,
        recipient,
      );
      const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
      const postUsdcReserve = postReserves[0];
      const _postNightReserve = postReserves[1];
      // For the second swap, check USDC output delta
      const usdcDelta = midUsdcReserve - postUsdcReserve.value;
      expect(usdcDelta).toBe(amountOut2);
    });

    it('should maintain consistency between swap directions', () => {
      // Swap USDC -> NIGHT
      const amountIn = 2000n;
      const amountOutMin = 800n;
      const swapUsdcCoin1 = usdc.mint(recipient, amountIn);
      lunarswap.swapExactTokensForTokens(
        swapUsdcCoin1,
        nightCoin,
        amountIn,
        amountOutMin,
        recipient,
      );
      const midReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
      const midNightReserve = midReserves[1];
      // Swap NIGHT -> USDC (reverse direction)
      const reverseAmountIn = 800n;
      const reverseAmountOutMin = 1500n;
      const swapNightCoin2 = night.mint(recipient, reverseAmountIn);
      lunarswap.swapExactTokensForTokens(
        swapNightCoin2,
        usdcCoin,
        reverseAmountIn,
        reverseAmountOutMin,
        recipient,
      );
      const postReserves = lunarswap.getPairReserves(usdcCoin, nightCoin);
      const postNightReserve = postReserves[1].value;
      // For the reverse swap, NIGHT is the input, so delta should be positive (post - mid)
      const actualDelta = postNightReserve - midNightReserve.value;
      expect(actualDelta).toBe(reverseAmountIn);
    });
  });
});
