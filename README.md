# Midnight DApps
A collection of starter-dapps on the Midnight Network

## Overview
This monorepo contains experimental sample projects built on top of the Midnight Network using Compact. It includes contracts, utilities, and application.

## Development Flow

### Prerequisites
- **Node.js**: Version 22.14.0 (see `.nvmrc` and `package.json` `engines`).
- **pnpm**: Version 10.4.1 (specified in `packageManager`).


Install Node.js 22.x using `nvm`:
```bash
nvm install 22.14.0
nvm use 22.14.0
```

### Setup
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd midnight-dapps
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```
   - This installs all workspace dependencies and runs the `prepare` script, which sets up Husky and builds `@midnight-dapps/compact`.

3. **Workspace Structure**:
   - `contracts/*`: Compact Smart contract projects (e.g., `@midnight-dapps/access-contract`).
   - `packages/*`: Utility packages (e.g., `@midnight-dapps/compact`).
   - `apps/*`: Frontend applications (e.g., `@midnight-dapps/lunarswap-ui`).

   See `pnpm-workspace.yaml` for the full list.

4. **Build Contracts Packages**:
   ```bash
   pnpm build:contracts
   ```
   - Runs `turbo run build`, which compiles `.compact` files (via `compact`) and builds all projects (e.g., TypeScript compilation, artifact copying).

### Tasks with Turbo
Turbo manages tasks across the monorepo, defined in `turbo.json`. Key tasks:

- **`compact`**:
  - Compiles `.compact` files using `compact-compile`.
  - Run: `pnpm compact`.

- **`build`**:
  - **`build:contracts`**
    - Builds contracts projects, including TypeScript compilation and artifact copying, after running `compact`.
    - Run: `pnpm build:contracts`.
    - Dependencies: Ensures `compact` tasks complete first.
  - **`build:apps`**
    - Builds apps projects.
    - Run: `pnpm build:apps`.
    
- **`test`**:
  - Runs tests with Vitest.
  - Run: `pnpm test`.

- **`types`**:
  - Checks TypeScript types without emitting files.
  - Run: `pnpm types`.

- **`fmt`**, **`lint`**, **`lint:fix`**:
  - Formats and lints code with Biome.
  - Run: `pnpm fmt`, `pnpm lint`, `pnpm lint:fix`.

### Commit Workflow
Commits are linted with `commitlint` and staged files are processed with `lint-staged` and Biome.

1. **Conventional Commits**:
   - Use the format: `<type>(<scope>): <description>` (e.g., `feat(ui): add button styles`).
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, etc.
   - See [Conventional Commits](https://www.conventionalcommits.org/).

2. **Pre-Commit Hook**:
   - Runs `turbo run precommit` via `.husky/pre-commit`.
   - For `@midnight-dapps/access-contract`:
     - `lint-staged`: Formats and lints staged files (see `.lintstagedrc.json`).
     - `pnpm run types`: Checks TypeScript types.

3. **Commit Message Hook**:
   - Runs `commitlint` via `.husky/commit-msg`.
   - Enforces conventional commits, ignoring Dependabot messages (see `commitlint.config.ts`).

#### Example Commit
```bash
git add .
git commit -m "chore: enhance dev flow"
```
Output:
```
husky - pre-commit hook
> turbo run precommit
• Running precommit in X packages
• @midnight-dapps/access-contract:precommit
Tasks:    1 successful, 1 total
Time:    500ms

husky - commit-msg hook
[chore/enhance-dev 123abcd] chore: enhance dev flow
```

#### Invalid Commit
```bash
git commit -m "invalid"
```
```
husky - commit-msg hook
⧺  invalid
⧺  Commit message does not follow Conventional Commits format.
```

