# Version Management Fix - v2.2.2

## Problem

Version mismatches were occurring because versions were hardcoded in multiple locations:
1. `package.json` (line 3)
2. `src/index.ts` Server constructor (line ~66)
3. `src/index.ts` health_check response (line ~1199)
4. `src/index.ts` console.error (line ~2254)

When publishing, if ANY of these weren't updated, the published package would show mismatched versions.

**Example:** v2.2.1 was published with package.json saying "2.2.1" but health_check returning "2.2.0".

## Solution

### 1. Single Source of Truth (src/index.ts:63-67)

```typescript
// Get version from package.json (single source of truth)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
const VERSION = packageJson.version;
```

Now **all** version references use the `VERSION` constant which reads directly from `package.json` at runtime.

### 2. Automated Version Bump Script (scripts/bump-version.js)

Three npm commands to bump version:

```bash
npm run version:patch   # 2.2.1 -> 2.2.2 (bug fixes)
npm run version:minor   # 2.2.1 -> 2.3.0 (new features)
npm run version:major   # 2.2.1 -> 3.0.0 (breaking changes)
```

The script:
- ✅ Updates `package.json` version
- ✅ Updates CHANGELOG.md (if exists)
- ✅ Shows next steps (build, publish, git tag)

### 3. Benefits

**Before:**
- 4 manual locations to update
- Easy to forget one
- Leads to version mismatches
- User frustration

**After:**
- 1 command: `npm run version:patch`
- Impossible to have mismatches (single source of truth)
- Consistent versions across all output
- Happy users!

## Testing

```bash
# Build and verify
npm run build
node -e "import('./build/index.js').then(() => {})" 2>&1 | head -2
# Output: 📦 VibeOps v2.2.2

# Verify in MCP health_check
# Output: { "status": "healthy", "version": "2.2.2", ... }
```

## Publishing v2.2.2

Follow these steps:

```bash
# 1. Already done - version bumped and built
npm run build  # Just to be sure

# 2. Verify version
node -e "import('./build/index.js').then(() => {})" 2>&1 | head -2

# 3. Publish (get OTP from authenticator)
npm publish --otp=YOUR_6_DIGIT_CODE

# 4. Install in test directory
cd /path/to/test
npm install @anckr/vibeops@2.2.2

# 5. Restart Claude Code completely

# 6. Test health_check - should show 2.2.2!
```

## Root Cause Analysis

The npm package `@anckr/vibeops@2.2.1` that was published had:
- `package.json`: version "2.2.1" ✅
- `build/index.js` health_check: version "2.2.0" ❌

This happened because:
1. `package.json` was updated to 2.2.1
2. `src/index.ts` health_check wasn't updated (left at 2.2.0)
3. Build ran with old health_check version
4. Published to npm with mismatch
5. Users saw version 2.0.0 (or 2.2.0) instead of 2.2.1

**This cannot happen again** because:
- All versions now read from package.json at runtime
- Automated bump script ensures consistency
- Single source of truth = impossible to mismatch

## Files Changed

1. `mcp/src/index.ts` - Added VERSION constant from package.json
2. `mcp/scripts/bump-version.js` - New automated version bump script
3. `mcp/package.json` - Added version:patch/minor/major commands
4. `mcp/RELEASE_CHECKLIST.md` - Updated with automated process
5. This file - Documentation of the fix

---

**Date:** 2025-11-05
**Version:** 2.2.2
**Fix Type:** Systematic process improvement
