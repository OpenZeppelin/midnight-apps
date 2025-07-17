import type { Logger } from 'pino';
import {
  ShieldedToken,
  type ShieldedTokenProviders,
} from '@midnight-dapps/shielded-token-api';
import { getZswapNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { randomBytes } from './utils';

export const deployContract = async (providers: ShieldedTokenProviders, logger: Logger): Promise<ShieldedToken> => {
  logger.info('Deploying Shielded Token contract...');

  // Generate random nonce and domain for deployment
  const nonce = randomBytes(32);
  const domain = randomBytes(32);

  let shieldedToken: ShieldedToken;
  try {
    const networkId = getZswapNetworkId();
    logger.info(`Network ID: ${networkId}`);
    shieldedToken = await ShieldedToken.deploy(
      providers,
      nonce,
      'MyShieldedToken', // name
      'MST',            // symbol
      domain,
      logger,
    );
  } catch (error) {
    if (error instanceof Error) {
      logger.error('Failed to deploy Shielded Token contract:', error.message);
      logger.error('Failed to deploy Shielded Token contract:', error.stack);
      throw error;
    } 
    logger.error('Failed to deploy Shielded Token contract:', error);
    throw new Error('Failed to deploy Shielded Token contract');
  }

  logger.info('Shielded Token contract deployed successfully!');
  logger.info(`Contract Address: ${shieldedToken.deployedContractAddressHex}`);

  return shieldedToken;
};

export const joinContract = async (
  providers: ShieldedTokenProviders,
  contractAddress: string,
  logger: Logger,
): Promise<ShieldedToken> => {
  logger.info('Joining Shielded Token contract...');

  // Convert hex string to ContractAddress
  const contractAddressBytes = new Uint8Array(Buffer.from(contractAddress, 'hex'));
  const shieldedToken = await ShieldedToken.join(providers, { bytes: contractAddressBytes }, logger);

  logger.info('Successfully joined Shielded Token contract!');
  logger.info(`Contract Address: ${shieldedToken.deployedContractAddressHex}`);

  return shieldedToken;
}; 