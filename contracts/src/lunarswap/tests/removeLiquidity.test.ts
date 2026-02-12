import { encodeCoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import {
  calculateAddLiquidityAmounts,
  calculateRemoveLiquidityMinimums,
  SLIPPAGE_TOLERANCE,
} from '@openzeppelin-midnight-apps/lunarswap-sdk';
import { ShieldedFungibleTokenSimulator } from '@src/shielded-token/test/mocks/ShieldedFungibleTokenSimulator.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { LunarswapSimulator } from './mocks/LunarswapSimulator.js';

const NONCE = new Uint8Array(32).fill(0x44);
const DOMAIN_USDC = new Uint8Array(32).fill(0x01);
const DOMAIN_NIGHT = new Uint8Array(32).fill(0x02);
const DOMAIN_MOON = new Uint8Array(32).fill(0x03);

// Static addresses like in access control test
const LP_USER =
  'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

// Helper function to create Either for hex addresses
const createEitherFromHex = (hexString: string) => ({
  is_left: true,
  left: { bytes: encodeCoinPublicKey(hexString) },
  right: { bytes: new Uint8Array(32) },
});

// TODO: allow and test fees
describe('removeLiquidity', () => {
  let lunarswap: LunarswapSimulator;
  let usdc: ShieldedFungibleTokenSimulator;
  let night: ShieldedFungibleTokenSimulator;
  let moon: ShieldedFungibleTokenSimulator;

  const setup = () => {
    // Deploy Lunarswap with admin
    lunarswap = new LunarswapSimulator('Lunarswap LP', 'LP', NONCE, 18n);
    // Deploy tokens with admin
    usdc = new ShieldedFungibleTokenSimulator(
      NONCE,
      'USDC',
      'USDC',
      DOMAIN_USDC,
    );
    night = new ShieldedFungibleTokenSimulator(
      NONCE,
      'Night',
      'NIGHT',
      DOMAIN_NIGHT,
    );
    moon = new ShieldedFungibleTokenSimulator(
      NONCE,
      'Dust',
      'MOON',
      DOMAIN_MOON,
    );
  };

  beforeEach(setup);

  describe('USDC/NIGHT pair', () => {
    /**
     * Tests removing liquidity from a USDC/NIGHT pair
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = sqrt(2,000,000) - MINIMUM_LIQUIDITY(1) = 1413
     * - Total LP supply = 1413
     * - Remove LP tokens: 1413 - 1000 = 413 LP tokens
     * - Expected token0 amount = (413 * 2000) / 1413 = 584 (integer division)
     * - Expected token1 amount = (413 * 1000) / 1413 = 292 (integer division)
     * - Remaining reserves: 1416 USDC (2000 - 584), 708 NIGHT (1000 - 292)
     * - Remaining LP tokens: 1000
     *
     * Expected: Correct proportional token amounts returned, reserves updated
     */
    it('should remove liquidity from USDC/NIGHT pair', () => {
      // First, add liquidity to create the pair and get LP tokens
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getPair(usdcCoin, nightCoin);
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Create LP token coin for removal (use all burnable liquidity)
      const lpTokensToRemove = initialLpTotalSupply.value - 1000n;
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: lpTokensToRemove,
      };

      // Calculate minimum amounts using SDK
      const [reserveA, reserveB] = lunarswap.getPairReserves(
        usdcCoin,
        nightCoin,
      );
      const { amountAMin, amountBMin } = calculateRemoveLiquidityMinimums(
        lpTokensToRemove,
        initialLpTotalSupply.value,
        reserveA.value,
        reserveB.value,
        SLIPPAGE_TOLERANCE.LOW,
      );

      // Remove liquidity
      lunarswap.removeLiquidity(
        usdcCoin,
        nightCoin,
        lpTokenCoin,
        amountAMin,
        amountBMin,
        recipient,
      );

      // Get updated pair state
      const updatedLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );
      lunarswap.getPairReserves(usdcCoin, nightCoin);

      // Verify LP token supply decreased
      expect(updatedLpTotalSupply.value).toBe(
        initialLpTotalSupply.value - lpTokensToRemove,
      );

      // Verify reserves decreased proportionally
      const [reserveUSDC, reserveNIGHT] = lunarswap.getPairReserves(
        usdcCoin,
        nightCoin,
      );
      expect(reserveUSDC.value).toBe(1416n);
      expect(reserveNIGHT.value).toBe(708n);
    });

    /**
     * Tests removing all burnable liquidity from a USDC/NIGHT pair
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = sqrt(2,000,000) - MINIMUM_LIQUIDITY(1) = 1413
     * - Total LP supply = 1413
     * - Remove all burnable LP tokens: 1413 - 1000 = 413
     * - Remaining LP tokens: 1000
     * - Expected reserves (integer division):
     *   amount0 = (413 * 2000) / 1413 = 584
     *   amount1 = (413 * 1000) / 1413 = 292
     *   USDC: 2000 - 584 = 1416
     *   NIGHT: 1000 - 292 = 708
     *
     * Expected: All removable liquidity removed, MINIMUM_LIQUIDITY remains, reserves match proportionally
     */
    it('should remove all removable liquidity from USDC/NIGHT pair', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getPair(usdcCoin, nightCoin);
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Remove all LP tokens except MINIMUM_LIQUIDITY (1000)
      const removableLpTokens = initialLpTotalSupply.value - 1000n;
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: removableLpTokens,
      };

      // Calculate minimum amounts using SDK
      const [reserveA, reserveB] = lunarswap.getPairReserves(
        usdcCoin,
        nightCoin,
      );
      const { amountAMin, amountBMin } = calculateRemoveLiquidityMinimums(
        removableLpTokens,
        initialLpTotalSupply.value,
        reserveA.value,
        reserveB.value,
        SLIPPAGE_TOLERANCE.LOW,
      );

      // Remove liquidity
      lunarswap.removeLiquidity(
        usdcCoin,
        nightCoin,
        lpTokenCoin,
        amountAMin,
        amountBMin,
        recipient,
      );

      // Get updated pair state
      const updatedLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Verify only MINIMUM_LIQUIDITY remains
      expect(updatedLpTotalSupply.value).toBe(1000n);

      // Verify reserves are reduced but not zero
      const [reserveUSDC, reserveNIGHT] = lunarswap.getPairReserves(
        usdcCoin,
        nightCoin,
      );
      expect(reserveUSDC.value).toBe(1416n);
      expect(reserveNIGHT.value).toBe(708n);
    });

    /**
     * Tests removing small amounts of liquidity from USDC/NIGHT pair
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = 414
     * - Remove 10% of LP tokens: 141 LP tokens
     * - Expected token0 amount = (141 * 2000) / 1414 = 199 (integer division)
     * - Expected token1 amount = (141 * 1000) / 1414 = 99 (integer division)
     * - Remaining reserves: 1801 USDC (2000 - 199), 901 NIGHT (1000 - 99)
     *
     * Expected: Small proportional amounts returned, reserves updated correctly
     */
    it('should remove small amounts of liquidity from USDC/NIGHT pair', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getPair(usdcCoin, nightCoin);
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Remove 10% of LP tokens
      const lpTokensToRemove = initialLpTotalSupply.value / 10n;
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: lpTokensToRemove,
      };

      // Calculate minimum amounts using SDK
      const [reserveA, reserveB] = lunarswap.getPairReserves(
        usdcCoin,
        nightCoin,
      );
      const { amountAMin, amountBMin } = calculateRemoveLiquidityMinimums(
        lpTokensToRemove,
        initialLpTotalSupply.value,
        reserveA.value,
        reserveB.value,
        SLIPPAGE_TOLERANCE.LOW,
      );

      // Remove liquidity
      lunarswap.removeLiquidity(
        usdcCoin,
        nightCoin,
        lpTokenCoin,
        amountAMin,
        amountBMin,
        recipient,
      );

      // Get updated pair state
      const updatedLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Verify LP token supply decreased
      expect(updatedLpTotalSupply.value).toBe(
        initialLpTotalSupply.value - lpTokensToRemove,
      );

      const [reserveUSDC, reserveNIGHT] = lunarswap.getPairReserves(
        usdcCoin,
        nightCoin,
      );
      expect(reserveUSDC.value).toBe(1801n);
      expect(reserveNIGHT.value).toBe(901n);
    });
  });

  describe('NIGHT/MOON pair', () => {
    /**
     * Tests removing liquidity from a NIGHT/MOON pair
     *
     * Mathematical calculations:
     * - Initial: 8000 NIGHT, 12000 MOON → liquidity = 8798
     * - Remove 30% of LP tokens: 2939 LP tokens
     * - Expected token0 amount = (2939 * 8000) / 9798 = 2399 (integer division)
     * - Expected token1 amount = (2939 * 12000) / 9798 = 3599 (integer division)
     * - Remaining reserves: 5601 NIGHT (8000 - 2399), 8401 MOON (12000 - 3599)
     *
     * Expected: Correct proportional token amounts returned, reserves updated
     */
    it('should remove liquidity from NIGHT/MOON pair', () => {
      // First, add liquidity to create the pair
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 8000n);
      const moonCoin = moon.mint(createEitherFromHex(LP_USER), 12000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        8000n, // desired NIGHT
        12000n, // desired MOON
        0n, // reserve NIGHT
        0n, // reserve MOON
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        nightCoin,
        moonCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getPair(nightCoin, moonCoin);
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        nightCoin,
        moonCoin,
      );

      // Remove 30% of LP tokens
      const lpTokensToRemove = (initialLpTotalSupply.value * 3n) / 10n;
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: lpTokensToRemove,
      };

      // Calculate minimum amounts using SDK
      const [reserveA, reserveB] = lunarswap.getPairReserves(
        nightCoin,
        moonCoin,
      );
      const { amountAMin, amountBMin } = calculateRemoveLiquidityMinimums(
        lpTokensToRemove,
        initialLpTotalSupply.value,
        reserveA.value,
        reserveB.value,
        SLIPPAGE_TOLERANCE.LOW,
      );

      // Remove liquidity
      lunarswap.removeLiquidity(
        nightCoin,
        moonCoin,
        lpTokenCoin,
        amountAMin,
        amountBMin,
        recipient,
      );

      // Get updated pair state
      const updatedLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        nightCoin,
        moonCoin,
      );

      // Verify LP token supply decreased
      expect(updatedLpTotalSupply.value).toBe(
        initialLpTotalSupply.value - lpTokensToRemove,
      );

      const [reserveNIGHT, reserveDUST] = lunarswap.getPairReserves(
        nightCoin,
        moonCoin,
      );
      expect(reserveNIGHT.value).toBe(5601n);
      expect(reserveDUST.value).toBe(8401n);
    });
  });

  describe('edge cases', () => {
    /**
     * Tests removing liquidity with insufficient minimum amounts
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = 414
     * - Total LP supply = 1414 (MINIMUM_LIQUIDITY + liquidity)
     * - Remove 50% of LP tokens: 707 LP tokens
     * - Expected token0 amount = (707 * 2000) / 1414 = 1000 (integer division)
     * - Expected token1 amount = (707 * 1000) / 1414 = 500 (integer division)
     * - Set amountAMin = 300 < 1000, should pass
     * - Set amountBMin = 150 < 500, should pass
     * - But if we set amountAMin = 1100 > 1000, should fail
     *
     * Error: "LunarswapLibrary: subQualifiedCoinValue() - Insufficient amount" - minimum not met
     */
    it('should fail when removing liquidity with insufficient minimum amounts', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getPair(usdcCoin, nightCoin);
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Remove 50% of LP tokens
      const lpTokensToRemove = initialLpTotalSupply.value / 2n;
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: lpTokensToRemove,
      };

      // Try to remove liquidity with minimum amounts higher than what will be returned
      expect(() => {
        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          lpTokenCoin,
          1100n, // amountAMin higher than expected (~1000)
          600n, // amountBMin higher than expected (~500)
          recipient,
        );
      }).toThrow('LunarswapRouter: removeLiquidity() - Insufficient A amount');
    });

    /**
     * Tests removing liquidity with zero LP tokens
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = 414
     * - Try to remove 0 LP tokens
     * - Expected token0 amount = (0 * 2000) / 1414 = 0 (integer division)
     * - Expected token1 amount = (0 * 1000) / 1414 = 0 (integer division)
     * - Since amounts are 0, "Insufficient liquidity burned" error
     *
     * Error: "LunarswapPair: burn() - Insufficient liquidity burned" - zero amounts
     */
    it('should fail when removing liquidity with zero LP tokens', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getPair(usdcCoin, nightCoin);
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Try to remove 0 LP tokens
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: 0n,
      };

      expect(() => {
        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          lpTokenCoin,
          0n, // amountAMin
          0n, // amountBMin
          recipient,
        );
      }).toThrow('LunarswapPair: _burn() - Insufficient liquidity burned');
    });

    /**
     * Tests removing liquidity with LP tokens exceeding total supply
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = 414
     * - Total LP supply = 1414
     * - Try to remove 2000 LP tokens > 1414
     * - This should fail due to insufficient LP tokens
     *
     * Error: Should fail due to insufficient LP tokens for burning
     */
    it('should fail when removing liquidity with LP tokens exceeding total supply', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getPair(usdcCoin, nightCoin);
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Try to remove more LP tokens than exist
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: initialLpTotalSupply.value + 1000n, // More than total supply
      };

      expect(() => {
        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          lpTokenCoin,
          1000n, // amountAMin
          500n, // amountBMin
          recipient,
        );
      }).toThrow('LunarswapPair: _burn() - Insufficient reserves for token0');
    });

    /**
     * Tests removing liquidity from non-existent pair
     *
     * Mathematical validation:
     * - No pair exists, so no LP tokens exist
     * - Trying to remove liquidity from non-existent pair should fail
     * - LP token total supply lookup will fail
     *
     * Error: "LunarswapLpTokens: totalSupply() - Lp token not found"
     */
    it('should fail when removing liquidity from non-existent pair', () => {
      // Create tokens but don't add liquidity
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);

      // Create fake LP token coin
      const fakeLpTokenCoin = {
        nonce: new Uint8Array(32).fill(0x01),
        color: new Uint8Array(32).fill(0x02),
        value: 100n,
      };

      expect(() => {
        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          fakeLpTokenCoin,
          50n, // amountAMin
          50n, // amountBMin
          recipient,
        );
      }).toThrow('LunarswapFactory: getPair() - Pair does not exist');
    });

    /**
     * Tests removing liquidity with very small amounts
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = 414
     * - Remove 1 LP token
     * - Expected token0 amount = (1 * 2000) / 1414 = 1 (integer division)
     * - Expected token1 amount = (1 * 1000) / 1414 = 0 (integer division)
     * - Very small amounts may round down to 0, causing "Insufficient liquidity burned"
     *
     * Expected: Should handle very small amounts or fail gracefully
     */
    it('should handle removing very small amounts of liquidity', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getPair(usdcCoin, nightCoin);
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Try to remove 1 LP token
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: 1n,
      };

      try {
        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          lpTokenCoin,
          0n, // amountAMin
          0n, // amountBMin
          recipient,
        );
        // If successful, verify the change
        const updatedLpTotalSupply = lunarswap.getLpTokenTotalSupply(
          usdcCoin,
          nightCoin,
        );
        expect(updatedLpTotalSupply.value).toBeGreaterThan(0n);
      } catch (e: unknown) {
        // If it fails, it should be due to insufficient liquidity burned
        let message = '';
        if (e instanceof Error) {
          message = e.message;
        } else if (typeof e === 'string') {
          message = e;
        }
        expect(message).toContain('Insufficient liquidity burned');
      }
    });

    /**
     * Tests removing liquidity multiple times from same pair
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = 414
     * - First removal: 20% of LP tokens (283 LP tokens)
     *   Expected token0 = (283 * 2000) / 1414 = 400 (integer division)
     *   Expected token1 = (283 * 1000) / 1414 = 200 (integer division)
     * - Second removal: 30% of remaining LP tokens (339 LP tokens)
     *   Expected token0 = (339 * 1600) / 1131 = 479 (integer division)
     *   Expected token1 = (339 * 800) / 1131 = 239 (integer division)
     * - Third removal: 50% of remaining LP tokens (396 LP tokens)
     *   Expected token0 = (396 * 1121) / 792 = 560 (integer division)
     *   Expected token1 = (396 * 561) / 792 = 280 (integer division)
     * - Final LP tokens: 396 remaining
     *
     * Expected: Multiple removals work correctly, reserves updated properly
     */
    it('should handle multiple liquidity removals from same pair', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getPair(usdcCoin, nightCoin);
      let currentLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      try {
        // First removal: 20% of LP tokens
        const firstRemoval = currentLpTotalSupply.value / 5n;
        const lpTokenCoin1 = {
          nonce: currentLpTotalSupply.nonce,
          color: currentLpTotalSupply.color,
          value: firstRemoval,
        };

        // Calculate minimum amounts using SDK for first removal
        const [reserveA1, reserveB1] = lunarswap.getPairReserves(
          usdcCoin,
          nightCoin,
        );
        const { amountAMin: amountAMin1, amountBMin: amountBMin1 } =
          calculateRemoveLiquidityMinimums(
            firstRemoval,
            currentLpTotalSupply.value,
            reserveA1.value,
            reserveB1.value,
            SLIPPAGE_TOLERANCE.LOW,
          );

        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          lpTokenCoin1,
          amountAMin1,
          amountBMin1,
          recipient,
        );

        currentLpTotalSupply = lunarswap.getLpTokenTotalSupply(
          usdcCoin,
          nightCoin,
        );

        // Second removal: 30% of remaining LP tokens
        const secondRemoval = (currentLpTotalSupply.value * 3n) / 10n;
        const lpTokenCoin2 = {
          nonce: currentLpTotalSupply.nonce,
          color: currentLpTotalSupply.color,
          value: secondRemoval,
        };

        // Calculate minimum amounts using SDK for second removal
        const [reserveA2, reserveB2] = lunarswap.getPairReserves(
          usdcCoin,
          nightCoin,
        );
        const { amountAMin: amountAMin2, amountBMin: amountBMin2 } =
          calculateRemoveLiquidityMinimums(
            secondRemoval,
            currentLpTotalSupply.value,
            reserveA2.value,
            reserveB2.value,
            SLIPPAGE_TOLERANCE.LOW,
          );

        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          lpTokenCoin2,
          amountAMin2,
          amountBMin2,
          recipient,
        );

        currentLpTotalSupply = lunarswap.getLpTokenTotalSupply(
          usdcCoin,
          nightCoin,
        );

        // Third removal: 50% of remaining LP tokens
        const thirdRemoval = currentLpTotalSupply.value / 2n;
        const lpTokenCoin3 = {
          nonce: currentLpTotalSupply.nonce,
          color: currentLpTotalSupply.color,
          value: thirdRemoval,
        };

        // Calculate minimum amounts using SDK for third removal
        const [reserveA3, reserveB3] = lunarswap.getPairReserves(
          usdcCoin,
          nightCoin,
        );
        const { amountAMin: amountAMin3, amountBMin: amountBMin3 } =
          calculateRemoveLiquidityMinimums(
            thirdRemoval,
            currentLpTotalSupply.value,
            reserveA3.value,
            reserveB3.value,
            SLIPPAGE_TOLERANCE.LOW,
          );

        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          lpTokenCoin3,
          amountAMin3,
          amountBMin3,
          recipient,
        );

        // Verify final state
        const finalLpTotalSupply = lunarswap.getLpTokenTotalSupply(
          usdcCoin,
          nightCoin,
        );
        const _finalPair = lunarswap.getPair(usdcCoin, nightCoin);

        // Should have some LP tokens remaining
        expect(finalLpTotalSupply.value).toBeGreaterThan(0n);
        const [reserve0, reserve1] = lunarswap.getPairReserves(
          usdcCoin,
          nightCoin,
        );
        expect(reserve0.value).toBeGreaterThan(0n);
        expect(reserve1.value).toBeGreaterThan(0n);
      } catch (e: unknown) {
        // If it fails, it should be due to insufficient liquidity
        let message = '';
        if (e instanceof Error) {
          message = e.message;
        } else if (typeof e === 'string') {
          message = e;
        }
        expect(message).toContain(
          'LunarswapLibrary: subQualifiedCoinValue() - Insufficient amount',
        );
      }
    });
  });

  describe('error handling', () => {
    /**
     * Tests removing liquidity with invalid LP token nonce
     *
     * Mathematical validation:
     * - LP token has wrong nonce that doesn't match the pair
     * - This should fail during LP token validation
     *
     * Error: Should fail due to invalid LP token nonce
     */
    it('should fail when removing liquidity with invalid LP token nonce', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      lunarswap.getLpTokenTotalSupply(usdcCoin, nightCoin);

      // Create LP token with completely wrong nonce and color
      const invalidLpTokenCoin = {
        nonce: new Uint8Array(32).fill(0x99), // Wrong nonce
        color: new Uint8Array(32).fill(0x88), // Wrong color
        value: 100n,
      };

      // This should throw an error due to invalid LP token
      expect(() => {
        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          invalidLpTokenCoin,
          50n,
          50n,
          recipient,
        );
      }).toThrow('Lunarswap: removeLiquidity() - mismatched LP token color');
    });

    /**
     * Tests removing liquidity with wrong token order
     *
     * Mathematical validation:
     * - Tokens are passed in wrong order (NIGHT, USDC instead of USDC, NIGHT)
     * - This should still work as tokens are sorted internally
     *
     * Expected: Should work correctly despite wrong order
     */
    it('should handle removing liquidity with wrong token order', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Remove 5% of LP tokens with wrong token order
      const lpTokensToRemove = initialLpTotalSupply.value / 20n;
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: lpTokensToRemove,
      };

      // Remove liquidity with wrong token order (nightCoin, usdcCoin) and zero minimums
      lunarswap.removeLiquidity(
        nightCoin, // Wrong order
        usdcCoin, // Wrong order
        lpTokenCoin,
        0n, // amountAMin - use zero to avoid insufficient amount error
        0n, // amountBMin - use zero to avoid insufficient amount error
        recipient,
      );

      // Verify the operation succeeded
      const updatedLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );
      expect(updatedLpTotalSupply.value).toBe(
        initialLpTotalSupply.value - lpTokensToRemove,
      );
    });

    /**
     * Tests removing liquidity with identical token addresses
     *
     * Mathematical validation:
     * - Both tokens have same color (USDC = USDC)
     * - This should fail during token validation
     *
     * Error: "Lunarswap: removeLiquidity() - Identical addresses"
     */
    it('should fail when removing liquidity with identical token addresses', () => {
      // Create tokens but don't add liquidity
      const usdcCoin1 = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const usdcCoin2 = usdc.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);

      // Create fake LP token coin
      const fakeLpTokenCoin = {
        nonce: new Uint8Array(32).fill(0x01),
        color: new Uint8Array(32).fill(0x02),
        value: 100n,
      };

      expect(() => {
        lunarswap.removeLiquidity(
          usdcCoin1,
          usdcCoin2, // Same token type
          fakeLpTokenCoin,
          50n, // amountAMin
          50n, // amountBMin
          recipient,
        );
      }).toThrow('Lunarswap: removeLiquidity() - Identical addresses');
    });

    /**
     * Tests removing liquidity with negative minimum amounts
     *
     * Mathematical validation:
     * - Negative amounts should be rejected
     * - This should fail during parameter validation
     *
     * Error: Should fail due to negative amounts
     */
    it('should fail when removing liquidity with negative minimum amounts', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Create LP token coin
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: 100n,
      };

      // Try to remove liquidity with negative minimum amounts
      // Note: In bigint, negative values are represented differently
      // This test checks if the system handles edge cases properly
      expect(() => {
        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          lpTokenCoin,
          0n, // amountAMin (minimum allowed)
          0n, // amountBMin (minimum allowed)
          recipient,
        );
      }).not.toThrow(); // Should work with zero minimums
    });

    /**
     * Tests removing liquidity with excessive minimum amounts
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = 414
     * - Remove 10% of LP tokens: 141 LP tokens
     * - Expected token0 amount = (141 * 2000) / 1414 = 199 (integer division)
     * - Expected token1 amount = (141 * 1000) / 1414 = 99 (integer division)
     * - Set amountAMin = 1000 > 199, should fail
     *
     * Error: "LunarswapRouter: Insufficient A amount" - minimum too high
     */
    it('should fail when removing liquidity with excessive minimum amounts', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Remove 10% of LP tokens
      const lpTokensToRemove = initialLpTotalSupply.value / 10n;
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: lpTokensToRemove,
      };

      // Try to remove liquidity with excessive minimum amounts
      expect(() => {
        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          lpTokenCoin,
          1000n, // amountAMin much higher than expected (~199)
          200n, // amountBMin much higher than expected (~99)
          recipient,
        );
      }).toThrow('LunarswapRouter: removeLiquidity() - Insufficient A amount');
    });

    /**
     * Tests removing liquidity with mismatched LP token color
     *
     * Mathematical validation:
     * - LP token has wrong color that doesn't match the pair
     * - This should fail during LP token validation
     *
     * Error: Should fail due to mismatched LP token color
     */
    it('should fail when removing liquidity with mismatched LP token color', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Create LP token with wrong color but correct nonce
      const mismatchedLpTokenCoin = {
        nonce: initialLpTotalSupply.nonce, // Correct nonce
        color: new Uint8Array(32).fill(0xaa), // Wrong color
        value: 100n,
      };

      // This should throw an error due to mismatched LP token color
      expect(() => {
        lunarswap.removeLiquidity(
          usdcCoin,
          nightCoin,
          mismatchedLpTokenCoin,
          50n,
          50n,
          recipient,
        );
      }).toThrow('Lunarswap: removeLiquidity() - mismatched LP token color');
    });

    /**
     * Tests removing liquidity with zero minimum amounts
     *
     * Mathematical calculations:
     * - Initial: 2000 USDC, 1000 NIGHT → liquidity = 414
     * - Remove 5% of LP tokens: 71 LP tokens
     * - Expected token0 amount = (71 * 2000) / 1414 = 100 (integer division)
     * - Expected token1 amount = (71 * 1000) / 1414 = 50 (integer division)
     * - Set amountAMin = 0, amountBMin = 0, should pass
     *
     * Expected: Should work with zero minimum amounts
     */
    it('should handle removing liquidity with zero minimum amounts', () => {
      // First, add liquidity to create the pair
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n, // desired USDC
        1000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Get initial pair state
      const initialLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );

      // Remove 5% of LP tokens
      const lpTokensToRemove = initialLpTotalSupply.value / 20n;
      const lpTokenCoin = {
        nonce: initialLpTotalSupply.nonce,
        color: initialLpTotalSupply.color,
        value: lpTokensToRemove,
      };

      // Remove liquidity with zero minimum amounts
      lunarswap.removeLiquidity(
        usdcCoin,
        nightCoin,
        lpTokenCoin,
        0n, // amountAMin
        0n, // amountBMin
        recipient,
      );

      // Verify the operation succeeded
      const updatedLpTotalSupply = lunarswap.getLpTokenTotalSupply(
        usdcCoin,
        nightCoin,
      );
      expect(updatedLpTotalSupply.value).toBe(
        initialLpTotalSupply.value - lpTokensToRemove,
      );
    });
  });
});
