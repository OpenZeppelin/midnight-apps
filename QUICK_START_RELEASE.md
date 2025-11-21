# Quick Start: Your First Release

## 🎯 Simple Recommendation

**Release these 4 packages as v1.0.0-alpha.2:**

1. ✅ `@openzeppelin-midnight-apps/compact` (already public)
2. ✅ `@openzeppelin-midnight-apps/compact-std` (already public)  
3. ⚠️ `@openzeppelin-midnight-apps/math` (make public)
4. ⚠️ `@openzeppelin-midnight-apps/structs` (make public)

## ⚡ 5-Minute Setup

### Step 1: Make Packages Public (2 min)

```bash
cd /home/iskander/Projects/midnight-dapps

# Remove "private": true from math
sed -i '/"private": true,/d' contracts/math/package.json

# Remove "private": true from structs  
sed -i '/"private": true,/d' contracts/structs/package.json
```

### Step 2: Set Up NPM Token (2 min)

1. Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
2. Click "Generate New Token" → Choose "Automation"
3. Copy the token
4. Go to your GitHub repo → Settings → Secrets and variables → Actions
5. Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: paste your token

### Step 3: Create Release Changeset (1 min)

```bash
pnpm changeset
```

When prompted:
- **Which packages?** Select all 4 (compact, compact-std, math, structs)
- **What kind of change?** Choose **patch**
- **Summary:** `Initial public release`

### Step 4: Commit and Push

```bash
git add .
git commit -m "chore: prepare initial release v1.0.0-alpha.2"
git push
```

### Step 5: Merge to Main

1. Create PR and merge to `main`
2. GitHub Action will create "Version Packages" PR
3. Review and merge that PR
4. 🎉 Packages published!

## 🔍 Verify Success

```bash
# Check if published
npm view @openzeppelin-midnight-apps/compact
npm view @openzeppelin-midnight-apps/compact-std
npm view @openzeppelin-midnight-apps/math
npm view @openzeppelin-midnight-apps/structs
```

## ❓ FAQ

**Q: Why these 4 packages?**  
A: They're foundational utilities that other packages depend on. Start small and stable.

**Q: Why patch version (alpha.1 → alpha.2)?**  
A: Safe first step. Keeps you in alpha while testing the release process.

**Q: When to move to 1.0.0 stable?**  
A: After a few alpha/beta releases and you're confident in the API.

**Q: What about the other packages?**  
A: Keep them private for now. Release incrementally as they stabilize.

---

**Need help?** See `FIRST_RELEASE_PLAN.md` for detailed explanation.

