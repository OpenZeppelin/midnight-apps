import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Field255.mock/contract/index.js';
import { wit_bytes32ToU256 } from '@src/math/witnesses/wit_bytes32ToU256.js';
import { wit_uint64ToVector } from '@src/math/witnesses/wit_uint64ToVector.js';

export type Field255PrivateState = Record<string, never>;

export const Field255PrivateState = {
  generate: (): Field255PrivateState => {
    return {};
  },
};

export const Field255Witnesses = (): Witnesses<Field255PrivateState> => ({
  wit_bytes32ToU256(_context, bytes) {
    return [{}, wit_bytes32ToU256(bytes)];
  },

  wit_uint64ToVector(_context, value) {
    return [{}, wit_uint64ToVector(value)];
  },
});
