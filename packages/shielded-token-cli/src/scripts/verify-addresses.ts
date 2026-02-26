/**
 * Wallet Address Verification Script
 *
 * Verifies that the recovery phrase produces the expected wallet addresses.
 *
 * Environment variables:
 *   TEST_RECOVERY_PHRASE - 24-word BIP39 recovery phrase
 *   TEST_SHIELDED_ADDRESS - Expected shielded address (Bech32m format)
 *   TEST_UNSHIELDED_ADDRESS - Expected unshielded address (Bech32m format)
 *   TEST_DUST_ADDRESS - Expected dust address (Bech32m format)
 *   TEST_NETWORK_ID - Optional; network for decoding addresses (default: 'preview')
 *
 * Usage:
 *   source .env && npx tsx src/scripts/verify-addresses.ts
 *   Or import and call verifyAddresses(networkId) from the CLI.
 */

import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ZswapSecretKeys, DustSecretKey } from '@midnight-ntwrk/ledger-v7';
import {
  MidnightBech32m,
  ShieldedAddress,
  DustAddress,
} from '@midnight-ntwrk/wallet-sdk-address-format';
import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';
import assert from 'assert';

const networkId = (): string =>
  process.env.TEST_NETWORK_ID ?? 'preprod';

/**
 * Verifies that TEST_RECOVERY_PHRASE produces the addresses in
 * TEST_SHIELDED_ADDRESS and TEST_DUST_ADDRESS. Uses TEST_NETWORK_ID or the
 * passed networkId for decoding (e.g. 'preprod', 'preview').
 */
export function verifyAddresses(overrideNetworkId?: string): void {
  const recoveryPhrase = process.env.TEST_RECOVERY_PHRASE;
  const expectedShielded = process.env.TEST_SHIELDED_ADDRESS;
  const expectedDust = process.env.TEST_DUST_ADDRESS;
  const net = overrideNetworkId ?? networkId();

  assert(recoveryPhrase, 'TEST_RECOVERY_PHRASE environment variable is required');
  assert(expectedShielded, 'TEST_SHIELDED_ADDRESS environment variable is required');
  assert(expectedDust, 'TEST_DUST_ADDRESS environment variable is required');
  assert(
    bip39.validateMnemonic(recoveryPhrase, english),
    'Invalid recovery phrase',
  );

  // Use full BIP39 seed (no 32-byte truncation workaround; wallet/Lace bug is fixed)
  const seed = bip39.mnemonicToSeedSync(recoveryPhrase, '');

  const hdWalletResult = HDWallet.fromSeed(seed);
  assert(hdWalletResult.type === 'seedOk', 'Failed to create HD wallet');
  const hdWallet = hdWalletResult.hdWallet;

  const shieldedKeyResult = hdWallet
    .selectAccount(0)
    .selectRole(Roles.Zswap)
    .deriveKeyAt(0);
  assert(shieldedKeyResult.type === 'keyDerived', 'Failed to derive shielded key');

  const dustKeyResult = hdWallet
    .selectAccount(0)
    .selectRole(Roles.Dust)
    .deriveKeyAt(0);
  assert(dustKeyResult.type === 'keyDerived', 'Failed to derive dust key');

  const zswapKeys = ZswapSecretKeys.fromSeed(shieldedKeyResult.key);
  const dustSecretKey = DustSecretKey.fromSeed(dustKeyResult.key);

  const generatedCoinPubKey = String(zswapKeys.coinPublicKey);
  const generatedEncPubKey = String(zswapKeys.encryptionPublicKey);
  const generatedDustPubKey = dustSecretKey.publicKey;

  const shieldedBech32 = MidnightBech32m.parse(expectedShielded);
  const shieldedAddr = shieldedBech32.decode(ShieldedAddress, net);
  const expectedCoinPubKey = shieldedAddr.coinPublicKeyString();
  const expectedEncPubKey = shieldedAddr.encryptionPublicKeyString();

  const dustBech32 = MidnightBech32m.parse(expectedDust);
  const dustAddr = dustBech32.decode(DustAddress, net);
  const expectedDustPubKey = dustAddr.data;

  assert.strictEqual(
    generatedCoinPubKey,
    expectedCoinPubKey,
    'Coin public key mismatch',
  );
  assert.strictEqual(
    generatedEncPubKey,
    expectedEncPubKey,
    'Encryption public key mismatch',
  );
  assert.strictEqual(
    generatedDustPubKey,
    expectedDustPubKey,
    'Dust public key mismatch',
  );
}

if (process.argv[1]?.includes('verify-addresses')) {
  verifyAddresses();
  console.log('✓ All assertions passed');
}
