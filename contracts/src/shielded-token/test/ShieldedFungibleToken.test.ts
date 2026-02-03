import {
  encodeRawTokenType,
  rawTokenType,
} from '@midnight-ntwrk/compact-runtime';
import {
  getNetworkId,
  type NetworkId,
  setNetworkId,
} from '@midnight-ntwrk/midnight-js-network-id';
import {
  MidnightBech32m,
  ShieldedAddress,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import type {
  ContractAddress,
  Either,
  ShieldedCoinInfo,
  ZswapCoinPublicKey,
} from '@src/artifacts/shielded-token/ShieldedFungibleToken/contract/index.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { ShieldedFungibleTokenSimulator } from './mocks/ShieldedFungibleTokenSimulator.js';

const NONCE = new Uint8Array(32).fill(0x01);
const DOMAIN = new Uint8Array(32).fill(0x42);

// Static addresses for testing
const ADMIN =
  'mn_shield-addr_test1yz95e4uu8j88t7vjvjnq8ywv9z7rg4dyvas98zhlktqtdhj600nqxqyja8d99chz8mmek4g4swsz6ldws3dlx9gzza96434w83kc8grj2umx4xe6';
const USER =
  'mn_shield-addr_test16fcl2lpnahvlq8v79tmwwlplhecg3s08axcunwpkezzgk59kf20qxq9jwznuslc496azd0ety7f4y5t5sgw89r6wfdsgars6ufj4zf936sprk8a9';

const NETWORK_ID: NetworkId = 'test';

setNetworkId(NETWORK_ID);

// Helper function to create Either for hex addresses
const createEitherFromHex = (
  hexString: string,
): Either<ZswapCoinPublicKey, ContractAddress> => {
  const bech32mAddress = MidnightBech32m.parse(hexString);
  const shieldedAddress = ShieldedAddress.codec.decode(
    getNetworkId(),
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
  });

  describe('mint functionality', () => {
    it('should initialize token type in constructor and maintain it', () => {
      const recipient = createEitherFromHex(USER);
      const amount = 1000n;

      // Check token type is not set before lazy mint
      const initialType = token.tokenType();
      expect(initialType).toEqual(new Uint8Array(32)); // Should be all zeros

      // Perform first mint
      const coin = token.mint(recipient, amount);

      // Calculate the expected token type from domain and contract address
      const publicState = token.getPublicState();
      const expectedType = encodeRawTokenType(
        rawTokenType(
          publicState.ShieldedFungibleToken__domain,
          token.contractAddress,
        ),
      );
      expect(expectedType).not.toEqual(initialType);

      // Verify minted coin color matches the calculated token type
      expect(coin.color).toEqual(expectedType);
      expect(token.tokenType()).toEqual(expectedType);

      // Second mint should have the same color as the expected type
      const coin2 = token.mint(recipient, 500n);
      expect(coin2.color).toEqual(expectedType);

      // Type should remain unchanged after subsequent mints
      expect(token.tokenType()).toEqual(expectedType);
    });

    it('should mint tokens to a recipient', () => {
      const recipient = createEitherFromHex(USER);
      const amount = 1000n;

      const coin = token.mint(recipient, amount);

      // Verify the minted coin
      const publicState = token.getPublicState();
      const expectedType = encodeRawTokenType(
        rawTokenType(
          publicState.ShieldedFungibleToken__domain,
          token.contractAddress,
        ),
      );
      expect(coin.color).toEqual(expectedType);
      expect(coin.value).toEqual(amount);

      // Verify total supply increased
      expect(token.totalSupply()).toEqual(amount);
    });

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

    it('should handle minting zero amount', () => {
      const recipient = createEitherFromHex(USER);
      const amount = 0n;

      const coin = token.mint(recipient, amount);

      expect(coin.value).toBe(0n);
      expect(token.totalSupply()).toBe(0n);
    });

    it('should handle minting large amounts', () => {
      const recipient = createEitherFromHex(USER);
      const amount = 1_000_000n;

      const coin = token.mint(recipient, amount);

      expect(coin.value).toBe(amount);
      expect(token.totalSupply()).toBe(amount);
    });

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

    it('should generate unique nonces for each mint', () => {
      const recipient = createEitherFromHex(USER);

      // Mint multiple coins and collect their nonces
      const coin1 = token.mint(recipient, 100n);
      const coin2 = token.mint(recipient, 200n);
      const coin3 = token.mint(recipient, 300n);

      // Each coin should have a unique nonce
      expect(coin1.nonce).not.toEqual(coin2.nonce);
      expect(coin1.nonce).not.toEqual(coin3.nonce);
      expect(coin2.nonce).not.toEqual(coin3.nonce);

      // Nonces should be properly defined (32 bytes each)
      expect(coin1.nonce).toBeInstanceOf(Uint8Array);
      expect(coin1.nonce.length).toBe(32);
      expect(coin2.nonce).toBeInstanceOf(Uint8Array);
      expect(coin2.nonce.length).toBe(32);
      expect(coin3.nonce).toBeInstanceOf(Uint8Array);
      expect(coin3.nonce.length).toBe(32);
    });
  });

  describe('burn functionality', () => {
    let mintedCoin: ShieldedCoinInfo;

    beforeEach(() => {
      // Setup: mint some tokens for burning tests
      const recipient = createEitherFromHex(USER);
      mintedCoin = token.mint(recipient, 1000n);
    });

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

    it('should burn entire coin amount', () => {
      const burnAmount = 1000n; // Burn entire coin

      const result = token.burn(mintedCoin, burnAmount);

      expect(result.sent.value).toBe(burnAmount);
      expect(result.change.is_some).toBe(false);
      expect(token.totalSupply()).toBe(0n);
    });

    it('should handle burning zero amount', () => {
      const burnAmount = 0n;

      const result = token.burn(mintedCoin, burnAmount);

      expect(result.sent.value).toBe(0n);
      expect(result.change.is_some).toBe(true);
      expect(result.change.value.value).toBe(1000n); // Original amount
      expect(token.totalSupply()).toBe(1000n); // Unchanged
    });

    it('should fail when burning more than available', () => {
      const burnAmount = 1500n; // More than available

      expect(() => {
        token.burn(mintedCoin, burnAmount);
      }).toThrow('ShieldedToken: insufficient token amount to burn');
    });

    it('should fail when burning a coin with incorrect token type', () => {
      // Create a coin with a different token type (wrong color)
      const incorrectCoin: ShieldedCoinInfo = {
        color: new Uint8Array(32).fill(0xff), // Different color
        nonce: mintedCoin.nonce,
        value: 100n,
      };

      expect(() => {
        token.burn(incorrectCoin, 50n);
      }).toThrow('ShieldedToken: token not created from this contract');
    });
  });

  describe('mint and burn integration', () => {
    it('should handle mint-burn-mint cycle correctly', () => {
      const recipient = createEitherFromHex(USER);

      // First mint
      const coin1 = token.mint(recipient, 1000n);
      expect(token.totalSupply()).toBe(1000n);

      // Burn some tokens
      const burnResult = token.burn(coin1, 300n);
      expect(token.totalSupply()).toBe(700n);

      // Verify burn result
      expect(burnResult.sent.value).toEqual(300n);
      expect(burnResult.change.is_some).toEqual(true);
      expect(burnResult.change.value.value).toEqual(700n);

      // Second mint
      token.mint(recipient, 500n);
      expect(token.totalSupply()).toEqual(1200n);
    });

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
    it('should handle very large amounts', () => {
      const recipient = createEitherFromHex(USER);
      const largeAmount = 2n ** 64n - 1n;

      const coin = token.mint(recipient, largeAmount);
      expect(coin.value).toBe(largeAmount);
      expect(token.totalSupply()).toBe(largeAmount);
    });

    it('should handle smallest amounts', () => {
      const recipient = createEitherFromHex(USER);
      const smallestAmount = 1n;

      const coin = token.mint(recipient, smallestAmount);
      expect(coin.value).toBe(smallestAmount);
      expect(token.totalSupply()).toBe(smallestAmount);
    });

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
