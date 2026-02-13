import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  Lunarswap,
  type LunarswapProviders,
} from '@openzeppelin/midnight-apps-lunarswap-api';
import type { Logger } from 'pino';

export const deployContract = async (
  providers: LunarswapProviders,
  logger: Logger,
): Promise<Lunarswap> => {
  logger.info('Deploying LunarSwap contract...');

  const lpTokenNonce = new Uint8Array(32).fill(0x44);

  let lunarswap: Lunarswap;
  try {
    const networkId = getNetworkId();
    logger.info(`Network ID: ${networkId}`);
    lunarswap = await Lunarswap.deploy(providers, lpTokenNonce, logger);
  } catch (error) {
    if (error instanceof Error) {
      logger.error({ error: error.message }, 'Failed to deploy LunarSwap contract');
      logger.error({ error: error.stack }, 'Failed to deploy LunarSwap contract');
      throw error;
    }
    logger.error({ error }, 'Failed to deploy LunarSwap contract');
    throw new Error('Failed to deploy LunarSwap contract');
  }

  logger.info('LunarSwap contract deployed successfully!');
  logger.info(`Contract Address: ${lunarswap.deployedContractAddressHex}`);

  return lunarswap;
};

export const joinContract = async (
  providers: LunarswapProviders,
  contractAddress: string,
  logger: Logger,
): Promise<Lunarswap> => {
  logger.info('Joining LunarSwap contract...');

  // Use the LunarSwap API to join the contract
  const contractAddressBytes = new Uint8Array(
    Buffer.from(contractAddress, 'hex'),
  );

  const currentContractState =
    await providers.publicDataProvider.queryContractState(contractAddress);
  if (!currentContractState) {
    throw new Error('Contract state not found');
  }

  const lunarswap = await Lunarswap.join(
    providers,
    { bytes: contractAddressBytes },
    logger,
  );

  logger.info({ lunarswap }, 'Successfully joined LunarSwap contract!');
  logger.info(`Contract Address: ${lunarswap.deployedContractAddressHex}`);

  return lunarswap;
};
