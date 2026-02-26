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
 *
 * Usage:
 *   source .env && npx tsx scripts/verify-addresses.ts
 */

import { HDWallet, Roles } from '@midnight-ntwrk/wallet-sdk-hd';
import { ZswapSecretKeys, DustSecretKey } from '@midnight-ntwrk/ledger-v7';
import { MidnightBech32m, ShieldedAddress, DustAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import * as bip39 from '@scure/bip39';
import { wordlist as english } from '@scure/bip39/wordlists/english';
import assert from 'assert';

const recoveryPhrase = process.env.TEST_RECOVERY_PHRASE;
const expectedShielded = process.env.TEST_SHIELDED_ADDRESS;
const expectedDust = process.env.TEST_DUST_ADDRESS;

assert(recoveryPhrase, 'TEST_RECOVERY_PHRASE environment variable is required');
assert(expectedShielded, 'TEST_SHIELDED_ADDRESS environment variable is required');
assert(expectedDust, 'TEST_DUST_ADDRESS environment variable is required');
assert(bip39.validateMnemonic(recoveryPhrase, english), 'Invalid recovery phrase');

// Use full BIP39 seed (no 32-byte truncation; wallet/Lace bug is fixed)
const seed = bip39.mnemonicToSeedSync(recoveryPhrase, '');

const hdWalletResult = HDWallet.fromSeed(seed);
assert(hdWalletResult.type === 'seedOk', 'Failed to create HD wallet');

const hdWallet = hdWalletResult.hdWallet;

// Derive shielded key
const shieldedKeyResult = hdWallet.selectAccount(0).selectRole(Roles.Zswap).deriveKeyAt(0);
assert(shieldedKeyResult.type === 'keyDerived', 'Failed to derive shielded key');

// Derive dust key
const dustKeyResult = hdWallet.selectAccount(0).selectRole(Roles.Dust).deriveKeyAt(0);
assert(dustKeyResult.type === 'keyDerived', 'Failed to derive dust key');

// Generate keys
const zswapKeys = ZswapSecretKeys.fromSeed(shieldedKeyResult.key);
const dustSecretKey = DustSecretKey.fromSeed(dustKeyResult.key);

const generatedCoinPubKey = String(zswapKeys.coinPublicKey);
const generatedEncPubKey = String(zswapKeys.encryptionPublicKey);
const generatedDustPubKey = dustSecretKey.publicKey;

// Decode expected shielded address
const shieldedBech32 = MidnightBech32m.parse(expectedShielded);
const shieldedAddr = shieldedBech32.decode(ShieldedAddress, 'preview');
const expectedCoinPubKey = shieldedAddr.coinPublicKeyString();
const expectedEncPubKey = shieldedAddr.encryptionPublicKeyString();

// Decode expected dust address
const dustBech32 = MidnightBech32m.parse(expectedDust);
const dustAddr = dustBech32.decode(DustAddress, 'preview');
const expectedDustPubKey = dustAddr.data;

// Assertions
assert.strictEqual(generatedCoinPubKey, expectedCoinPubKey, 'Coin public key mismatch');
assert.strictEqual(generatedEncPubKey, expectedEncPubKey, 'Encryption public key mismatch');
assert.strictEqual(generatedDustPubKey, expectedDustPubKey, 'Dust public key mismatch');

console.log('✓ All assertions passed');