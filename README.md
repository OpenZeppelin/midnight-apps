# Midnight DApps
A collection of starter-dapps on the Midnight Network

## Overview
This monorepo contains experimental sample projects built on top of the Midnight Network using Compact. It includes contracts, utilities, and applications showcasing the capabilities of privacy-preserving blockchain development.

## Smart Contracts

### 🌑 Lunarswap V1
**A decentralized exchange (DEX) protocol with privacy-preserving features**

- **Location**: `contracts/lunarswap-v1/`
- **Documentation**: [📖 Lunarswap V2 README](contracts/lunarswap-v1/README.md)

Lunarswap V1 is a next-generation DEX that combines automated market making with privacy features. Based on Uniswap V2 architecture, it's adapted for the Midnight Network with UTXO-based token management and shielded transactions.

**Key Features:**
- Automated market making with constant product formula
- Privacy-preserving UTXO-based token model
- LP token system for liquidity providers
- VWAP price oracle functionality
- Factory pattern for efficient pair management

### 🔐 Access Control
**Smart contract access control patterns**

- **Location**: `contracts/access/`

Demonstrates access control patterns for Compact smart contracts, including role-based permissions and administrative functions.

### 📊 Math Contracts
**Mathematical utilities and safe arithmetic operations**

- **Location**: `contracts/math/`

Provides safe mathematical operations, overflow protection, and utility functions for Compact smart contracts.

### 🏗️ Structs
**Common data structures and patterns**

- **Location**: `contracts/structs/`

Reusable data structures and patterns for Compact smart contract development.

## Applications

### 🌑 Lunarswap UI
**User interface for the Lunarswap V2 protocol**

- **Location**: `apps/lunarswap-ui/`
- **Technology**: React/TypeScript frontend
- **Purpose**: Web interface for interacting with Lunarswap V2

A modern web application that provides a user-friendly interface for:
- Adding and removing liquidity
- Viewing trading pairs and reserves
- Managing LP tokens
- Monitoring protocol statistics

## Packages & Utilities

### 📦 Compact Language Utilities
- **Location**: `packages/compact/`
- **Purpose**: Core Compact language utilities and tooling

### 📚 Compact Standard Library
- **Location**: `packages/compact-std/`
- **Purpose**: Standard library functions for Compact development

### 🛠️ Lunarswap SDK
- **Location**: `packages/lunarswap-sdk/`
- **Purpose**: JavaScript/TypeScript SDK for Lunarswap V2 integration


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

3. **Build Contracts Packages**:
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

## Quick Start

### Working with Smart Contracts
```bash
# Build all contracts
pnpm build:contracts

# Compile Compact files
pnpm compact

# Run contract tests
pnpm test

# Build specific contract
cd contracts/lunarswap-v2
pnpm build
```

### Running Applications
```bash
# Build all applications
pnpm build:apps

# Start Lunarswap UI
cd apps/lunarswap-ui
pnpm dev
```

### Using Packages
```bash
# Build all packages
pnpm build

# Use Lunarswap SDK
cd packages/lunarswap-sdk
pnpm build
```

## Contributing

### Development Workflow
1. **Fork the Repository**
2. **Create Feature Branch**: `git checkout -b feature/amazing-feature`
3. **Make Changes**: Follow coding standards and add tests
4. **Commit Changes**: Use conventional commit format
5. **Push Changes**: `git push origin feature/amazing-feature`
6. **Create Pull Request**: Provide detailed description

### Code Standards
- **Compact Code**: Follow Compact language best practices
- **Documentation**: Add comprehensive JSDoc comments
- **Testing**: Maintain high test coverage
- **Linting**: Ensure code passes all linting rules

### Commit Convention
Use conventional commit format:
```
type(scope): description

feat(lunarswap): add deadline support for transactions
fix(access): resolve permission check bug
docs(ui): update component documentation
```

## Commit Workflow
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built on the Midnight Network
- Lunarswap V2 based on Uniswap V2 architecture
- Developed using Compact programming language
- Community-driven development and feedback

