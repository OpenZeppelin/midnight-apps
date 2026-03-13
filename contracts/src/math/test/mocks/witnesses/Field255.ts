import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Field255.mock/contract/index.js';
import { wit_unpackBytes } from '@src/math/witnesses/wit_unpackBytes.js';

export type Field255PrivateState = Record<string, never>;

export const Field255PrivateState = {
  generate: (): Field255PrivateState => {
    return {};
  },
};

export const Field255Witnesses = (): Witnesses<Field255PrivateState> => ({
  wit_unpackBytes(_context, bytes_0) {
    return [{}, wit_unpackBytes(bytes_0)];
  },
});
