# LunarSwap UI

React/Vite frontend for the LunarSwap dApp on the Midnight network.

---

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/) 10+
- Contracts compiled — run `pnpm build` in `contracts/` first so that `contracts/dist/artifacts/` exists
- [Midnight Lace wallet](https://docs.midnight.network/develop/tutorial/using/chrome-ext) browser extension (dev mode only)

---

## Dev mode

Starts the Vite dev server with HMR at `http://localhost:5173`.

```bash
# From the repo root
pnpm --filter @openzeppelin/midnight-apps-lunarswap-ui run dev

# Or from this directory
pnpm dev
```

`dev` copies ZK artifacts from `contracts/dist/artifacts/` into `public/`, then launches Vite. Runtime config is read from `public/config.json`.

### Runtime config (`public/config.json`)

Edit this file to switch networks or contract addresses without rebuilding:

| Field | Description |
|---|---|
| `DEFAULT_NETWORK` | Active network (`preprod` \| `preview`) |
| `LOGGING_LEVEL` | Pino log level (`silent`, `debug`, `info`, …) |
| `NETWORKS.<net>.LUNARSWAP_ADDRESS` | Deployed contract address |
| `NETWORKS.<net>.PROOF_SERVER_URL` | Proof server endpoint |

---

## Build mode

Produces a static bundle in `dist/` targeting `preprod`.

```bash
# From the repo root
pnpm --filter @openzeppelin/midnight-apps-lunarswap-ui run build

# Or from this directory
pnpm build
```

`build` runs `tsc`, then `vite build --mode preprod`, then copies ZK artifacts from `contracts/dist/artifacts/` into `dist/`.

### Previewing the build

```bash
pnpm serve   # vite preview on port 8080 (requires a prior build)
pnpm start   # build + serve in one step
```

---

## Linting & formatting

```bash
pnpm lint        # biome lint
pnpm lint:fix    # biome check --write (lint + format)
pnpm fmt         # biome format --write
pnpm types       # tsc --noEmit (type-check only)
```