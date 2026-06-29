import {
	type CoinPublicKey,
	encodeCoinPublicKey,
} from "@midnight-ntwrk/ledger-v8";
import type { ShieldedCoinInfo } from "@openzeppelin/midnight-apps-contracts";
import type { ShieldedFungibleToken } from "@openzeppelin/midnight-apps-shielded-token-api";
import type { Logger } from "pino";

function buildRecipient(coinPublicKey: CoinPublicKey) {
	return {
		is_left: true,
		left: { bytes: encodeCoinPublicKey(coinPublicKey) },
		right: { bytes: new Uint8Array(32) },
	};
}

/**
 * Mint tokens to the wallet's shielded address (coin public key from seed).
 * Returns the minted coin description so the caller can later burn it.
 */
export const mintTokens = async (
	token: ShieldedFungibleToken,
	coinPublicKey: CoinPublicKey,
	amount: bigint,
	logger: Logger,
): Promise<ShieldedCoinInfo> => {
	logger.info("Minting tokens...");
	const txData = await token.mint(buildRecipient(coinPublicKey), amount);
	// `private.result` is the circuit's JS return value: the minted ShieldedCoinInfo
	// ({ nonce, color, value }). We keep only this non-sensitive descriptor.
	const coin = txData.private.result as ShieldedCoinInfo;
	logger.info(
		`Tokens minted successfully. Minted coin: color=${Buffer.from(coin.color).toString("hex")} value=${coin.value}`,
	);
	return coin;
};
