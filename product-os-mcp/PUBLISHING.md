# Publishing Guide

Guide for maintainers on publishing new versions of Product OS MCP Server to npm.

## Prerequisites

1. **npm account**: You need an npm account with publish permissions
2. **Organization access**: Access to @vibeops organization on npm (if publishing scoped package)
3. **Git access**: Push access to the repository
4. **Clean working directory**: All changes committed

## Pre-Publish Checklist

Before publishing a new version:

- [ ] All features tested and working
- [ ] TypeScript builds without errors
- [ ] README.md updated with new features
- [ ] CHANGELOG.md updated with version changes
- [ ] Version number bumped in package.json
- [ ] All commits pushed to main branch
- [ ] Git tag created for the version

## Publishing Process

### 1. Update Version

Choose the appropriate version bump based on changes:

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backwards compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes, backwards compatible

```bash
# Patch release (bug fixes)
npm version patch

# Minor release (new features)
npm version minor

# Major release (breaking changes)
npm version major
```

This will:
- Update version in package.json
- Create a git commit with the version
- Create a git tag

### 2. Update CHANGELOG.md

Add entry for the new version:

```markdown
## [1.1.0] - 2025-11-15

### Added
- New feature X
- New feature Y

### Fixed
- Bug fix Z

### Changed
- Improvement W
```

Commit the changelog:

```bash
git add CHANGELOG.md
git commit --amend --no-edit
```

### 3. Push to Repository

```bash
git push origin main
git push origin --tags
```

### 4. Build the Package

Ensure a clean build:

```bash
npm run build
```

### 5. Test the Package

Create a test tarball and inspect contents:

```bash
npm pack
tar -tzf vibeops-product-os-mcp-*.tgz
```

Verify:
- All build files included
- All documentation files included
- No unnecessary files (src/, tests/, etc.)

### 6. Publish to npm

**For first-time publish:**

```bash
npm login
npm publish --access public
```

**For subsequent publishes:**

```bash
npm publish
```

### 7. Verify Publication

Check that the package appears on npm:

```bash
npm view @vibeops/product-os-mcp
```

Visit: https://www.npmjs.com/package/@vibeops/product-os-mcp

### 8. Test Installation

In a test project:

```bash
npm install -g @vibeops/product-os-mcp
product-os-mcp --version
```

Or in a project:

```bash
mkdir test-project && cd test-project
npm init -y
npm install @vibeops/product-os-mcp
npx product-os-mcp
```

## Post-Publish

1. **Announce the release**: Update project README or documentation site
2. **Create GitHub release**: Add release notes on GitHub
3. **Monitor for issues**: Watch for bug reports after release

## Troubleshooting

### "You do not have permission to publish"

You need to be added to the @vibeops organization on npm:

```bash
npm access grant read-write vibeops:developers @vibeops/product-os-mcp
```

### "Package already exists"

You're trying to publish a version that already exists. Bump the version:

```bash
npm version patch
npm publish
```

### "Registry timeout"

npm registry might be experiencing issues. Try again or check https://status.npmjs.org/

### "No README data"

Ensure README.md exists and is included in the `files` array in package.json.

## Unpublishing (Use with Caution)

Unpublishing can break dependent projects. Only do this for serious issues:

```bash
# Unpublish specific version
npm unpublish @vibeops/product-os-mcp@1.0.0

# Unpublish entire package (not recommended)
npm unpublish @vibeops/product-os-mcp --force
```

**Note**: You can only unpublish versions published less than 72 hours ago.

## Beta/Alpha Releases

For pre-release versions:

```bash
# Create beta version
npm version 1.1.0-beta.0

# Publish with beta tag
npm publish --tag beta

# Users install with:
npm install @vibeops/product-os-mcp@beta
```

## Package Deprecation

To deprecate a version without unpublishing:

```bash
npm deprecate @vibeops/product-os-mcp@1.0.0 "Please upgrade to 1.1.0"
```

## Version Management Strategy

### Semantic Versioning

We follow [Semantic Versioning](https://semver.org/):

- **1.0.0** - Initial stable release
- **1.1.0** - Added new features
- **1.0.1** - Bug fixes only
- **2.0.0** - Breaking changes

### Pre-release Versions

- **1.1.0-alpha.1** - Alpha testing (internal)
- **1.1.0-beta.1** - Beta testing (public preview)
- **1.1.0-rc.1** - Release candidate (final testing)
- **1.1.0** - Stable release

### Long-term Support (Future)

When we reach maturity:
- Maintain LTS versions for critical bug fixes
- Clearly mark which versions are LTS
- Provide migration guides for major versions

## Security

### Reporting Security Issues

Do not publish versions with known security vulnerabilities.

If a security issue is found after publishing:
1. Unpublish immediately (if within 72 hours)
2. Fix the issue
3. Publish a patch version
4. Notify users via GitHub Security Advisory

### npm Token Security

Keep your npm authentication token secure:

```bash
# Token stored in ~/.npmrc
# Never commit this file
# Use npm automation tokens for CI/CD
```

## CI/CD Integration (Future)

For automated publishing:

1. Set up GitHub Actions workflow
2. Use npm automation token
3. Publish on git tag creation
4. Run tests before publishing

Example workflow:

```yaml
name: Publish to npm
on:
  push:
    tags:
      - 'v*'
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run build
      - run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

## Questions?

Contact the maintainers or open an issue on GitHub.
