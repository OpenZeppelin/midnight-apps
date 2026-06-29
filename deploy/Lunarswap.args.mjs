// Constructor args for LunarswapFactory's `Lunarswap` contract bundle.
//
// Mirrors `Lunarswap.deploy(...)` in `packages/lunarswap-api/dist/Lunarswap.js`:
//   args: [LP_TOKEN_NAME, LP_TOKEN_SYMBOL, lpTokenNonce, LP_TOKEN_DECIMALS]
//
// The nonce is a Bytes<32> (Uint8Array of length 32). JSON can't represent
// it natively, so we use the module-export args path instead of a JSON file.
//
// The deployer calls `args()` (a zero-arg function) and uses the returned
// array — see `packages/deployer/src/loaders/args.ts`.
export function args() {
  return [
    'Test Lunar',                       // LP_TOKEN_NAME
    'TLUNAR',                           // LP_TOKEN_SYMBOL
    new Uint8Array(32).fill(0x44),      // lpTokenNonce — matches the lunarswap-cli default
    6n,                                 // LP_TOKEN_DECIMALS
  ];
}
