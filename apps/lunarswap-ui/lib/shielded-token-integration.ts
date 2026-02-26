import {
  ShieldedFungibleToken,
  type ShieldedFungibleTokenProviders,
} from '@openzeppelin/midnight-apps-shielded-token-api';
import { Buffer } from 'buffer';
import type { Logger } from 'pino';
import type { ProviderCallbackAction } from './wallet-context';

const SHIELDED_TOKEN_ZK_CONFIG_BASE =
  typeof window !== 'undefined'
    ? `${window.location.origin}/shielded-token`
    : '';

export interface DeployTokenResult {
  contractAddress: string;
  /** Token type (color) as hex string for use in pool/token config */
  tokenType: string;
}

export class ShieldedTokenIntegration {
  private tokenInstance: ShieldedFungibleToken | null = null;
  private readonly getProviders: () => ShieldedFungibleTokenProviders;
  private readonly callback: (action: ProviderCallbackAction) => void;
  private readonly logger?: Logger;

  constructor(
    getProviders: () => ShieldedFungibleTokenProviders,
    callback: (action: ProviderCallbackAction) => void,
    logger?: Logger,
  ) {
    this.getProviders = getProviders;
    this.callback = callback;
    this.logger = logger;
  }

  /**
   * Deploy a new ShieldedFungibleToken contract.
   * Uses random 32-byte nonce and domain.
   */
  async deployToken(name: string, symbol: string): Promise<DeployTokenResult> {
    const nonce = crypto.getRandomValues(new Uint8Array(32));
    const domain = crypto.getRandomValues(new Uint8Array(32));
    const providers = this.getProviders();
    const zkConfigPath = SHIELDED_TOKEN_ZK_CONFIG_BASE;
    if (!zkConfigPath) {
      throw new Error('Shielded token ZK config base URL not available');
    }
    const token = await ShieldedFungibleToken.deploy(
      providers,
      nonce,
      name,
      symbol,
      domain,
      zkConfigPath,
      this.logger,
    );
    this.tokenInstance = token;
    const contractAddress = token.deployedContractAddressHex;
    // Use contract address as token type for ledger/pool compatibility
    const tokenType = `0200${contractAddress}`;
    return { contractAddress, tokenType };
  }

  /**
   * Join an existing deployed ShieldedFungibleToken by address.
   */
  async joinToken(contractAddressHex: string): Promise<void> {
    const providers = this.getProviders();
    const zkConfigPath = SHIELDED_TOKEN_ZK_CONFIG_BASE;
    if (!zkConfigPath) {
      throw new Error('Shielded token ZK config base URL not available');
    }
    const contractAddress = {
      bytes: new Uint8Array(Buffer.from(contractAddressHex, 'hex')),
    };
    this.tokenInstance = await ShieldedFungibleToken.join(
      providers,
      contractAddress,
      zkConfigPath,
      this.logger,
    );
  }

  /**
   * Mint tokens to a recipient. Requires having deployed or joined a token first.
   */
  async mintTokens(
    recipientCoinPublicKeyBech32: string,
    amount: bigint,
  ): Promise<unknown> {
    const token = this.tokenInstance;
    if (!token) {
      throw new Error('No token contract: deploy or join a token first');
    }
    const { MidnightBech32m, ShieldedCoinPublicKey } = await import(
      '@midnight-ntwrk/wallet-sdk-address-format'
    );
    const { getNetworkId } = await import(
      '@midnight-ntwrk/midnight-js-network-id'
    );
    const bech32m = MidnightBech32m.parse(recipientCoinPublicKeyBech32);
    const coinPublicKey = ShieldedCoinPublicKey.codec.decode(
      getNetworkId(),
      bech32m,
    );
    const recipient = {
      is_left: true,
      left: { bytes: coinPublicKey.data },
      right: { bytes: new Uint8Array(32) },
    };
    return token.mint(recipient, amount);
  }

  get currentTokenAddress(): string | null {
    return this.tokenInstance?.deployedContractAddressHex ?? null;
  }
}

export const createShieldedTokenIntegration = (
  getProviders: () => ShieldedFungibleTokenProviders,
  callback: (action: ProviderCallbackAction) => void,
  logger?: Logger,
): ShieldedTokenIntegration =>
  new ShieldedTokenIntegration(getProviders, callback, logger);
