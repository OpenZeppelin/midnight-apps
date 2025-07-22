import type {
  CoinInfo,
  ContractAddress,
  Either,
  ZswapCoinPublicKey,
} from '@midnight-dapps/compact-std';
import {
  NetworkId,
  getZswapNetworkId,
  setNetworkId,
} from '@midnight-ntwrk/midnight-js-network-id';
import {
  MidnightBech32m,
  ShieldedAddress,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShieldedFungibleTokenSimulator } from './ShieldedFungibleTokenSimulator';

const NONCE = new Uint8Array(32).fill(0x44);
const DOMAIN = new Uint8Array(32).fill(0x44);

// Static addresses for testing
//const ADMIN = "9905a18ce5bd2d7945818b18be9b0afe387efe29c8ffa81d90607a651fb83a2b";
const ADMIN =
  'mn_shield-addr_test1yz95e4uu8j88t7vjvjnq8ywv9z7rg4dyvas98zhlktqtdhj600nqxqyja8d99chz8mmek4g4swsz6ldws3dlx9gzza96434w83kc8grj2umx4xe6';
//const USER = "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456";
const USER =
  'mn_shield-addr_test16fcl2lpnahvlq8v79tmwwlplhecg3s08axcunwpkezzgk59kf20qxq9jwznuslc496azd0ety7f4y5t5sgw89r6wfdsgars6ufj4zf936sprk8a9';

setNetworkId(NetworkId.TestNet);

// Helper function to create Either for hex addresses
const createEitherFromHex = (
  hexString: string,
): Either<ZswapCoinPublicKey, ContractAddress> => {
  const bech32mAddress = MidnightBech32m.parse(hexString);
  const shieldedAddress = ShieldedAddress.codec.decode(
    getZswapNetworkId(),
    bech32mAddress,
  );
  const coinPublicKeyBytes = shieldedAddress.coinPublicKey.data;
  return {
    is_left: true,
    left: { bytes: coinPublicKeyBytes },
    right: { bytes: new Uint8Array(32) },
  };
};

describe('ShieldedFungibleToken', () => {
  let token: ShieldedFungibleTokenSimulator;

  const setup = () => {
    token = new ShieldedFungibleTokenSimulator(
      NONCE,
      'Test Token',
      'TEST',
      DOMAIN,
    );
  };

  beforeEach(setup);

  describe('constructor and initialization', () => {
    it('should initialize with correct token properties', () => {
      // Test basic token properties
      expect(token.name()).toBe('Test Token');
      expect(token.symbol()).toBe('TEST');
      expect(token.decimals()).toBe(18n);
      expect(token.totalSupply()).toBe(0n);
    });

    it('should have a valid contract address', () => {
      expect(token.contractAddress).toBeDefined();
      expect(typeof token.contractAddress).toBe('string');
      expect(token.contractAddress.length).toBeGreaterThan(0);
    });

    it('should have a valid sender', () => {
      expect(token.sender).toBeDefined();
      expect(typeof token.sender).toBe('string');
      expect(token.sender.length).toBeGreaterThan(0);
    });
  });

  describe('mint functionality', () => {
    /**
     * Tests basic minting functionality
     *
     * Mathematical calculations:
     * - Initial total supply: 0
     * - Mint amount: 1000 tokens
     * - Expected total supply after mint: 1000
     *
     * Expected: CoinInfo with correct color and value, total supply increases
     */
    it('should mint tokens to a recipient', () => {
      const recipient = createEitherFromHex(USER);
      const amount = 1000n;

      const coin = token.mint(recipient, amount);

      // Verify the minted coin
      expect(coin).toBeDefined();
      expect(coin.color).toBeDefined();
      expect(coin.value).toBe(amount);

      // Verify total supply increased
      expect(token.totalSupply()).toBe(amount);
    });

    /**
     * Tests minting to different recipients
     *
     * Mathematical calculations:
     * - User 1: 500 tokens
     * - User 2: 300 tokens
     * - Total supply: 500 + 300 = 800 tokens
     *
     * Expected: Each user gets their tokens, total supply reflects sum
     */
    it('should mint tokens to multiple recipients', () => {
      const recipient1 = createEitherFromHex(ADMIN);
      const recipient2 = createEitherFromHex(USER);
      const amount1 = 500n;
      const amount2 = 300n;

      const coin1 = token.mint(recipient1, amount1);
      const coin2 = token.mint(recipient2, amount2);

      // Verify individual coins
      expect(coin1.value).toBe(amount1);
      expect(coin2.value).toBe(amount2);

      // Verify total supply
      expect(token.totalSupply()).toBe(amount1 + amount2);
    });

    /**
     * Tests minting zero amount
     *
     * Mathematical calculations:
     * - Mint amount: 0
     * - Expected total supply: unchanged (0)
     *
     * Expected: Coin with zero value, total supply unchanged
     */
    it('should handle minting zero amount', () => {
      const recipient = createEitherFromHex(USER);
      const amount = 0n;

      const coin = token.mint(recipient, amount);

      expect(coin.value).toBe(0n);
      expect(token.totalSupply()).toBe(0n);
    });

    /**
     * Tests minting large amounts
     *
     * Mathematical calculations:
     * - Mint amount: 1,000,000 tokens
     * - Expected total supply: 1,000,000
     *
     * Expected: Large amount minted successfully
     */
    it('should handle minting large amounts', () => {
      const recipient = createEitherFromHex(USER);
      const amount = 1_000_000n;

      const coin = token.mint(recipient, amount);

      expect(coin.value).toBe(amount);
      expect(token.totalSupply()).toBe(amount);
    });

    /**
     * Tests minting to contract address
     *
     * Mathematical calculations:
     * - Mint amount: 1000 tokens
     * - Expected total supply: 1000
     *
     * Expected: Tokens minted to contract address successfully
     */
    it('should mint tokens to contract address', () => {
      const contractAddress: Either<ZswapCoinPublicKey, ContractAddress> = {
        is_left: false,
        left: { bytes: new Uint8Array(32) },
        right: { bytes: new Uint8Array(32).fill(0xaa) },
      };
      const amount = 1000n;

      const coin = token.mint(contractAddress, amount);

      expect(coin.value).toBe(amount);
      expect(token.totalSupply()).toBe(amount);
    });
  });

  describe('burn functionality', () => {
    let mintedCoin: CoinInfo;

    beforeEach(() => {
      // Setup: mint some tokens for burning tests
      const recipient = createEitherFromHex(USER);
      mintedCoin = token.mint(recipient, 1000n);
    });

    /**
     * Tests basic burning functionality
     *
     * Mathematical calculations:
     * - Initial total supply: 1000
     * - Burn amount: 300
     * - Expected total supply after burn: 1000 - 300 = 700
     * - Expected change: 700 tokens
     *
     * Expected: Burn successful, change returned, total supply decreased
     */
    it('should burn tokens and return change', () => {
      const burnAmount = 300n;

      const result = token.burn(mintedCoin, burnAmount);

      // Verify burn result
      expect(result.sent.value).toBe(burnAmount);
      expect(result.change.is_some).toBe(true);
      expect(result.change.value.value).toBe(700n); // 1000 - 300

      // Verify total supply decreased
      expect(token.totalSupply()).toBe(700n);
    });

    /**
     * Tests burning entire coin amount
     *
     * Mathematical calculations:
     * - Initial total supply: 1000
     * - Burn amount: 1000 (entire coin)
     * - Expected total supply after burn: 0
     * - Expected change: none (is_some: false)
     *
     * Expected: Entire coin burned, no change returned
     */
    it('should burn entire coin amount', () => {
      const burnAmount = 1000n; // Burn entire coin

      const result = token.burn(mintedCoin, burnAmount);

      expect(result.sent.value).toBe(burnAmount);
      expect(result.change.is_some).toBe(false);
      expect(token.totalSupply()).toBe(0n);
    });

    /**
     * Tests burning zero amount
     *
     * Mathematical calculations:
     * - Initial total supply: 1000
     * - Burn amount: 0
     * - Expected total supply after burn: 1000 (unchanged)
     * - Expected change: 1000 tokens (entire original coin)
     *
     * Expected: No tokens burned, entire coin returned as change
     */
    it('should handle burning zero amount', () => {
      const burnAmount = 0n;

      const result = token.burn(mintedCoin, burnAmount);

      expect(result.sent.value).toBe(0n);
      expect(result.change.is_some).toBe(true);
      expect(result.change.value.value).toBe(1000n); // Original amount
      expect(token.totalSupply()).toBe(1000n); // Unchanged
    });

    /**
     * Tests burning more than available
     *
     * Mathematical calculations:
     * - Available: 1000 tokens
     * - Attempt to burn: 1500 tokens
     * - Expected: Error or failure
     *
     * Expected: Should fail when trying to burn more than available
     */
    it('should fail when burning more than available', () => {
      const burnAmount = 1500n; // More than available

      expect(() => {
        token.burn(mintedCoin, burnAmount);
      }).toThrow();
    });
  });

  describe('mint and burn integration', () => {
    /**
     * Tests mint-burn-mint cycle
     *
     * Mathematical calculations:
     * - Initial: 0 tokens
     * - Mint 1: 1000 tokens
     * - Burn: 300 tokens (700 remaining)
     * - Mint 2: 500 tokens
     * - Final total supply: 700 + 500 = 1200
     *
     * Expected: Total supply correctly tracks mint/burn operations
     */
    it('should handle mint-burn-mint cycle correctly', () => {
      const recipient = createEitherFromHex(USER);

      // First mint
      const coin1 = token.mint(recipient, 1000n);
      expect(token.totalSupply()).toBe(1000n);

      // Burn some tokens
      const burnResult = token.burn(coin1, 300n);
      expect(token.totalSupply()).toBe(700n);

      // Second mint
      token.mint(recipient, 500n);
      expect(token.totalSupply()).toBe(1200n);

      // Verify burn result
      expect(burnResult.sent.value).toBe(300n);
      expect(burnResult.change.is_some).toBe(true);
      expect(burnResult.change.value.value).toBe(700n);
    });

    /**
     * Tests multiple burns from same coin
     *
     * Mathematical calculations:
     * - Initial: 1000 tokens
     * - Burn 1: 200 tokens (800 remaining)
     * - Burn 2: 300 tokens (500 remaining)
     * - Burn 3: 100 tokens (400 remaining)
     * - Final total supply: 400
     *
     * Expected: Multiple burns work correctly
     */
    it('should handle multiple burns from same coin', () => {
      const recipient = createEitherFromHex(USER);
      const coin = token.mint(recipient, 1000n);

      // First burn
      const result1 = token.burn(coin, 200n);
      expect(token.totalSupply()).toBe(800n);
      expect(result1.sent.value).toBe(200n);

      // Second burn (using change from first burn)
      const result2 = token.burn(result1.change.value, 300n);
      expect(token.totalSupply()).toBe(500n);
      expect(result2.sent.value).toBe(300n);

      // Third burn
      const result3 = token.burn(result2.change.value, 100n);
      expect(token.totalSupply()).toBe(400n);
      expect(result3.sent.value).toBe(100n);
      expect(result3.change.value.value).toBe(400n);
    });
  });

  describe('edge cases and error handling', () => {
    /**
     * Tests very large amounts
     *
     * Mathematical calculations:
     * - Mint amount: 2^64 - 1 (max safe amount)
     * - Expected: Should handle large amounts without overflow
     *
     * Expected: Large amounts processed correctly
     */
    it('should handle very large amounts', () => {
      const recipient = createEitherFromHex(USER);
      const largeAmount = 2n ** 64n - 1n;

      const coin = token.mint(recipient, largeAmount);
      expect(coin.value).toBe(largeAmount);
      expect(token.totalSupply()).toBe(largeAmount);
    });

    /**
     * Tests precision with decimals
     *
     * Mathematical calculations:
     * - Token has 18 decimals
     * - Mint amount: 1 (smallest unit)
     * - Expected: Should handle smallest amounts correctly
     *
     * Expected: Smallest amounts processed correctly
     */
    it('should handle smallest amounts', () => {
      const recipient = createEitherFromHex(USER);
      const smallestAmount = 1n;

      const coin = token.mint(recipient, smallestAmount);
      expect(coin.value).toBe(smallestAmount);
      expect(token.totalSupply()).toBe(smallestAmount);
    });

    /**
     * Tests state consistency
     *
     * Mathematical calculations:
     * - Perform multiple operations
     * - Verify state remains consistent
     *
     * Expected: Contract state remains consistent through operations
     */
    it('should maintain state consistency', () => {
      const recipient = createEitherFromHex(USER);

      // Perform multiple operations
      const coin1 = token.mint(recipient, 1000n);
      token.mint(recipient, 500n);
      token.burn(coin1, 300n);
      token.mint(recipient, 200n);

      // Verify final state
      expect(token.totalSupply()).toBe(1400n); // 1000 + 500 - 300 + 200
      expect(token.name()).toBe('Test Token');
      expect(token.symbol()).toBe('TEST');
      expect(token.decimals()).toBe(18n);
    });
  });

  describe('contract state management', () => {
    it('should provide access to contract state', () => {
      // Test public state
      const publicState = token.getCurrentPublicState();
      expect(publicState).toBeDefined();

      // Test private state
      const privateState = token.getCurrentPrivateState();
      expect(privateState).toBeDefined();

      // Test contract state
      const contractState = token.getCurrentContractState();
      expect(contractState).toBeDefined();
    });

    it('should maintain circuit context through operations', () => {
      const recipient = createEitherFromHex(USER);
      const initialContext = token.circuitContext;

      // Perform operation
      token.mint(recipient, 1000n);

      // Context should be updated
      expect(token.circuitContext).not.toBe(initialContext);
      expect(token.circuitContext).toBeDefined();
    });
  });
});
