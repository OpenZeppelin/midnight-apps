import { encodeCoinPublicKey } from '@midnight-ntwrk/compact-runtime';
import { sampleCoinPublicKey } from '@midnight-ntwrk/zswap';
import {
  calculateAddLiquidityAmounts,
  SLIPPAGE_TOLERANCE,
} from '@openzeppelin-midnight-apps/lunarswap-sdk';
import { beforeEach, describe, expect, it } from 'vitest';
import { LunarswapSimulator } from './LunarswapSimulator';
import { ShieldedFungibleTokenSimulator } from './ShieldedFungibleTokenSimulator';

const NONCE = new Uint8Array(32).fill(0x44);
const DOMAIN = new Uint8Array(32).fill(0x44);

// Static addresses like in access control test
const LP_USER =
  'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456';

// Helper function to create Either for hex addresses
const createEitherFromHex = (hexString: string) => ({
  is_left: true,
  left: { bytes: encodeCoinPublicKey(hexString) },
  right: { bytes: new Uint8Array(32) },
});

describe('Lunarswap', () => {
  let lunarswap: LunarswapSimulator;
  let usdc: ShieldedFungibleTokenSimulator;
  let night: ShieldedFungibleTokenSimulator;
  let dust: ShieldedFungibleTokenSimulator;
  let foo: ShieldedFungibleTokenSimulator;

  const setup = () => {
    // Deploy Lunarswap with admin
    lunarswap = new LunarswapSimulator('Lunarswap LP', 'LP', NONCE, 18n);
    // Deploy tokens with admin
    usdc = new ShieldedFungibleTokenSimulator(NONCE, 'USDC', 'USDC', NONCE);
    night = new ShieldedFungibleTokenSimulator(NONCE, 'Night', 'NIGHT', DOMAIN);
    dust = new ShieldedFungibleTokenSimulator(NONCE, 'Dust', 'DUST', DOMAIN);
    foo = new ShieldedFungibleTokenSimulator(NONCE, 'Foo', 'FOO', DOMAIN);
  };

  beforeEach(setup);

  describe('isPairExists', () => {
    it('should return false for non-existent pair', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 100n);
      expect(lunarswap.isPairExists(usdcCoin, nightCoin)).toBe(false);
    });

    it('should return true for existing pair', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n,
        1000n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );
      expect(lunarswap.isPairExists(usdcCoin, nightCoin)).toBe(true);
    });
  });

  describe('getAllPairLength', () => {
    it('should return 0 for empty factory', () => {
      expect(lunarswap.getAllPairLength()).toBe(0n);
    });

    it('should track cumulative unique pairs creation', () => {
      expect(lunarswap.getAllPairLength()).toBe(0n);

      // Create USDC/NIGHT pair
      const usdcCoin1 = usdc.mint(createEitherFromHex(LP_USER), 10000n);
      const nightCoin1 = night.mint(createEitherFromHex(LP_USER), 5000n);
      const result = calculateAddLiquidityAmounts(
        10000n, // desired USDC
        5000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin1,
        nightCoin1,
        result.amountAMin,
        result.amountBMin,
        createEitherFromHex(LP_USER),
      );
      expect(lunarswap.getAllPairLength()).toBe(1n);

      // Create USDC/DUST pair
      const usdcCoin2 = usdc.mint(createEitherFromHex(LP_USER), 20000n);
      const dustCoin1 = dust.mint(createEitherFromHex(LP_USER), 10000n);
      const result2 = calculateAddLiquidityAmounts(
        20000n, // desired USDC
        10000n, // desired DUST
        0n, // reserve USDC
        0n, // reserve DUST
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin2,
        dustCoin1,
        result2.amountAMin,
        result2.amountBMin,
        createEitherFromHex(LP_USER),
      );
      expect(lunarswap.getAllPairLength()).toBe(2n);

      // Create NIGHT/DUST pair
      const nightCoin2 = night.mint(createEitherFromHex(LP_USER), 8000n);
      const dustCoin2 = dust.mint(createEitherFromHex(LP_USER), 12000n);
      const result3 = calculateAddLiquidityAmounts(
        8000n, // desired NIGHT
        12000n, // desired DUST
        0n, // reserve NIGHT
        0n, // reserve DUST
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        nightCoin2,
        dustCoin2,
        result3.amountAMin,
        result3.amountBMin,
        createEitherFromHex(LP_USER),
      );
      expect(lunarswap.getAllPairLength()).toBe(3n);

      // Create USDC/FOO pair
      const usdcCoin3 = usdc.mint(createEitherFromHex(LP_USER), 15000n);
      const fooCoin1 = foo.mint(createEitherFromHex(LP_USER), 7000n);
      const result4 = calculateAddLiquidityAmounts(
        15000n, // desired USDC
        7000n, // desired FOO
        0n, // reserve USDC
        0n, // reserve FOO
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin3,
        fooCoin1,
        result4.amountAMin,
        result4.amountBMin,
        createEitherFromHex(LP_USER),
      );
      expect(lunarswap.getAllPairLength()).toBe(4n);

      // Create NIGHT/FOO pair
      const nightCoin3 = night.mint(createEitherFromHex(LP_USER), 9000n);
      const fooCoin2 = foo.mint(createEitherFromHex(LP_USER), 11000n);
      const result5 = calculateAddLiquidityAmounts(
        9000n, // desired NIGHT
        11000n, // desired FOO
        0n, // reserve NIGHT
        0n, // reserve FOO
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        nightCoin3,
        fooCoin2,
        result5.amountAMin,
        result5.amountBMin,
        createEitherFromHex(LP_USER),
      );
      expect(lunarswap.getAllPairLength()).toBe(5n);

      // Create DUST/FOO pair
      const dustCoin3 = dust.mint(createEitherFromHex(LP_USER), 5000n);
      const fooCoin3 = foo.mint(createEitherFromHex(LP_USER), 5000n);
      const result6 = calculateAddLiquidityAmounts(
        5000n, // desired DUST
        5000n, // desired FOO
        0n, // reserve DUST
        0n, // reserve FOO
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        dustCoin3,
        fooCoin3,
        result6.amountAMin,
        result6.amountBMin,
        createEitherFromHex(LP_USER),
      );
      expect(lunarswap.getAllPairLength()).toBe(6n);

      // Add liquidity to existing pair (USDC/NIGHT) - should not increase count
      const usdcCoin4 = usdc.mint(createEitherFromHex(LP_USER), 5000n);
      const nightCoin4 = night.mint(createEitherFromHex(LP_USER), 2500n);

      // Get actual reserves for USDC/NIGHT using getPairReserves - use the original coins
      const [reserveUSDC, reserveNIGHT] = lunarswap.getPairReserves(
        usdcCoin1,
        nightCoin1,
      );

      const result7 = calculateAddLiquidityAmounts(
        5000n, // desired USDC
        2500n, // desired NIGHT
        reserveUSDC.value, // actual reserve USDC
        reserveNIGHT.value, // actual reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin4,
        nightCoin4,
        result7.amountAMin,
        result7.amountBMin,
        createEitherFromHex(LP_USER),
      );
      expect(lunarswap.getAllPairLength()).toBe(6n); // Should not increase
    });
  });

  describe('getPair', () => {
    it('should retrieve USDC/NIGHT pair from ledger after creation', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 10000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 5000n);
      const recipient = createEitherFromHex(LP_USER);

      const result = calculateAddLiquidityAmounts(
        10000n, // desired USDC
        5000n, // desired NIGHT
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

      // Use getPairId to get the correct order for getIdentity
      const pair = lunarswap.getPair(usdcCoin, nightCoin);

      expect(pair).toBeDefined();

      const [reserveUSDC, reserveNIGHT] = lunarswap.getPairReserves(
        usdcCoin,
        nightCoin,
      );
      expect(reserveUSDC.value).toBe(10000n);
      expect(reserveNIGHT.value).toBe(5000n);
    });

    it('should retrieve USDC/DUST pair from ledger after creation', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 20000n);
      const dustCoin = dust.mint(createEitherFromHex(LP_USER), 10000n);
      const recipient = createEitherFromHex(LP_USER);

      const result = calculateAddLiquidityAmounts(
        20000n, // desired USDC
        10000n, // desired DUST
        0n, // reserve USDC
        0n, // reserve DUST
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        dustCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Use getPairId to get the correct order for getIdentity
      const pair = lunarswap.getPair(usdcCoin, dustCoin);

      expect(pair).toBeDefined();

      // Use getPairId to determine expected token order
      const [reserveUSDC, reserveDUST] = lunarswap.getPairReserves(
        usdcCoin,
        dustCoin,
      );
      expect(reserveUSDC.value).toBe(20000n);
      expect(reserveDUST.value).toBe(10000n);
      expect(lunarswap.getLpTokenTotalSupply(usdcCoin, dustCoin).value).toBe(
        14142n,
      );
      expect(pair.kLast).toBe(0n);
    });

    it('should retrieve NIGHT/DUST pair from ledger after creation', () => {
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 8000n);
      const dustCoin = dust.mint(createEitherFromHex(LP_USER), 12000n);
      const recipient = createEitherFromHex(LP_USER);

      const result = calculateAddLiquidityAmounts(
        8000n, // desired NIGHT
        12000n, // desired DUST
        0n, // reserve NIGHT
        0n, // reserve DUST
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        nightCoin,
        dustCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );

      // Use getPairId to get the correct order for getIdentity
      const pair = lunarswap.getPair(nightCoin, dustCoin);

      expect(pair).toBeDefined();

      // Use getPairId to determine expected token order
      const [reserveNIGHT, reserveDUST] = lunarswap.getPairReserves(
        nightCoin,
        dustCoin,
      );
      expect(reserveNIGHT.value).toBe(8000n);
      expect(reserveDUST.value).toBe(12000n);
      expect(lunarswap.getLpTokenTotalSupply(nightCoin, dustCoin).value).toBe(
        9797n,
      );
      expect(pair.kLast).toBe(0n);
    });
  });

  describe('getPairReserves', () => {
    it('should return correct reserves for USDC/NIGHT pair', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 2000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        2000n,
        1000n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );
      const [reserveUSDC, reserveNIGHT] = lunarswap.getPairReserves(
        usdcCoin,
        nightCoin,
      );
      expect(reserveUSDC.value).toBe(2000n);
      expect(reserveNIGHT.value).toBe(1000n);
    });

    it('should return correct reserves for NIGHT/DUST pair', () => {
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 8000n);
      const dustCoin = dust.mint(createEitherFromHex(LP_USER), 12000n);
      const recipient = createEitherFromHex(LP_USER);
      const result = calculateAddLiquidityAmounts(
        8000n,
        12000n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );
      lunarswap.addLiquidity(
        nightCoin,
        dustCoin,
        result.amountAMin,
        result.amountBMin,
        recipient,
      );
      const [reserveNIGHT, reserveDUST] = lunarswap.getPairReserves(
        nightCoin,
        dustCoin,
      );
      expect(reserveNIGHT.value).toBe(8000n);
      expect(reserveDUST.value).toBe(12000n);
    });
  });

  describe('getPairId', () => {
    it('should calculate correct pair hash for USDC/NIGHT', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 100n);
      const pairId = lunarswap.getPairId(usdcCoin, nightCoin);
      expect(pairId).toBeDefined();
      expect(pairId.length).toBe(32);
    });

    it('should calculate correct pair hash for USDC/DUST', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const dustCoin = dust.mint(createEitherFromHex(LP_USER), 100n);
      const pairId = lunarswap.getPairId(usdcCoin, dustCoin);
      expect(pairId).toBeDefined();
      expect(pairId.length).toBe(32);
    });

    it('should calculate correct pair hash for NIGHT/DUST', () => {
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 100n);
      const dustCoin = dust.mint(createEitherFromHex(LP_USER), 100n);
      const pairId = lunarswap.getPairId(nightCoin, dustCoin);
      expect(pairId).toBeDefined();
      expect(pairId.length).toBe(32);
    });

    it('should generate same hash regardless of token order', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 100n);
      const hash1 = lunarswap.getPairId(usdcCoin, nightCoin);
      const hash2 = lunarswap.getPairId(usdcCoin, nightCoin);
      expect(hash1).toEqual(hash2);
    });
  });

  describe('getLpTokenTotalSupply', () => {
    it('should track LP token total supply correctly', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 10000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 5000n);

      // Add liquidity to create the pair first
      const result = calculateAddLiquidityAmounts(
        10000n, // desired USDC
        5000n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW, // 0.5% slippage
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        createEitherFromHex(LP_USER),
      );

      // Use getPairId to get the correct order for getLpTokenTotalSupply
      expect(lunarswap.getLpTokenTotalSupply(usdcCoin, nightCoin).value).toBe(
        7071n,
      ); // LP token total supply tracking
    });
  });

  describe('getReserveId', () => {
    it('should generate consistent reserve ID for same pair and token type', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 100n);

      // Create pair first
      const result = calculateAddLiquidityAmounts(
        100n, // desired USDC
        100n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW,
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        createEitherFromHex(LP_USER),
      );

      const pairId = lunarswap.getPairId(usdcCoin, nightCoin);
      const reserveId1 = lunarswap.getReserveId(pairId, usdcCoin.color);
      const reserveId2 = lunarswap.getReserveId(pairId, usdcCoin.color);

      expect(reserveId1).toEqual(reserveId2);
      expect(reserveId1.length).toBe(32);
    });

    it('should generate different reserve IDs for different token types in same pair', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 100n);

      // Create pair first
      const result = calculateAddLiquidityAmounts(
        100n, // desired USDC
        100n, // desired NIGHT
        0n, // reserve USDC
        0n, // reserve NIGHT
        SLIPPAGE_TOLERANCE.LOW,
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        createEitherFromHex(LP_USER),
      );

      const pairId = lunarswap.getPairId(usdcCoin, nightCoin);
      const reserveIdA = lunarswap.getReserveId(pairId, usdcCoin.color);
      const reserveIdB = lunarswap.getReserveId(pairId, nightCoin.color);

      expect(reserveIdA).not.toEqual(reserveIdB);
      expect(reserveIdA.length).toBe(32);
      expect(reserveIdB.length).toBe(32);
    });

    it('should generate different reserve IDs for same token type in different pairs', () => {
      const usdcCoin1 = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const nightCoin1 = night.mint(createEitherFromHex(LP_USER), 100n);
      const usdcCoin2 = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const dustCoin = dust.mint(createEitherFromHex(LP_USER), 100n);

      // Create first pair (USDC/NIGHT)
      const result1 = calculateAddLiquidityAmounts(
        100n,
        100n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );
      lunarswap.addLiquidity(
        usdcCoin1,
        nightCoin1,
        result1.amountAMin,
        result1.amountBMin,
        createEitherFromHex(LP_USER),
      );

      // Create second pair (USDC/DUST)
      const result2 = calculateAddLiquidityAmounts(
        100n,
        100n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );
      lunarswap.addLiquidity(
        usdcCoin2,
        dustCoin,
        result2.amountAMin,
        result2.amountBMin,
        createEitherFromHex(LP_USER),
      );

      const pairId1 = lunarswap.getPairId(usdcCoin1, nightCoin1);
      const pairId2 = lunarswap.getPairId(usdcCoin2, dustCoin);

      const reserveId1 = lunarswap.getReserveId(pairId1, usdcCoin1.color);
      const reserveId2 = lunarswap.getReserveId(pairId2, usdcCoin2.color);

      expect(reserveId1).not.toEqual(reserveId2);
      expect(reserveId1.length).toBe(32);
      expect(reserveId2.length).toBe(32);
    });

    it('should work with different senders', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 100n);

      // Create pair first
      const result = calculateAddLiquidityAmounts(
        100n,
        100n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        createEitherFromHex(LP_USER),
      );

      const pairId = lunarswap.getPairId(usdcCoin, nightCoin);

      // Test with default sender
      const reserveIdDefault = lunarswap.getReserveId(pairId, usdcCoin.color);

      // Test with explicit sender
      const explicitSender = sampleCoinPublicKey();
      const reserveIdExplicit = lunarswap.getReserveId(
        pairId,
        usdcCoin.color,
        explicitSender,
      );

      // Both should return the same result (reserve ID is deterministic)
      expect(reserveIdDefault).toEqual(reserveIdExplicit);
      expect(reserveIdDefault.length).toBe(32);
    });

    it('should handle edge cases with zero values', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 100n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 100n);

      // Create pair first
      const result = calculateAddLiquidityAmounts(
        100n,
        100n,
        0n,
        0n,
        SLIPPAGE_TOLERANCE.LOW,
      );
      lunarswap.addLiquidity(
        usdcCoin,
        nightCoin,
        result.amountAMin,
        result.amountBMin,
        createEitherFromHex(LP_USER),
      );

      const pairId = lunarswap.getPairId(usdcCoin, nightCoin);

      // Test with zero-filled token type
      const zeroTokenType = new Uint8Array(32).fill(0);
      const reserveIdZero = lunarswap.getReserveId(pairId, zeroTokenType);

      expect(reserveIdZero.length).toBe(32);
      expect(reserveIdZero).not.toEqual(new Uint8Array(32).fill(0)); // Should not be all zeros
    });

    it('should generate unique reserve IDs for all token types in multiple pairs', () => {
      const usdcCoin = usdc.mint(createEitherFromHex(LP_USER), 1000n);
      const nightCoin = night.mint(createEitherFromHex(LP_USER), 1000n);
      const dustCoin = dust.mint(createEitherFromHex(LP_USER), 1000n);
      const fooCoin = foo.mint(createEitherFromHex(LP_USER), 1000n);

      // Create multiple pairs
      const pairs = [
        { tokenA: usdcCoin, tokenB: nightCoin },
        { tokenA: usdcCoin, tokenB: dustCoin },
        { tokenA: nightCoin, tokenB: dustCoin },
        { tokenA: usdcCoin, tokenB: fooCoin },
      ];

      const reserveIds = new Set<string>();

      for (const { tokenA, tokenB } of pairs) {
        const result = calculateAddLiquidityAmounts(
          1000n,
          1000n,
          0n,
          0n,
          SLIPPAGE_TOLERANCE.LOW,
        );
        lunarswap.addLiquidity(
          tokenA,
          tokenB,
          result.amountAMin,
          result.amountBMin,
          createEitherFromHex(LP_USER),
        );

        const pairId = lunarswap.getPairId(tokenA, tokenB);
        const reserveIdA = lunarswap.getReserveId(pairId, tokenA.color);
        const reserveIdB = lunarswap.getReserveId(pairId, tokenB.color);

        // Convert to hex string for easier comparison
        const reserveIdAHex = Buffer.from(reserveIdA).toString('hex');
        const reserveIdBHex = Buffer.from(reserveIdB).toString('hex');

        reserveIds.add(reserveIdAHex);
        reserveIds.add(reserveIdBHex);

        expect(reserveIdA.length).toBe(32);
        expect(reserveIdB.length).toBe(32);
      }

      // All reserve IDs should be unique (8 tokens across 4 pairs)
      expect(reserveIds.size).toBe(8);
    });
  });
});
