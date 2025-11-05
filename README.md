# Midnight DApps

[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat)](https://opensource.org/licenses/MIT)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/OpenZeppelin/midnight-apps/badge)](https://api.securityscorecards.dev/projects/github.com/OpenZeppelin/midnight-apps)

A collection of starter-dapps on the Midnight Network

## Overview
This monorepo contains experimental sample projects built on top of the Midnight Network using Compact. It includes contracts, utilities, and application.

## Development Flow

### Prerequisites
- **Node.js**: Version 22.14.0 (see `.nvmrc` and `package.json` `engines`).
- **pnpm**: Version 10.4.1 (specified in `packageManager`).
- **Compact Developer Tools**: Required to compile `.compact` smart contracts.

Install Node.js 22.x using `nvm`:
```bash
nvm install 22.14.0
nvm use 22.14.0
```

Install the Compact Developer Tools following the instructions at:
[https://docs.midnight.network/blog/compact-developer-tools](https://docs.midnight.network/blog/compact-developer-tools)

Verify the installation:
```bash
compact --version
```

### Setup
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd openzeppelin-midnight-apps
   ```

2. **Install Dependencies**:
   ```bash
   pnpm install
   ```
   - This installs all workspace dependencies and runs the `prepare` script, which sets up Husky and builds `@openzeppelin/midnight-apps-compact`.

3. **Workspace Structure**:
   - `contracts/*`: Compact Smart contract projects (e.g., `@openzeppelin/midnight-apps-access-contract`).
   - `packages/*`: Utility packages (e.g., `@openzeppelin/midnight-apps-compact`).
   - `apps/*`: Frontend applications (e.g., `@openzeppelin/midnight-apps-lunarswap-ui`).

   See `pnpm-workspace.yaml` for the full list.

4. **Build Contracts Packages**:
   ```bash
   # Navigate to each contract package and run build
   cd contracts/access && pnpm build 
   cd ../math && pnpm build
   cd ../structs && pnpm build
   ```
   - **Note**: Running `pnpm build:contracts`, `pnpm compact`, `pnpm compact:fast`, `pnpm compact:version`, or `pnpm compact:language-version` from the root may cause repetitive output due to Turbo's logging behavior. It's recommended to compile contracts individually from within each package directory.
   - **Feature Request**: A logging output mode flag is being requested to fix Turbo animation log flooding. See [GitHub Issue #1188](https://github.com/midnightntwrk/compactc/issues/1188) for more details.
   
### Tasks with Turbo
Turbo manages tasks across the monorepo, defined in `turbo.json`. Key tasks:

- **`compact`**:
  - Compiles `.compact` files using the Compact CLI.
  - Run: `pnpm compact` (from within individual packages).
  - **Note**: Running from root with `pnpm compact`, `pnpm compact:fast`, `pnpm compact:version`, or `pnpm compact:language-version` may cause output repetition issues.
  - Variants:
    - `pnpm compact:fast`: Compiles with `--skip-zk` flag for faster builds.
    - `pnpm compact:fmt`: Formats all `.compact` files using `compact format`.

- **`build`**:
  - **`build:contracts`**
    - Builds contracts projects, including TypeScript compilation and artifact copying, after running `compact`.
    - Run: `pnpm build:contracts` (may cause output repetition - use individual package compilation instead).
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
  - `pnpm fmt`: Formats TypeScript/JavaScript code with Biome and `.compact` files with Compact CLI.
  - `pnpm lint`: Lints code with Biome.
  - `pnpm lint:fix`: Auto-fixes linting issues with Biome.

### Commit Workflow
Commits are linted with `commitlint` and staged files are processed with `lint-staged` and Biome.

1. **Conventional Commits**:
   - Use the format: `<type>(<scope>): <description>` (e.g., `feat(ui): add button styles`).
   - Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, etc.
   - See [Conventional Commits](https://www.conventionalcommits.org/).

2. **Pre-Commit Hook**:
   - Runs `turbo run precommit` via `.husky/pre-commit`.
   - For `@openzeppelin/midnight-apps-access-contract`:
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
• @openzeppelin/midnight-apps-access-contract:precommit
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

