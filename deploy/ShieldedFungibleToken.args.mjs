// Constructor args for the `ShieldedFungibleToken` contract, for compact-deploy.
//
// Mirrors `ShieldedFungibleToken.deploy(providers, nonce, name, symbol, domain, ...)`
// in `packages/shielded-token-api` — the contract constructor is
// `(nonce_: Bytes<32>, name_: Opaque<"string">, symbol_: Opaque<"string">, domain_: Bytes<32>)`.
//
// nonce and domain are Bytes<32> (Uint8Array length 32); JSON can't represent
// them, so we use the module-export args path. The deployer calls `args()` (a
// zero-arg function) and uses the returned array — see the deployer's
// `loaders/args.ts`.
import { randomBytes } from "node:crypto";

export function args() {
	return [
		Uint8Array.from(randomBytes(32)), // nonce: Bytes<32>
		"Preprod Shielded Test 2", // name:   Opaque<"string">
		"PST2", // symbol: Opaque<"string">
		Uint8Array.from(randomBytes(32)), // domain: Bytes<32>
	];
}
