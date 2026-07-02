import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Uint256.mock/contract/index.js';
import { wit_uint64ToUnpackedBytes } from '@src/math/witnesses/wit_uint64ToUnpackedBytes.js';

export type Uint256PrivateState = Record<string, never>;

export const Uint256PrivateState = {
  generate: (): Uint256PrivateState => {
    return {};
  },
};

export const Uint256Witnesses = (): Witnesses<Uint256PrivateState> => ({
  wit_uint64ToUnpackedBytes(_context, value) {
    return [{}, wit_uint64ToUnpackedBytes(value)];
  },
});
