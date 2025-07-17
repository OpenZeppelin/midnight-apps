import type { Logger } from 'pino';
import type { Wallet } from '@midnight-ntwrk/wallet-api';
import type { Resource } from '@midnight-ntwrk/wallet';
import { firstValueFrom } from 'rxjs';
import type { ShieldedToken } from '@midnight-dapps/shielded-token-api';
import { encodeCoinPublicKey } from '@midnight-ntwrk/ledger';
import type { Either, ZswapCoinPublicKey, CoinInfo, ContractAddress } from '@midnight-dapps/compact-std';
import { ShieldedAddress, MidnightBech32m } from '@midnight-ntwrk/wallet-sdk-address-format';
import { getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

// Helper function to create CoinInfo from user input
export const createCoinInfo = (color: string, value: bigint): CoinInfo => ({
  color: new Uint8Array(Buffer.from(color, 'hex')),
  value,
  nonce: new Uint8Array(32),
});

// Helper function to create Either for recipient
export const createRecipient = (address: string): Either<ZswapCoinPublicKey, ContractAddress> => {
  // For minting, we typically want to use the wallet's coin public key (left side)
  // rather than a contract address (right side)
  return {
    is_left: true,
    left: { bytes: new Uint8Array(Buffer.from(address, 'hex')) },
    right: { bytes: new Uint8Array(32) },
  };
};

export const mintTokens = async (
  shieldedToken: ShieldedToken,
  wallet: Wallet & Resource,
  amount: bigint,
  logger: Logger,
  recipientCoinPublicKey?: string,
): Promise<void> => {
  logger.info('Minting tokens...', {
    amount: amount.toString(),
    recipient: recipientCoinPublicKey ? 'custom' : 'self',
  });

  let recipient: Either<ZswapCoinPublicKey, ContractAddress>;
  
  if (recipientCoinPublicKey) {
    // Parse the shielded address string to get the MidnightBech32m object
    const bech32mAddress = MidnightBech32m.parse(recipientCoinPublicKey);
    
    // Decode the bech32m address to get the ShieldedAddress object
    const shieldedAddress = ShieldedAddress.codec.decode(getZswapNetworkId(), bech32mAddress);
    
    // Extract the coin public key from the shielded address
    const coinPublicKeyBytes = shieldedAddress.coinPublicKey.data;
    
    // Use the provided recipient's coin public key
    recipient = {
      is_left: true,
      left: { bytes: coinPublicKeyBytes },
      right: { bytes: new Uint8Array(32) },
    };
  } else {
    // Use the wallet's own coin public key (default behavior)
    const state = await firstValueFrom(wallet.state());
    recipient = {
      is_left: true,
      left: { bytes: encodeCoinPublicKey(state.coinPublicKey) },
      right: { bytes: new Uint8Array(32) },
    };
  }

  await shieldedToken.mint(recipient, amount);

  logger.info('Tokens minted successfully!');
};

export const burnTokens = async (
  shieldedToken: ShieldedToken,
  coin: CoinInfo,
  amount: bigint,
  logger: Logger,
): Promise<void> => {
  logger.info('Burning tokens...', {
    coinColor: Buffer.from(coin.color).toString('hex'),
    coinValue: coin.value.toString(),
    burnAmount: amount.toString(),
  });

  await shieldedToken.burn(coin, amount);

  logger.info('Tokens burned successfully!');
};

export const getTokenInfo = async (
  shieldedToken: ShieldedToken,
  logger: Logger,
): Promise<void> => {
  logger.info('Getting token information...');

  const name = await shieldedToken.name();
  const symbol = await shieldedToken.symbol();
  const decimals = await shieldedToken.decimals();
  const totalSupply = await shieldedToken.totalSupply();

  logger.info('Token information retrieved successfully');
  logger.info(`Contract Address: ${shieldedToken.deployedContractAddressHex}`);
  logger.info(`Name: ${name}`);
  logger.info(`Symbol: ${symbol}`);
  logger.info(`Decimals: ${decimals}`);
  logger.info(`Total Supply: ${totalSupply}`);
}; 