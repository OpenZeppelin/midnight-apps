import { randomBytes } from 'node:crypto';
import {
  ShieldedFungibleToken,
  type ShieldedFungibleTokenProviders,
} from '@openzeppelin/midnight-apps-shielded-token-api';
import type { Logger } from 'pino';

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.replace(/^0x/, '');
  if (clean.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    bytes[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return bytes;
}

export const deployContract = async (
  providers: ShieldedFungibleTokenProviders,
  zkConfigPath: string,
  name: string,
  symbol: string,
  logger: Logger,
): Promise<ShieldedFungibleToken> => {
  logger.info('Deploying ShieldedFungibleToken contract...');

  const nonce = randomBytes(32);
  const domain = randomBytes(32);

  try {
    const token = await ShieldedFungibleToken.deploy(
      providers,
      nonce,
      name,
      symbol,
      domain,
      zkConfigPath,
      logger,
    );
    logger.info('ShieldedFungibleToken contract deployed successfully');
    logger.info(`Contract address: ${token.deployedContractAddressHex}`);
    return token;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        { error: error.message },
        'Failed to deploy ShieldedFungibleToken contract',
      );
      logger.error(
        { error: error.stack },
        'Failed to deploy ShieldedFungibleToken contract',
      );
      throw error;
    }
    logger.error(
      { error },
      'Failed to deploy ShieldedFungibleToken contract',
    );
    throw new Error('Failed to deploy ShieldedFungibleToken contract');
  }
};

export const joinContract = async (
  providers: ShieldedFungibleTokenProviders,
  contractAddressHex: string,
  zkConfigPath: string,
  logger: Logger,
): Promise<ShieldedFungibleToken> => {
  logger.info('Joining ShieldedFungibleToken contract...');

  const bytes = hexToBytes(contractAddressHex.trim().replace(/^0x/, ''));
  const contractAddress = { bytes };

  try {
    const token = await ShieldedFungibleToken.join(
      providers,
      contractAddress,
      zkConfigPath,
      logger,
    );
    logger.info('Successfully joined ShieldedFungibleToken contract');
    logger.info(`Contract address: ${token.deployedContractAddressHex}`);
    return token;
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        { error: error.message },
        'Failed to join ShieldedFungibleToken contract',
      );
      logger.error(
        { error: error.stack },
        'Failed to join ShieldedFungibleToken contract',
      );
      throw error;
    }
    logger.error(
      { error },
      'Failed to join ShieldedFungibleToken contract',
    );
    throw new Error('Failed to join ShieldedFungibleToken contract');
  }
};
