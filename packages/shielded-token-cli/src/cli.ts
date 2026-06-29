// SPDX-License-Identifier: MIT
// Shielded Token CLI main loop and handlers

import type { Interface } from "node:readline/promises";
import type { ShieldedCoinInfo } from "@openzeppelin/midnight-apps-contracts";
import type {
	ShieldedFungibleToken,
	ShieldedFungibleTokenProviders,
} from "@openzeppelin/midnight-apps-shielded-token-api";
import type { Logger } from "pino";
import { burnTokens } from "./api/burn.js";
import { deployContract, joinContract } from "./api/contract.js";
import { mintTokens } from "./api/mint.js";
import type { MidnightWalletProvider } from "./midnight-wallet-provider.js";
import { waitForShieldedToken } from "./wallet-utils.js";

const DEPLOY_OR_JOIN_QUESTION = `
You can do one of the following:
  1. Deploy a new Shielded Token contract
  2. Join an existing Shielded Token contract
  3. Exit
Which would you like to do? `;

const MAIN_LOOP_QUESTION = `
Shielded Token CLI - Main Menu

You can do one of the following:
1. Mint tokens
2. Burn tokens
3. Exit

Which would you like to do? `;

const CONTRACT_ADDRESS_QUESTION =
	"Enter the deployed Shielded Token contract address (hex): ";

const deployOrJoin = async (
	providers: ShieldedFungibleTokenProviders,
	zkConfigPath: string,
	rli: Interface,
	logger: Logger,
): Promise<ShieldedFungibleToken | null> => {
	while (true) {
		const choice = await rli.question(DEPLOY_OR_JOIN_QUESTION);
		switch (choice.trim()) {
			case "1": {
				const name = await rli.question("Enter token name: ");
				const symbol = await rli.question("Enter token symbol: ");
				return await deployContract(
					providers,
					zkConfigPath,
					name.trim(),
					symbol.trim(),
					logger,
				);
			}
			case "2": {
				const contractAddress = await rli.question(CONTRACT_ADDRESS_QUESTION);
				return await joinContract(
					providers,
					contractAddress.trim(),
					zkConfigPath,
					logger,
				);
			}
			case "3":
				logger.info("Exiting...");
				return null;
			default:
				logger.error(`Invalid choice: ${choice}`);
		}
	}
};

const handleMintTokens = async (
	token: ShieldedFungibleToken,
	walletProvider: MidnightWalletProvider | undefined,
	rli: Interface,
	logger: Logger,
): Promise<ShieldedCoinInfo | undefined> => {
	if (!walletProvider) {
		logger.error("Wallet not available for minting");
		return undefined;
	}

	const amountStr = await rli.question("Enter amount to mint: ");
	const amount = BigInt(amountStr.trim());
	if (amount <= 0n) {
		logger.error("Amount must be positive");
		return undefined;
	}

	try {
		const coinPublicKeyHex = walletProvider.getCoinPublicKey();
		return await mintTokens(token, coinPublicKeyHex, amount, logger);
	} catch (err) {
		logger.error(
			{ err, message: err instanceof Error ? err.message : String(err) },
			"Mint failed",
		);
		if (err instanceof Error && err.stack)
			logger.error({ stack: err.stack }, "Mint error stack");
		if (err instanceof Error && err.cause !== undefined)
			logger.error({ cause: err.cause }, "Mint error cause");
		throw err;
	}
};

/**
 * Burn part (or all) of the last coin minted in this session. The wallet must
 * have synced the coin before it can be spent, so we wait on the shielded
 * balance first. Returns the change coin (if any) so it can be burned again.
 */
const handleBurnTokens = async (
	token: ShieldedFungibleToken,
	coin: ShieldedCoinInfo | undefined,
	walletProvider: MidnightWalletProvider | undefined,
	rli: Interface,
	logger: Logger,
): Promise<ShieldedCoinInfo | undefined> => {
	if (!walletProvider) {
		logger.error("Wallet not available for burning");
		return coin;
	}
	if (!coin) {
		logger.error("No coin available to burn. Mint tokens first.");
		return coin;
	}

	const amountStr = await rli.question("Enter amount to burn: ");
	const amount = BigInt(amountStr.trim());
	if (amount <= 0n) {
		logger.error("Amount must be positive");
		return coin;
	}
	if (amount > coin.value) {
		logger.error(
			`Amount ${amount} exceeds available coin value ${coin.value}`,
		);
		return coin;
	}

	try {
		// The minted coin must be synced into the wallet before it is spendable.
		const colorHex = Buffer.from(coin.color).toString("hex");
		await waitForShieldedToken(
			logger,
			walletProvider.wallet,
			colorHex,
			coin.value,
		);

		const result = await burnTokens(token, coin, amount, logger);
		return result.change.is_some ? result.change.value : undefined;
	} catch (err) {
		logger.error(
			{ err, message: err instanceof Error ? err.message : String(err) },
			"Burn failed",
		);
		if (err instanceof Error && err.stack)
			logger.error({ stack: err.stack }, "Burn error stack");
		if (err instanceof Error && err.cause !== undefined)
			logger.error({ cause: err.cause }, "Burn error cause");
		throw err;
	}
};

export const mainLoop = async (
	providers: ShieldedFungibleTokenProviders,
	zkConfigPath: string,
	rli: Interface,
	logger: Logger,
	walletProvider?: MidnightWalletProvider,
): Promise<void> => {
	const token = await deployOrJoin(providers, zkConfigPath, rli, logger);
	if (token === null) {
		return;
	}
	// Tracks the most recently minted (or burn-change) coin available to burn.
	let burnableCoin: ShieldedCoinInfo | undefined;
	while (true) {
		const choice = await rli.question(MAIN_LOOP_QUESTION);
		switch (choice.trim()) {
			case "1": {
				const minted = await handleMintTokens(
					token,
					walletProvider,
					rli,
					logger,
				);
				if (minted) {
					burnableCoin = minted;
				}
				break;
			}
			case "2": {
				burnableCoin = await handleBurnTokens(
					token,
					burnableCoin,
					walletProvider,
					rli,
					logger,
				);
				break;
			}
			case "3":
				logger.info("Exiting...");
				return;
			default:
				logger.error(`Invalid choice: ${choice}`);
		}
	}
};
