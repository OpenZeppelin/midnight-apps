import type { Witnesses } from '../../../../../artifacts/math/test/mocks/contracts/Bytes32.mock/contract/index.js';
import { wit_bytesToU256 } from '../../../witnesses/wit_bytesToU256.js';

/**
 * @description Represents the private state of the Bytes32 module.
 * @remarks No persistent state is needed as all circuits are pure.
 */
export type Bytes32PrivateState = Record<string, never>;

/**
 * @description Factory function creating witness implementations for Bytes32 module operations.
 */
export const Bytes32Witnesses = (): Witnesses<Bytes32PrivateState> => ({
  /**
   * @description Converts a 32-byte array to a U256 struct using little-endian byte ordering.
   * @param _context - The witness context (unused).
   * @param bytes - The 32-byte array to convert.
   * @returns A tuple of [privateState, U256].
   */
  wit_bytesToU256(_context, bytes) {
    return [{}, wit_bytesToU256(bytes)];
  },
});
