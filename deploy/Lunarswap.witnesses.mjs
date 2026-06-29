// Witness shim for compact-deploy.
//
// The canonical witnesses live in `contracts/src/lunarswap/witnesses/Lunarswap.ts`
// but its imports use the `@src/...` path alias that midnight-apps resolves
// via a custom ESM loader (`packages/lunarswap-cli/src/path-resolver-loader.mjs`).
// compact-deploy doesn't run with that loader, so we re-wire the imports here
// using explicit relative paths into `contracts/dist/`.
//
// The deployer's witness loader calls `witnesses()` (a zero-arg function) and
// uses the returned object, mirroring `LunarswapWitnessesImp` upstream.
import { wit_bytes32ToU256 } from '../contracts/dist/math/witnesses/wit_bytes32ToU256.js';
import { wit_divU128 } from '../contracts/dist/math/witnesses/wit_divU128.js';
import { wit_divUint128 } from '../contracts/dist/math/witnesses/wit_divUint128.js';
import { wit_sqrtU128 } from '../contracts/dist/math/witnesses/wit_sqrtU128.js';
import { wit_uint64ToVector } from '../contracts/dist/math/witnesses/wit_uint64ToVector.js';

export function witnesses() {
  return {
    wit_sqrtU128: (_ctx, r) => [{}, wit_sqrtU128(r)],
    wit_divU128: (_ctx, a, b) => [{}, wit_divU128(a, b)],
    wit_divUint128: (_ctx, a, b) => [{}, wit_divUint128(a, b)],
    wit_bytes32ToU256: (_ctx, bytes) => [{}, wit_bytes32ToU256(bytes)],
    wit_uint64ToVector: (_ctx, value) => [{}, wit_uint64ToVector(value)],
  };
}
