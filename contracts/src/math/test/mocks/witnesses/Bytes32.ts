import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Bytes32.mock/contract/index.js';
import { wit_unpackBytes } from '@src/math/witnesses/wit_unpackBytes.js';

export type Bytes32PrivateState = Record<string, never>;

export const Bytes32Witnesses = (): Witnesses<Bytes32PrivateState> => ({
  wit_unpackBytes(_context, bytes_0) {
    return [{}, wit_unpackBytes(bytes_0)];
  },
});
