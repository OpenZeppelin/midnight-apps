import type { Witnesses } from '@src/artifacts/math/test/mocks/contracts/Uint64.mock/contract/index.js';
import { wit_divUint64 } from '@src/math/witnesses/wit_divUint64.js';
import { wit_sqrtUint64 } from '@src/math/witnesses/wit_sqrtUint64.js';
import { wit_uint64ToVector } from '@src/math/witnesses/wit_uint64ToVector.js';

export type Uint64PrivateState = Record<string, never>;

export const Uint64Witnesses = (): Witnesses<Uint64PrivateState> => ({
  wit_sqrtUint64(_context, radicand) {
    return [{}, wit_sqrtUint64(radicand)];
  },

  wit_divUint64(_context, dividend, divisor) {
    return [{}, wit_divUint64(dividend, divisor)];
  },

  wit_uint64ToVector(_context, value) {
    return [{}, wit_uint64ToVector(value)];
  },
});
