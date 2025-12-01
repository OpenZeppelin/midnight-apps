# First Release Plan

## 🎯 Goal
Publish the first stable set of packages to npm registry.

## 📦 Packages to Release

### Phase 1: Core Infrastructure (READY NOW)
These packages are already marked as public and ready:

1. **@openzeppelin-midnight-apps/compact** - `1.0.0-alpha.1`
   - Compact compiler wrapper
   - No breaking changes expected
   - Foundational tool

2. **@openzeppelin-midnight-apps/compact-std** - `1.0.0-alpha.1`
   - Standard library types for Compact
   - Low-level utilities
   - Dependency of contracts

### Phase 2: Contract Packages (Recommend making public)
3. **@openzeppelin-midnight-apps/math** - `1.0.0-alpha.1`
   - Math utilities for contracts
   - Stable API

4. **@openzeppelin-midnight-apps/structs** - `1.0.0-alpha.1`
   - Data structures for contracts
   - Stable API

### Keep Private (for now)
- **@openzeppelin-midnight-apps/biome-config** - Internal tooling
- **@openzeppelin-midnight-apps/access-control** - May want to test more
- **@openzeppelin-midnight-apps/shielded-token** - May want to test more

## 🚀 Execution Steps

### 1. Prepare Packages for Publishing (Math & Structs)

```bash
# Edit contracts/math/package.json - remove "private": true
# Edit contracts/structs/package.json - remove "private": true
```

### 2. Add Missing Package Metadata

Ensure each package has:
- ✓ Proper `description`
- ✓ `keywords` array
- ✓ `repository` field
- ✓ `license` (currently MIT/ISC)
- ✓ `author` field
- ✓ Proper `exports` configuration

### 3. Create Initial Release Changeset

```bash
# Create a changeset for the initial release
pnpm changeset

# Select all packages to release:
# - @openzeppelin-midnight-apps/compact
# - @openzeppelin-midnight-apps/compact-std
# - @openzeppelin-midnight-apps/math (if making public)
# - @openzeppelin-midnight-apps/structs (if making public)

# Choose version: patch (to go from 1.0.0-alpha.1 → 1.0.0-alpha.2)
# OR use major to go to 1.0.0 if ready for stable

# Summary: "Initial public release of Midnight DApp core packages"
```

### 4. Version Strategy Decision

**Option A: Stay in Alpha**
- Keep `1.0.0-alpha.1` → bump to `1.0.0-alpha.2`
- Signals: Still experimental, API may change
- Recommended if: Still iterating on API design

**Option B: Move to Beta**
- `1.0.0-alpha.1` → `1.0.0-beta.1`
- Signals: Feature complete, API stabilizing
- Recommended if: Main features done, focusing on bugs

**Option C: Go to Stable 1.0.0**
- `1.0.0-alpha.1` → `1.0.0`
- Signals: Production ready, semver guarantees
- Recommended if: Confident in API stability

### 5. Set Up NPM Publishing

```bash
# 1. Create NPM account (if needed)
# 2. Create organization or request access to @openzeppelin-midnight-apps
# 3. Generate automation token at https://www.npmjs.com/settings/YOUR_USER/tokens
# 4. Add to GitHub: Settings → Secrets → Actions → New secret
#    Name: NPM_TOKEN
#    Value: <your-token>
```

### 6. Dry Run (Local Test)

```bash
# Test the versioning locally
pnpm changeset:version

# Review the changes:
# - Check package.json versions
# - Check CHANGELOG.md files
# - Verify dependencies updated

# Test publishing (doesn't actually publish)
pnpm changeset:publish --dry-run

# If issues, reset:
git reset --hard HEAD
```

### 7. Execute First Release

```bash
# Commit the changeset
git add .changeset/*.md
git commit -m "chore: prepare initial release"

# Push to feature branch
git push origin feat/initial-release

# Create PR to main
# Once merged to main:
# → GitHub Action creates "Version Packages" PR
# → Review it carefully
# → Merge to publish!
```

## 📋 Pre-Release Checklist

- [ ] NPM_TOKEN added to GitHub secrets
- [ ] Packages have proper metadata (description, keywords, license)
- [ ] README.md files exist for each package
- [ ] Build scripts work (`pnpm build`)
- [ ] Tests pass (`pnpm test`)
- [ ] Package exports are correct
- [ ] Dependencies are properly declared
- [ ] .npmignore or package.json "files" field configured

## 🔍 Post-Release Verification

After the first release:

```bash
# Check packages were published
npm view @openzeppelin-midnight-apps/compact
npm view @openzeppelin-midnight-apps/compact-std
npm view @openzeppelin-midnight-apps/math
npm view @openzeppelin-midnight-apps/structs

# Test installation in a new project
mkdir /tmp/test-install
cd /tmp/test-install
npm init -y
npm install @openzeppelin-midnight-apps/compact@latest
npm install @openzeppelin-midnight-apps/compact-std@latest

# Verify it works
node -e "console.log(require('@openzeppelin-midnight-apps/compact'))"
```

## 🎉 Success Criteria

- ✅ Packages available on npm
- ✅ Can be installed via npm/pnpm/yarn
- ✅ Correct version numbers
- ✅ Git tags created
- ✅ CHANGELOG.md generated
- ✅ No errors in CI

## 📝 Recommended Version for First Release

**Suggestion: 1.0.0-beta.1**

Reasoning:
- Moving from `alpha` → `beta` signals maturity
- Beta indicates feature-complete but still testing
- Allows for API changes if needed (beta doesn't have semver guarantees)
- When confident, can move to 1.0.0 stable

To do this, use `pnpm changeset` and select **minor** bump, which will go:
- `1.0.0-alpha.1` → `1.0.0-alpha.2` (if choosing patch)
- Or manually edit version in changeset file for beta

Actually, for pre-release bumps, you might need to manually edit the changeset or package.json files.

## Alternative: Use Initial 0.x.x Version

If you want more flexibility before committing to 1.0:
- Downgrade to `0.1.0` or `0.9.0`
- 0.x.x versions signal "in development"
- Breaking changes don't require major bump
- Move to 1.0.0 when ready for stability commitment

---

## My Recommendation

**Start with these exact steps:**

1. **Make math and structs public** (remove "private": true)
2. **Create a changeset** for all 4 packages
3. **Use patch version** to go to `1.0.0-alpha.2` for first release
4. **Merge to main** and let automation handle it
5. **Monitor the first release** carefully
6. **Plan next release** based on learnings

This gives you a safe, controlled first release with packages that are already stable.

