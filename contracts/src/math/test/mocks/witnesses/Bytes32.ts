import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Bytes32.mock/contract/index.js';
import { wit_bytes32ToU256 } from '@src/math/witnesses/wit_bytes32ToU256.js';
import { wit_bytes32ToVector } from '@src/math/witnesses/wit_bytes32ToVector.js';
import { wit_uint64ToVector } from '@src/math/witnesses/wit_uint64ToVector.js';

export type Bytes32PrivateState = Record<string, never>;

export const Bytes32Witnesses = (): Witnesses<Bytes32PrivateState> => ({
  wit_bytes32ToU256(_context, bytes) {
    return [{}, wit_bytes32ToU256(bytes)];
  },

  wit_bytes32ToVector(_context, bytes) {
    return [{}, wit_bytes32ToVector(bytes)];
  },

  wit_uint64ToVector(_context, value) {
    return [{}, wit_uint64ToVector(value)];
  },
});
