import { type CoinPublicKey, encodeCoinPublicKey } from '@midnight-ntwrk/ledger-v7';
import type { ShieldedFungibleToken } from '@openzeppelin/midnight-apps-shielded-token-api';
import type { Logger } from 'pino';

function buildRecipient(coinPublicKey: CoinPublicKey) {
  return {
    is_left: true,
    left: { bytes: encodeCoinPublicKey(coinPublicKey) },
    right: { bytes: new Uint8Array(32) },
  };
}

/** Mint tokens to the wallet's shielded address (coin public key from seed). */
export const mintTokens = async (
  token: ShieldedFungibleToken,
  coinPublicKey: CoinPublicKey,
  amount: bigint,
  logger: Logger,
): Promise<void> => {
  logger.info('Minting tokens...');
  await token.mint(buildRecipient(coinPublicKey), amount);
  logger.info('Tokens minted successfully');
};
