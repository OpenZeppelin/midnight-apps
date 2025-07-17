import type { Logger } from 'pino';
import {
  ShieldedToken,
  type ShieldedTokenProviders,
} from '@midnight-dapps/shielded-token-api';

export const getPublicState = async (
  shieldedToken: ShieldedToken,
  providers: ShieldedTokenProviders,
  logger: Logger,
): Promise<void> => {
  logger.info('Getting public state...');

  const publicState = await ShieldedToken.getPublicState(
    providers,
    shieldedToken.deployedContractAddressHex,
  );

  if (publicState) {
    logger.info('Public state retrieved successfully');
    logger.info(`Contract Address: ${shieldedToken.deployedContractAddressHex}`);
    logger.info(`Public State: ${JSON.stringify(publicState, null, 2)}`);
  } else {
    logger.warn('No public state found for contract', {
      contractAddress: shieldedToken.deployedContractAddressHex,
    });
  }
};

export const getZswapChainState = async (
  shieldedToken: ShieldedToken,
  providers: ShieldedTokenProviders,
  logger: Logger,
): Promise<void> => {
  logger.info('Getting ZSwap chain state...');

  const zswapChainState = await ShieldedToken.getZswapChainState(
    providers,
    shieldedToken.deployedContractAddressHex,
  );

  if (zswapChainState) {
    logger.info('ZSwap chain state retrieved successfully');
    logger.info(`Contract Address: ${shieldedToken.deployedContractAddressHex}`);
    logger.info(`ZSwap Chain State: ${JSON.stringify(zswapChainState, null, 2)}`);
  } else {
    logger.warn('No ZSwap chain state found for contract', {
      contractAddress: shieldedToken.deployedContractAddressHex,
    });
  }
};

export const getDeployedContractState = async (
  shieldedToken: ShieldedToken,
  providers: ShieldedTokenProviders,
  logger: Logger,
): Promise<void> => {
  logger.info('Getting deployed contract state...');

  const deployedContractState = await ShieldedToken.getDeployedContractState(
    providers,
    shieldedToken.deployedContractAddressHex,
  );

  if (deployedContractState) {
    logger.info('Deployed contract state retrieved successfully');
    logger.info(`Contract Address: ${shieldedToken.deployedContractAddressHex}`);
    logger.info(`Deployed Contract State: ${JSON.stringify(deployedContractState, null, 2)}`);
  } else {
    logger.warn('No deployed contract state found for contract', {
      contractAddress: shieldedToken.deployedContractAddressHex,
    });
  }
};

export const subscribeToState = async (
  shieldedToken: ShieldedToken,
  logger: Logger,
): Promise<import('rxjs').Subscription> => {
  logger.info('Subscribing to contract state changes...');

  // Subscribe to the state observable
  const subscription = shieldedToken.state$.subscribe({
    next: (state) => {
      logger.info('Contract state updated', {
        contractAddress: shieldedToken.deployedContractAddressHex,
        hasLedgerState: !!state.ledger,
        hasPrivateState: !!state.privateState,
      });
    },
    error: (error) => {
      logger.error('Error in state subscription', error);
    },
    complete: () => {
      logger.info('State subscription completed');
    },
  });

  // Return the subscription so it can be cleaned up later
  return subscription;
}; 