import type { Witnesses } from '../../../../../artifacts/math/test/mocks/contracts/Field255.mock/contract/index.js';
import { wit_bytes32ToU256 } from '../../../witnesses/wit_bytes32ToU256.js';

/**
 * @description Represents the private state of the Field255 module.
 * @remarks No persistent state is needed beyond what's computed on-demand, so this is minimal.
 */
export type Field255PrivateState = Record<string, never>;

/**
 * @description Utility object for managing the private state of the Field255 module.
 */
export const Field255PrivateState = {
  /**
   * @description Generates a new private state.
   * @returns A fresh Field255PrivateState instance (empty for now).
   */
  generate: (): Field255PrivateState => {
    return {};
  },
};

/**
 * @description Factory function creating witness implementations for Field255 module operations.
 * @returns An object implementing the Witnesses interface for Field255PrivateState.
 */
export const Field255Witnesses = (): Witnesses<Field255PrivateState> => ({
  /**
   * @description Converts a 32-byte array to a U256 struct using little-endian byte ordering.
   * Required by Bytes32 module (used by Field255 for toU256 operations).
   * @param _context - The witness context (unused).
   * @param bytes - The 32-byte array to convert.
   * @returns A tuple of [privateState, U256].
   */
  wit_bytes32ToU256(_context, bytes) {
    return [{}, wit_bytes32ToU256(bytes)];
  },
});
