// SPDX-License-Identifier: MIT
// Based on bboard-cli wallet-utils pattern

import type { UnshieldedTokenType } from '@midnight-ntwrk/ledger-v7';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import {
  type EnvironmentConfiguration,
  FaucetClient,
} from '@midnight-ntwrk/testkit-js';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import type {
  FacadeState,
  WalletFacade,
} from '@midnight-ntwrk/wallet-sdk-facade';
import { ShieldedWallet } from '@midnight-ntwrk/wallet-sdk-shielded';
import type {
  UnshieldedWallet,
  UnshieldedWalletState,
} from '@midnight-ntwrk/wallet-sdk-unshielded-wallet';
import type { Logger } from 'pino';
import * as Rx from 'rxjs';

export const getInitialState = async (
  wallet: ShieldedWallet | UnshieldedWallet,
) => {
  if (wallet instanceof ShieldedWallet) {
    return Rx.firstValueFrom((wallet as ShieldedWallet).state);
  }
  return Rx.firstValueFrom((wallet as UnshieldedWallet).state);
};

export const getInitialShieldedState = async (
  logger: Logger,
  wallet: ShieldedWallet,
) => {
  logger.info('Getting initial state of wallet...');
  return Rx.firstValueFrom(wallet.state);
};

export const getInitialUnshieldedState = async (
  logger: Logger,
  wallet: UnshieldedWallet,
) => {
  logger.info('Getting initial state of wallet...');
  return Rx.firstValueFrom(wallet.state);
};

const isProgressStrictlyComplete = (progress: unknown): boolean => {
  if (!progress || typeof progress !== 'object') {
    return false;
  }
  const candidate = progress as { isStrictlyComplete?: unknown };
  if (typeof candidate.isStrictlyComplete !== 'function') {
    return false;
  }
  return (candidate.isStrictlyComplete as () => boolean)();
};

export const syncWallet = (
  logger: Logger,
  wallet: WalletFacade,
  throttleTime = 2_000,
  timeout = 90_000,
) => {
  logger.info('Syncing wallet...');

  return Rx.firstValueFrom(
    wallet.state().pipe(
      Rx.tap((state: FacadeState) => {
        const shieldedSynced = isProgressStrictlyComplete(
          state.shielded.state.progress,
        );
        const unshieldedSynced = isProgressStrictlyComplete(
          state.unshielded.progress,
        );
        const dustSynced = isProgressStrictlyComplete(
          state.dust.state.progress,
        );
        logger.debug(
          `Wallet synced state emission: { shielded=${shieldedSynced}, unshielded=${unshieldedSynced}, dust=${dustSynced} }`,
        );
      }),
      Rx.throttleTime(throttleTime),
      Rx.filter(
        (state: FacadeState) =>
          isProgressStrictlyComplete(state.shielded.state.progress) &&
          isProgressStrictlyComplete(state.dust.state.progress) &&
          isProgressStrictlyComplete(state.unshielded.progress),
      ),
      Rx.tap(() => logger.info('Sync complete')),
      Rx.tap((state: FacadeState) => {
        const shieldedBalances = state.shielded.balances || {};
        const unshieldedBalances = state.unshielded.balances || {};
        const dustBalances =
          state.dust.walletBalance(new Date(Date.now())) || 0n;

        logger.info(
          `Wallet balances after sync - Shielded: ${JSON.stringify(shieldedBalances)}, Unshielded: ${JSON.stringify(unshieldedBalances)}, Dust: ${dustBalances}`,
        );
      }),
      Rx.timeout({
        each: timeout,
        with: () =>
          Rx.throwError(
            () => new Error(`Wallet sync timeout after ${timeout}ms`),
          ),
      }),
    ),
  );
};

export const waitForUnshieldedFunds = async (
  logger: Logger,
  wallet: WalletFacade,
  env: EnvironmentConfiguration,
  tokenType: UnshieldedTokenType,
  fundFromFaucet = false,
): Promise<UnshieldedWalletState> => {
  const initialState = await getInitialUnshieldedState(
    logger,
    wallet.unshielded,
  );
  const unshieldedAddress = UnshieldedAddress.codec.encode(
    getNetworkId(),
    initialState.address,
  );
  logger.info(
    `Using unshielded address: ${unshieldedAddress.toString()} waiting for funds...`,
  );
  if (fundFromFaucet && env.faucet) {
    logger.info('Requesting tokens from faucet...');
    await new FaucetClient(env.faucet, logger).requestTokens(
      unshieldedAddress.toString(),
    );
  }
  const initialBalance = initialState.balances[tokenType.raw];
  if (initialBalance === undefined || initialBalance === 0n) {
    logger.info('Your wallet initial balance is: 0 (not yet initialized)');
    logger.info('Waiting to receive tokens...');
    const facadeState = await syncWallet(logger, wallet);
    return facadeState.unshielded;
  }
  return initialState;
};
