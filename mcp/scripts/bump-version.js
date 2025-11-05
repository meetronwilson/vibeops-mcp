#!/usr/bin/env node

/**
 * Version Bump Script
 *
 * Automatically updates version in ALL locations to prevent mismatches.
 * Usage: node scripts/bump-version.js [major|minor|patch|<version>]
 *
 * Examples:
 *   node scripts/bump-version.js patch     # 2.2.1 -> 2.2.2
 *   node scripts/bump-version.js minor     # 2.2.1 -> 2.3.0
 *   node scripts/bump-version.js major     # 2.2.1 -> 3.0.0
 *   node scripts/bump-version.js 2.5.0     # Set to specific version
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

function getCurrentVersion() {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  return packageJson.version;
}

function parseVersion(version) {
  const parts = version.split('.');
  return {
    major: parseInt(parts[0]),
    minor: parseInt(parts[1]),
    patch: parseInt(parts[2]),
  };
}

function bumpVersion(current, type) {
  const v = parseVersion(current);

  switch (type) {
    case 'major':
      return `${v.major + 1}.0.0`;
    case 'minor':
      return `${v.major}.${v.minor + 1}.0`;
    case 'patch':
      return `${v.major}.${v.minor}.${v.patch + 1}`;
    default:
      // Assume it's a specific version like "2.5.0"
      if (/^\d+\.\d+\.\d+$/.test(type)) {
        return type;
      }
      throw new Error(`Invalid bump type: ${type}. Use major, minor, patch, or specific version like 2.5.0`);
  }
}

function updatePackageJson(newVersion) {
  const path = join(rootDir, 'package.json');
  const content = readFileSync(path, 'utf8');
  const updated = content.replace(
    /"version":\s*"[^"]+"/,
    `"version": "${newVersion}"`
  );
  writeFileSync(path, updated, 'utf8');
  console.log('✅ Updated package.json');
}

function updateSourceFile(newVersion) {
  const path = join(rootDir, 'src', 'index.ts');
  let content = readFileSync(path, 'utf8');

  // Update Server constructor version (line ~66)
  content = content.replace(
    /version:\s*['"][^'"]+['"]/,
    `version: '${newVersion}'`
  );

  // Update health_check response version (line ~1199)
  content = content.replace(
    /version:\s*['"][^'"]+['"],\s*\/\/ health_check/,
    `version: '${newVersion}', // health_check`
  );

  // If no comment, try without it
  content = content.replace(
    /(status:\s*['"]healthy['"],\s*\n\s*)version:\s*['"][^'"]+['"]/,
    `$1version: '${newVersion}'`
  );

  // Update console.error version (line ~2254)
  content = content.replace(
    /console\.error\(['"]📦 VibeOps v[^'"]+['"]\)/,
    `console.error('📦 VibeOps v${newVersion}')`
  );

  writeFileSync(path, content, 'utf8');
  console.log('✅ Updated src/index.ts (all 3 locations)');
}

function updateChangelog(newVersion, oldVersion) {
  const path = join(rootDir, '../CHANGELOG.md');

  try {
    const content = readFileSync(path, 'utf8');

    const today = new Date().toISOString().split('T')[0];
    const newEntry = `## [${newVersion}] - ${today}

### Changed
- Version bump from ${oldVersion} to ${newVersion}

`;

    // Insert after the first heading
    const updated = content.replace(
      /(# Changelog\n\n)/,
      `$1${newEntry}`
    );

    writeFileSync(path, updated, 'utf8');
    console.log('✅ Updated CHANGELOG.md');
  } catch (error) {
    console.log('⚠️  CHANGELOG.md not found (skipping)');
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node scripts/bump-version.js [major|minor|patch|<version>]');
    process.exit(1);
  }

  const bumpType = args[0];
  const currentVersion = getCurrentVersion();
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`\n🔄 Bumping version: ${currentVersion} -> ${newVersion}\n`);

  try {
    updatePackageJson(newVersion);
    updateSourceFile(newVersion);
    updateChangelog(newVersion, currentVersion);

    console.log(`\n✨ Successfully bumped version to ${newVersion}!`);
    console.log('\nNext steps:');
    console.log('  1. npm run build');
    console.log('  2. Verify: grep "version" build/index.js | head -5');
    console.log('  3. npm publish --otp=YOUR_CODE');
    console.log('  4. git add . && git commit -m "Release v' + newVersion + '"');
    console.log('  5. git tag v' + newVersion);
    console.log('  6. git push && git push --tags\n');
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
