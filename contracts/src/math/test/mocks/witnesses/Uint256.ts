import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Uint256.mock/contract/index.js';
import { wit_uint64ToVector } from '@src/math/witnesses/wit_uint64ToVector.js';

export type Uint256PrivateState = Record<string, never>;

export const Uint256PrivateState = {
  generate: (): Uint256PrivateState => {
    return {};
  },
};

export const Uint256Witnesses = (): Witnesses<Uint256PrivateState> => ({
  wit_uint64ToVector(_context, value) {
    return [{}, wit_uint64ToVector(value)];
  },
});
