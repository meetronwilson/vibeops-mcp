# VibeOps NPM Release Checklist

Use this checklist every time you publish a new version to npm to ensure all version references are updated consistently.

## Pre-Release Checklist

### 1. Version Number Updates (AUTOMATED!)

**🎉 NEW: Automated version management!**

Run one of these commands from the `mcp/` directory:

```bash
npm run version:patch   # 2.2.1 -> 2.2.2 (bug fixes)
npm run version:minor   # 2.2.1 -> 2.3.0 (new features)
npm run version:major   # 2.2.1 -> 3.0.0 (breaking changes)
```

This automatically updates:
- ✅ `package.json` version
- ✅ All version references in `src/index.ts` (now uses single source of truth)
- ✅ Optional CHANGELOG.md entry

**No more manual updates! No more version mismatches!**

### 2. Build the Package
- [ ] Run `npm run build` from the `mcp/` directory
- [ ] Verify no TypeScript errors
- [ ] Check that `build/index.js` was updated (timestamp should be recent)

### 3. Verify Version in Build
- [ ] Run: `node -e "import('./build/index.js').then(() => {})" 2>&1 | head -2`
- [ ] Confirm version displays correctly in console output

### 4. Test Locally (Optional but Recommended)
- [ ] Run `npx @anckr/vibeops` from a test directory
- [ ] Verify version displays correctly in console output
- [ ] Test basic MCP operations if critical changes were made

## Publishing

### 5. Get 2FA Code Ready
- [ ] Open your authenticator app
- [ ] Have your 6-digit OTP code ready

### 6. Publish to NPM
- [ ] Run: `npm publish --otp=YOUR_CODE` from the `mcp/` directory
- [ ] Wait for "Published to https://registry.npmjs.org/" confirmation
- [ ] Verify the correct version number in the publish output

### 7. Verify on NPM
- [ ] Visit: https://www.npmjs.com/package/@anckr/vibeops
- [ ] Confirm the new version appears in the version dropdown
- [ ] Check that the "Latest" tag shows the new version

## Post-Release

### 8. Update Test/Development Environments
- [ ] Update local test directory: `npm install @anckr/vibeops@latest`
- [ ] Clear npx cache if using npx: `rm -rf ~/.npm/_npx`
- [ ] Restart Claude Code completely (Cmd+Q, then reopen)

### 9. Verify Installation
- [ ] Run health check in Claude Code
- [ ] Confirm version shows correctly: should match new version
- [ ] Test new features if applicable

### 10. Update Documentation
- [ ] Update CHANGELOG.md with new version notes
- [ ] Document any breaking changes
- [ ] Update README.md if new features were added

### 11. Git Commit & Tag
- [ ] Commit all changes: `git add . && git commit -m "Release vX.X.X"`
- [ ] Create git tag: `git tag vX.X.X`
- [ ] Push to remote: `git push && git push --tags`

## Version Number Guidelines

### Semantic Versioning (MAJOR.MINOR.PATCH)

**MAJOR version** (X.0.0) - Increment when:
- Breaking changes that require users to modify their code
- Major API restructuring
- Removing deprecated features

**MINOR version** (0.X.0) - Increment when:
- Adding new features (backward compatible)
- Adding new MCP tools
- Enhancing existing schemas with optional fields

**PATCH version** (0.0.X) - Increment when:
- Bug fixes
- Documentation updates
- Performance improvements
- Fixing hardcoded version numbers 😅

## Common Issues & Solutions

### Issue: Health check shows old version after update
**Solution (v2.2.2+):**
1. **This should never happen anymore!** All versions use single source of truth from package.json
2. If it does happen:
   - Verify `package.json` has correct version
   - Rebuild: `npm run build`
   - Test: `node -e "import('./build/index.js').then(() => {})"`
   - If still wrong, the VERSION constant isn't being used correctly in src/index.ts

### Issue: npx still uses old version
**Solution:**
1. Clear npx cache: `rm -rf ~/.npm/_npx`
2. Restart Claude Code completely
3. Consider using direct node path in Claude config instead of npx

### Issue: Package published but shows wrong version on npm
**Solution:**
- You forgot to update `package.json` before publishing
- Cannot unpublish after 24 hours
- Must publish a new patch version with correct number

### Issue: Build fails with TypeScript errors
**Solution:**
1. Fix TypeScript errors first
2. Common issues:
   - Type mismatches in new tool implementations
   - Missing imports
   - Incorrect type annotations
3. Run `npm run build` until no errors

## Quick Reference Commands

```bash
# Update version (AUTOMATED - use this!)
npm run version:patch  # Bug fixes: 2.2.1 -> 2.2.2
npm run version:minor  # New features: 2.2.1 -> 2.3.0
npm run version:major  # Breaking changes: 2.2.1 -> 3.0.0

# Build
npm run build

# Verify version in built file
grep "version" mcp/build/index.js | head -5

# Publish (from mcp/ directory)
npm publish --otp=YOUR_6_DIGIT_CODE

# Install in test directory
cd /path/to/test && npm install @anckr/vibeops@latest

# Clear npx cache
rm -rf ~/.npm/_npx

# Verify installation
npx @anckr/vibeops
```

## Notes

- **Always test locally before publishing** - Once published, you can't unpublish easily
- **Keep CHANGELOG.md updated** - Users appreciate knowing what changed
- **Use git tags** - Makes it easy to reference specific versions
- **Document breaking changes prominently** - Save users time and frustration

## Release History

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 2.2.2 | 2025-11-05 | Patch | **Automated version management** - single source of truth from package.json |
| 2.2.1 | 2025-11-05 | Patch | Fixed hardcoded version in health_check (manual fix) |
| 2.2.0 | 2025-11-05 | Minor | Added session memory storage (7 new tools) |
| 2.1.0 | 2025-11-05 | Minor | AI-driven development enhancements (testing, dependencies, bug tracking) |
| 2.0.1 | 2025-11-04 | Patch | Build version fix |
| 2.0.0 | 2025-11-04 | Major | Rebranding from product-os to vibeops |

---

**Remember (v2.2.2+):** Just run `npm run version:patch` (or minor/major) and everything is handled automatically!
