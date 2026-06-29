# Privacy experiment — does the `send` recipient ("parent") stay private?

**Date:** 2026-06-18 · **Network:** Midnight **preprod** · **Wallet:** `37b3b92a…d45b`
(coin public key; derived from the test recovery phrase)

## Question

`multisig/ForwarderPrivate._drain` keeps its destination ("parent") hidden behind a
commitment preimage. We took `ShieldedFungibleToken` and added a Forwarder-style
transfer circuit, but exposed the recipient directly as a **public circuit
argument** `parent: Either<ZswapCoinPublicKey, ContractAddress>`, then asked:

> When we run the `send` (transfer) tx, does the recipient ("parent") stay private
> on-chain — for a user, and for a contract?

## TL;DR answer

| The "parent" is a… | Stays private on-chain? | Why |
|---|---|---|
| **User** (`ZswapCoinPublicKey`, left arm) | **Yes — fully hidden** | the Zswap output is a plain shielded note; the recipient key never appears in the tx |
| **Contract** (`ContractAddress`, right arm) | **No — public in cleartext** | a contract-owned output must be routed to a named contract, so its address is in the output verbatim |

Two secondary findings:

- **The transfer amount is hidden** for `send` in *both* cases (the Zswap offer is
  balanced → `deltas = []`), unlike `mint`/`burn` which disclose the amount.
- **Sending to another user requires the sender to know that user's *encryption
  (viewing) key* off-chain.** The `Either<ZswapCoinPublicKey, ContractAddress>` (a
  32-byte coin key) is not by itself enough; the SDK needs a
  `coinPublicKey → encryptionPublicKey` mapping to build the ciphertext. This is an
  off-chain requirement on the sender, **not** an on-chain leak of the recipient.

So exposing the parent as a public `Either<…>` argument does **not** by itself leak a
**user** parent — the shielded-output commitment scheme still hides it, exactly as in
`ForwarderPrivate`. A **contract** parent is inherently public because the protocol
routes the coin to a known contract address.

---

## What was built

New circuit added to `contracts/src/openzeppelin/ShieldedERC20.compact` and wrapped in
`contracts/src/shielded-token/ShieldedFungibleToken.compact`:

```compact
export circuit send(
  to: Either<ZswapCoinPublicKey, ContractAddress>,
  coin: ShieldedCoinInfo,
  value: Uint<128>
): ShieldedSendResult {
  assert(coin.color == _color, "ShieldedToken: token not created from this contract");
  assert(coin.value >= value, "ShieldedToken: insufficient token amount to send");
  assert(!isKeyOrAddressZero(to), "ShieldedToken: invalid recipient");
  receiveShielded(disclose(coin));
  const sendRes = sendImmediateShielded(disclose(coin), disclose(to), disclose(value));
  if (sendRes.change.is_some) {
    const caller = left<ZswapCoinPublicKey, ContractAddress>(ownPublicKey());
    sendImmediateShielded(sendRes.change.value, caller, sendRes.change.value.value);
  }
  return sendRes;
}
```

It mirrors `_drain` (receive the coin, send `value` to the destination, return change
to the caller), but the destination is a public `Either` argument instead of a
commitment-verified secret.

Recompiled with the Compact 0.31.0 toolchain (8 circuits, incl. `send.prover` 19.5 MB)
and rebuilt `@openzeppelin/midnight-apps-shielded-token-api` to expose `send(...)`.

---

## Method (deploy → mint → transfer), with the wallet-cache reuse requirement

**Requirement met: the CLI reused the compact-deployer's already-synced wallet state**
— no fresh ~44-min preprod dust resync.

- `compact-deployer` persists the shielded + dust sub-wallets to
  `./.states/preprod-<seedHash>-{shielded,dust}.gz` after each sync.
- The CLI and the deployer derive the **same** sub-wallet seeds from the same recovery
  phrase (verified: both produce coin key `37b3b92a…`, and the cache filenames hash to
  `bdc5d7f16c6cc297` / `657c85bba60a1e34`).
- The CLI now restores those snapshots in `MidnightWalletProvider.build` (gated on
  `WALLET_STATES_DIR`), mirroring the deployer's `WalletHandler` exactly
  (`WalletFactory.restoreShieldedWallet` + `DustWallet(config).restore()`). New file:
  `packages/shielded-token-cli/src/wallet-restore.ts`.
- Observed in every run: `Wallet built from deployer cache: shielded=true dust=true
  (no fresh resync)`, then the tail-sync gate passes in **~15–30 s**.

| Phase | Tool | Result |
|---|---|---|
| **Deploy** | `compact-deployer` (preprod) | contract `5c06114f…dc3ebd`, txHash `5badb4af…`, block 1276567 |
| **Mint** | shielded-token CLI (`token.mint`) | 1000 minted to self, accepted |
| **Send → user** | shielded-token CLI (`token.send`) | **accepted on-chain**, txHash `96fc0b5c…1ef4b` |
| **Send → contract** | shielded-token CLI (`token.send`) | raw tx built + captured; node rejected at submit (`Custom error: 186`, contract did not co-receive) |

The send-to-contract was rejected only because the target (`Lunarswap`) has no circuit
that co-receives the coin in the same tx — irrelevant to the privacy question, since
the fully-formed tx (the exact bytes the node/indexer would see) was captured *before*
submission and decoded.

---

## Decoded raw-tx evidence

All three txs were captured as raw bytes and decoded with `ledger-v8`
(`privacy-experiment/out/*.hex`, `out/decoded/*.indexer-view.txt`).

### 1. Mint 1000 → self  (`entryPoint=mint`, accepted)

```
ContractCall address=5c06114f… entryPoint=mint
  effects.shieldedMints : { 7b1a74…aec205: 1000 }      ← AMOUNT 1000 PUBLIC
guaranteed offer: inputs=0 outputs=1
  deltas: 41b16c…f45e = -1000                          ← AMOUNT 1000 PUBLIC
  output[0] commitment=6f2d7d…e4db  contract=undefined ← owner HIDDEN (user coin)
```

### 2. Send 1000 → **USER** `19d316b8…e602`  (`entryPoint=send`, **accepted**, tx `96fc0b5c…`)

```
ContractCall address=5c06114f… entryPoint=send
guaranteed offer: inputs=1 outputs=1 transients=1
  deltas: (empty)                                      ← AMOUNT HIDDEN
  input[0]  nullifier=36ac58…9e45   contract=undefined
  output[0] commitment=ebaf7f…2a26  contract=undefined ← RECIPIENT HIDDEN (plain note)
ledger view: outputs: [ <shielded output Commitment(ebaf7f…)> ]   ← no address
recipient key 19d316b8… occurrences in entire tx: 0    ← recipient NEVER appears
```

### 3. Send 1000 → **CONTRACT** `4049e0df…`  (`entryPoint=send`, captured pre-submit)

```
ContractCall address=5c06114f… entryPoint=send
guaranteed offer: inputs=1 outputs=1 transients=1
  deltas: (empty)                                      ← AMOUNT HIDDEN
  output[0] commitment=20c4d3…a804  contract=4049e0df7ad3446fdd6f34e60e3ffbe900b90d7e04143dac29f8901d67472358
ledger view: outputs: [ <shielded output Commitment(20c4d3…) for: ContractAddress(4049e0df…)> ]
                                                       ← RECIPIENT CONTRACT IN CLEARTEXT
```

### Side-by-side

| Public field | mint→self | send→user | send→contract |
|---|---|---|---|
| contract-call `entryPoint` | `mint` | `send` | `send` |
| transfer **amount** | **visible** (`shieldedMints`/delta) | **hidden** (`deltas=[]`) | **hidden** (`deltas=[]`) |
| output `commitment` | yes (hides contents) | yes | yes |
| output **recipient** | hidden | **hidden** (`contract=undefined`) | **CLEARTEXT** `ContractAddress(4049e0df…)` |

---

## Interpretation

- A circuit argument flowing into `sendImmediateShielded` is **not** automatically
  public. What ends up on-chain is whatever the Zswap output encodes. For a
  **user** recipient that output is a commitment (Pedersen-hiding) plus a ciphertext
  the recipient trial-decrypts — the key is never revealed. So a **user parent stays
  private even though it is a public circuit argument**.
- A **contract** recipient cannot be hidden: the ledger must route the coin to a
  specific contract, so the output carries `ContractAddress(...)` verbatim. The
  **contract parent is always public**.
- This matches `ForwarderPrivate`'s privacy model: the parent (a user key) is hidden
  by the shielded note, not by the commitment. The Forwarder's commitment is for
  **authorization** (proving knowledge of the parent + opSecret), not for hiding the
  destination of the shielded send.
- The amount, by contrast, is hidden for a *transfer* (balanced in/out → `deltas=[]`)
  but disclosed for `mint`/`burn` (net supply change shows up in `deltas`/effects).

## Practical caveat surfaced

To transfer to another **user** you must supply that user's **encryption public key**
(`additionalCoinEncPublicKeyMappings`). Without it the SDK fails at balancing
("Unable to resolve encryption public key for recipient …"). This is a sender-side
data requirement, not an on-chain disclosure — the recipient still appears nowhere in
the published tx.

---

## Follow-up: a VALID send to a contract (accepted on-chain)

The first `send → contract` attempt was **rejected by the node** (`Custom error: 186`)
and never landed — its output was owned by `ContractAddress(4049e0df…)` but **nothing
claimed it** (`claimedShieldedReceives` only covered the calling token contract). On
Midnight a shielded coin sent to a contract is invalid unless **that contract receives
(claims) it in the same transaction**. Lunarswap has no circuit that receives an
arbitrary token, so it can never accept the coin.

The valid pattern: the recipient contract claims the coin. We added a `deposit(coin)`
circuit (`receiveShielded`), redeployed, minted a coin, and deposited it into the
contract. Decoded tx confirms the claim is present:

```
ContractCall address=bad9b594… entryPoint=deposit
  effects.claimedShieldedReceives : [ 8a466cf7… ]      ← contract CLAIMS the coin
guaranteed offer: inputs=1 outputs=1 deltas=[]          ← amount hidden
  output[0] commitment=8a466cf7…  for: ContractAddress(bad9b594…)  ← owned + CLAIMED → valid
```

**Accepted on-chain** (verified the explorer page resolves: "Success", entry point
`deposit`):

- Contract (with `deposit`): `bad9b594e20a03d8e0aedabb157c3ec369fe35c17c0193ea2e7c19fb109d5107`
- Deposit txHash: `22a46febe3a33564c210c669680e8fc67d35af621155d5596ea38602f156a4b0` (block 1,277,176)
- **Explorer:** https://preprod.midnightexplorer.com/transactions/0x22a46febe3a33564c210c669680e8fc67d35af621155d5596ea38602f156a4b0

Privacy note: a contract that receives a coin is the **call target**, which is always
public — so this path, too, reveals the recipient contract (here in
`claimedShieldedReceives` + the output's `ContractAddress`). The earlier conclusion
holds: a contract "parent" is never private; a user parent is.

### `send(to: ContractAddress)` that the node ACCEPTS (self-contract)

Using the `send` circuit itself with a `to:` of type `ContractAddress` **does** land
on-chain — but only when `to` is the **executing contract's own address**. The decode
shows why: the output owned by the contract appears in **`claimedShieldedReceives`**
(a contract sending to itself receives its own output), so it is claimed and valid:

```
ContractCall address=bad9b594… entryPoint=send
  effects.claimedShieldedReceives : [ 5560be2f… (input transient), b1040fbe… (the output) ]
  output[0] commitment=b1040fbe…  for: ContractAddress(bad9b594…)   ← owned + claimed → valid
  deltas=[]                                                          ← amount hidden
```

- send-circuit txHash: `fbc297aaf2db2aaa1c997dce8f8f58e6bfd12cf29fb4857861db140158c35eb0` (block 1,277,336, Success)
- **Explorer:** https://preprod.midnightexplorer.com/transactions/0xfbc297aaf2db2aaa1c997dce8f8f58e6bfd12cf29fb4857861db140158c35eb0

`send(to: <a different/arbitrary contract>)` (e.g. Lunarswap) is still **rejected**
(`Custom error: 186`) because that contract never claims the output. So a single
`send` call can only deliver a claimed coin to the contract that runs it. Either way,
the recipient contract address is public on-chain.

## Artifacts & reproduction

- **Contract source:** `contracts/src/openzeppelin/ShieldedERC20.compact` (`send`),
  `contracts/src/shielded-token/ShieldedFungibleToken.compact` (wrapper).
- **Wallet-cache reuse:** `packages/shielded-token-cli/src/wallet-restore.ts`,
  wired in `src/midnight-wallet-provider.ts` (`WALLET_STATES_DIR`).
- **API `send`:** `packages/shielded-token-api/src/ShieldedFungibleToken.ts`
  (+ optional `additionalCoinEncPublicKeyMappings` for user sends).
- **Drivers:** `privacy-experiment/run-deploy.sh`,
  `packages/shielded-token-cli/src/scripts/run-privacy-experiment.ts`,
  `…/run-user-send.ts`, with launchers `privacy-experiment/run-{experiment,user-send}.sh`.
- **Live logs:** `privacy-experiment/logs/_latest-{deploy,experiment,user-send}.log`
  (pretty) + `*.ndjson` (machine-readable).
- **Raw + decoded txs:** `privacy-experiment/out/*.hex`,
  `out/decoded/*.indexer-view.txt`, `out/*.decode.txt`, `out/summary.json`.
- **Re-decode any tx:** `node packages/shielded-token-cli/decode-tx.mjs <file.hex>`.

### Key identifiers

| Item | Value |
|---|---|
| Token contract (with `send`) | `5c06114f3dda0c9ab2798c19e0514b0392ca72904acedbed5da2266974dc3ebd` |
| Token color | `41b16c00dcc9421254c0d59647b2d181359ffbae9cb809ff193216f63e82f45e` |
| send→user txHash (accepted) | `96fc0b5c85b28a24849062954338cc86a0da99957ddbc40f6043bc36d7a1ef4b` |
| send→user recipient (user key) | `19d316b8bc931a9fb308370cc43c6bf7fed9e484a5a7e961ec4b68fd9524e602` |
| send→contract txHash (built, rejected at submit) | `57203fe00d141325409b825cf21fe78a990abddaaeb72b5fe89064097ae5e47e` |
| send→contract recipient (Lunarswap) | `4049e0df7ad3446fdd6f34e60e3ffbe900b90d7e04143dac29f8901d67472358` |
