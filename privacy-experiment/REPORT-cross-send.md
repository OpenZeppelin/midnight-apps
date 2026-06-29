# Cross-token experiment — send token B into contract A (and A into B), using ONLY `send()`

**Date:** 2026-06-18 · **Network:** preprod · **Wallet:** `37b3b92a…d45b`

## Goal

Two token contracts, **A** and **B**. Using **only the `send` circuit** (with the
same-color `assert` removed), have the user move **token B's coin into contract A**
and **token A's coin into contract B** — two contracts, two `send` calls — and land
both on-chain.

## How a `send` to a contract is made valid

A shielded coin sent to a contract is rejected unless **that contract claims the
output in the same tx**. The only contract executing in a single `send` call is the
token contract itself, so each `send` targets **its own address**:

- `A.send(to = A, coinB, value)` → A receives its own send output (claimed) → valid.
- Because `send` no longer checks color, A's `send` can carry **token B's** coin.

So `to` is always the contract whose circuit runs; the *coin* is the foreign token.

## Result — both ACCEPTED on preprod (links verified)

| Token | Contract address |
|---|---|
| **A** (XTA) | `8cad28d931ebaf50c735394ff4d1604b1472cf741febc09e58d3106c847c190d` |
| **B** (XTB) | `8ddc869eef82e7215722472e3494705030339df5cff1b875d3ec0bf74c086509` |

| Step | Circuit | txHash | Explorer |
|---|---|---|---|
| **token B → contract A** | `send` (on A, to=A) | `7c9f278f…edcc82b3` | https://preprod.midnightexplorer.com/transactions/0x7c9f278fc0ab6ba47c1c28d12aaa1d6a42e95a57d6f05bab23486424edcc82b3 |
| **token A → contract B** | `send` (on B, to=B) | `e6fdf2fb…87ecac5e` | https://preprod.midnightexplorer.com/transactions/0xe6fdf2fb76dbb2c0276f3a3c9b82823aa2026a5735beb54d1a5bc8f087ecac5e |

Both fetched from the explorer and confirmed **Success** (blocks 1,277,510 and
1,277,518; Contract Actions entry point `send`).

Setup txs (also on preprod):

| Step | txHash |
|---|---|
| deploy A | `1f7232e349d9ceedbf63ed1697a0eb9980e1f70a4348ec791a84b2e3d7f8099c` |
| deploy B | `000b49147843cf5bc9cd75a9d372dab0651ee71270a4d7e30a81b26a8cc5d223` |
| mint A (1000 → self) | `30f07d9ed8dfc48569dd7390fed8d44d68ab762ec4e60add5a16436c8172389a` |
| mint B (1000 → self) | `8061438d5d4af397ba3be93b5a49f65beb3091c313e6953d7d3816eec232eb0c` |

Token colors: A = `4b6ca442…31e4ba02`, B = `73b5ed57…24ecb1e0`.

## Takeaways

- A coin **can** be sent to a contract with `send` — but only when `to` is the
  contract that runs the call (it claims its own output). Sending to a *third,
  uninvolved* contract is still rejected (it never claims the coin).
- Removing the color `assert` is what lets contract A hold **token B**'s coin: the
  `send` circuit no longer requires the coin to be its own token.
- The amount stays hidden in both sends (balanced Zswap offer, `deltas=[]`); the
  recipient **contract** address is public (it's the call target + the output owner).

## Counter-test — `send` to a DIFFERENT contract (B ≠ the caller) → REJECTED

Ran `A.send(to = contract B, coinA)` where B (`8ddc869e…`) is **not** the contract
running the call. The node **rejected** it: `1010: Invalid Transaction: Custom error: 186`.
It never landed, so there is **no explorer link**.

Decode of the (locally built, rejected) tx shows precisely why:

```
ContractCall address=8cad28d9… (contract A)  entryPoint=send
  claimedShieldedReceives : [ a05cb1fa… ]   ← A claims only its own input transient
  output[0] commitment=97159c0d…  for: ContractAddress(8ddc869e…)  ← owned by B
                                            but 8ddc869e is NOT in claimedShieldedReceives
```

The output is owned by B, but only A (the caller) is present to claim, and A claims
only its own input. B's output is **unclaimed** → invalid. (Local-only txHash
`0073d624a89a95bb9927e3d2f34d6520184f50ade933ec9d09576cbdd2026361`; not on-chain.)

This is the definitive confirmation: **a coin cannot be `send`-delivered to a
contract that does not participate in the same transaction.** The accepted cases
only worked because `to` was the **executing** contract (it claims its own output).
Artifacts: `out/D-send-A-to-B-REJECTED.hex`, `out/decoded/D-send-A-to-B-REJECTED.indexer-view.txt`.

## Artifacts

- Contract: `contracts/src/openzeppelin/ShieldedERC20.compact` (`send`, no color
  assert), `contracts/src/shielded-token/ShieldedFungibleToken.compact`.
- Driver: `packages/shielded-token-cli/src/scripts/run-cross-send.ts`,
  launcher `privacy-experiment/run-cross-send.sh`.
- Summary + raw tx bytes: `privacy-experiment/out/cross-send.summary.json`,
  `privacy-experiment/out/{deploy-A,deploy-B,mint-A,mint-B,send-B-into-A,send-A-into-B}.hex`.
- Live log: `privacy-experiment/logs/_latest-cross-send.log`.
- Wallet reused the compact-deployer cache (`WALLET_STATES_DIR` → no resync).
