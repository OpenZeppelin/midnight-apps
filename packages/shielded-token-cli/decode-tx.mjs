// Standalone decoder: deserialize a raw Midnight transaction (hex) with
// ledger-v8 and print the publicly-observable / indexer-visible content.
// Usage: node decode-tx.mjs <path-to-hexfile>   (default: /tmp/mint.hex)
import { readFileSync } from "node:fs";
import { Transaction } from "@midnight-ntwrk/ledger-v8";

const hexPath = process.argv[2] ?? "/tmp/mint.hex";
const hex = readFileSync(hexPath, "utf8").trim();
const bytes = Uint8Array.from(Buffer.from(hex, "hex"));

const hx = (v) => {
	try {
		if (v === null || v === undefined) return String(v);
		if (v instanceof Uint8Array) return Buffer.from(v).toString("hex");
		return String(v);
	} catch {
		return "<unprintable>";
	}
};
const mapToStr = (m) => {
	try {
		if (!m) return "{}";
		const entries = m instanceof Map ? Array.from(m.entries()) : Object.entries(m);
		return `{${entries.map(([k, v]) => `${hx(k)}: ${v}`).join(", ")}}`;
	} catch {
		return "<unprintable>";
	}
};
const arrToStr = (a) => {
	try {
		return `[${(a ?? []).map(hx).join(", ")}]`;
	} catch {
		return "<unprintable>";
	}
};
const safeJson = (o) => {
	try {
		return JSON.stringify(o, (_k, v) => (typeof v === "bigint" ? v.toString() : v));
	} catch {
		return String(o);
	}
};
const printTranscript = (label, t) => {
	if (!t) return;
	const e = t.effects ?? {};
	console.log(`    ${label}.gas : ${safeJson(t.gas)}`);
	console.log(`    ${label}.effects.shieldedMints           : ${mapToStr(e.shieldedMints)}`);
	console.log(`    ${label}.effects.unshieldedMints         : ${mapToStr(e.unshieldedMints)}`);
	console.log(`    ${label}.effects.claimedShieldedSpends   : ${arrToStr(e.claimedShieldedSpends)}`);
	console.log(`    ${label}.effects.claimedShieldedReceives : ${arrToStr(e.claimedShieldedReceives)}`);
	console.log(`    ${label}.effects.claimedNullifiers       : ${arrToStr(e.claimedNullifiers)}`);
	console.log(`    ${label}.effects.claimedContractCalls    : ${(e.claimedContractCalls ?? []).length}`);
	console.log(`    ${label}.program ops count               : ${(t.program ?? []).length}`);
};

// FinalizedTransaction = Transaction<SignatureEnabled, Proof, Binding>
const tx = Transaction.deserialize("signature", "proof", "binding", bytes);

console.log(`=== DECODED FROM RAW BYTES (${bytes.length} bytes) ===`);
console.log(`transactionHash : ${hx(tx.transactionHash())}`);
console.log(`identifiers     : ${tx.identifiers().map(hx).join(", ")}`);

const intents = tx.intents;
if (intents) {
	for (const [seg, intent] of intents) {
		const actions = intent.actions ?? [];
		console.log(`\n-- intent segment ${seg}: ${actions.length} action(s) --`);
		actions.forEach((a, i) => {
			const ep = a.entryPoint;
			if (ep !== undefined) {
				console.log(`  action[${i}] ContractCall`);
				console.log(`    address    : ${hx(a.address)}`);
				console.log(`    entryPoint : ${typeof ep === "string" ? ep : hx(ep)}`);
				try {
					console.log(`    communicationCommitment : ${hx(a.communicationCommitment)}`);
				} catch {}
				try {
					printTranscript("guaranteedTranscript", a.guaranteedTranscript);
				} catch {}
				try {
					printTranscript("fallibleTranscript", a.fallibleTranscript);
				} catch {}
			} else {
				console.log(`  action[${i}] ContractDeploy/Maintenance address=${hx(a.address)}`);
			}
		});
	}
}

const dumpOffer = (label, offer) => {
	if (!offer) return;
	const deltas = offer.deltas
		? Array.from(offer.deltas.entries()).map(([t, v]) => `${hx(t)}=${v}`)
		: [];
	console.log(
		`\n-- ${label} Zswap offer: inputs=${offer.inputs?.length ?? 0} outputs=${offer.outputs?.length ?? 0} transients=${offer.transients?.length ?? 0} --`,
	);
	console.log(`  deltas: ${deltas.join(", ")}`);
	offer.inputs?.forEach((inp, i) =>
		console.log(`  input[${i}]  nullifier=${hx(inp.nullifier)} contract=${hx(inp.contractAddress)}`),
	);
	offer.outputs?.forEach((out, i) =>
		console.log(`  output[${i}] commitment=${hx(out.commitment)} contract=${hx(out.contractAddress)}`),
	);
};
dumpOffer("guaranteed", tx.guaranteedOffer);
const fo = tx.fallibleOffer;
if (fo) for (const [seg, offer] of fo) dumpOffer(`fallible[seg=${seg}]`, offer);

console.log("\n=== LEDGER toString(compact) ===");
console.log(tx.toString(true));
