import type {
	ShieldedCoinInfo,
	ShieldedSendResult,
} from "@openzeppelin/midnight-apps-contracts";
import type { ShieldedFungibleToken } from "@openzeppelin/midnight-apps-shielded-token-api";
import type { Logger } from "pino";

/**
 * Burn `amount` of an owned `coin` by sending it to the shielded burn address.
 * The wallet must already hold `coin` (synced from a prior mint) so it can be
 * spent. Returns the ShieldedSendResult, whose `change` (if any) is a fresh
 * coin returned to the caller and can be burned again.
 */
export const burnTokens = async (
	token: ShieldedFungibleToken,
	coin: ShieldedCoinInfo,
	amount: bigint,
	logger: Logger,
): Promise<ShieldedSendResult> => {
	logger.info(
		`Burning ${amount} of coin color=${Buffer.from(coin.color).toString("hex")} value=${coin.value}...`,
	);
	const txData = await token.burn(coin, amount);
	const result = txData.private.result as ShieldedSendResult;
	const change = result.change.is_some ? result.change.value.value : 0n;
	logger.info(
		`Tokens burned successfully. sent=${result.sent.value} change=${change}`,
	);
	return result;
};
