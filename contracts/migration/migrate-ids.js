#!/usr/bin/env node

/**
 * Migration script to convert old ID format to new hierarchical format
 *
 * OLD FORMAT:
 * - Modules: MOD-0001 (4 digits)
 * - Features: FEAT-0001 (4 digits, no parent reference)
 * - Issues: STORY-0001, BUG-0001, etc. (4 digits, no parent reference)
 *
 * NEW FORMAT:
 * - Modules: MOD-001 (3 digits)
 * - Features: MOD-001-FEAT-001 (includes module prefix)
 * - Issues: MOD-001-FEAT-001-STORY-001 (includes module and feature prefix)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class IDMigrator {
  constructor() {
    // Maps to track old ID -> new ID conversions
    this.moduleMap = new Map();
    this.featureMap = new Map();
    this.issueMap = new Map();

    // Track feature to module relationships
    this.featureToModule = new Map();
    this.issueToFeature = new Map();
  }

  /**
   * Convert old 4-digit ID to new 3-digit format
   * Handles all segments of hierarchical IDs
   */
  convertDigits(id) {
    // Replace all 4-digit segments with 3-digit ones
    return id.replace(/-(0*)(\d{1,4})\b/g, (match, zeros, num) => {
      return '-' + num.padStart(3, '0');
    });
  }

  /**
   * Build relationship maps by reading all files first
   */
  buildRelationshipMaps(modulesDir, featuresDir, issuesDir) {
    console.log('Building relationship maps...');

    // Read modules to understand the hierarchy
    const moduleFiles = fs.readdirSync(modulesDir).filter(f => f.endsWith('.json'));
    moduleFiles.forEach(file => {
      const content = JSON.parse(fs.readFileSync(path.join(modulesDir, file), 'utf8'));
      const oldId = content.id;
      const newId = this.convertDigits(oldId);
      this.moduleMap.set(oldId, newId);

      // Map features to this module
      if (content.features) {
        content.features.forEach(featId => {
          this.featureToModule.set(featId, newId);
        });
      }
    });

    // Read features to understand feature-to-module relationships
    if (fs.existsSync(featuresDir)) {
      const featureFiles = fs.readdirSync(featuresDir).filter(f => f.endsWith('.json'));
      featureFiles.forEach(file => {
        const content = JSON.parse(fs.readFileSync(path.join(featuresDir, file), 'utf8'));
        const oldFeatId = content.id;
        const moduleId = content.moduleId;

        // Get new module ID
        const newModuleId = this.moduleMap.get(moduleId) || this.convertDigits(moduleId);

        // Extract feature number and create new hierarchical ID
        const featNum = parseInt(oldFeatId.match(/FEAT-(\d+)/)[1], 10);
        const newFeatId = `${newModuleId}-FEAT-${String(featNum).padStart(3, '0')}`;

        this.featureMap.set(oldFeatId, newFeatId);
        this.featureToModule.set(oldFeatId, newModuleId);

        // Map issues to this feature
        if (content.issues) {
          content.issues.forEach(issueId => {
            this.issueToFeature.set(issueId, newFeatId);
          });
        }
      });
    }

    // Read issues to build issue map
    if (fs.existsSync(issuesDir)) {
      const issueFiles = fs.readdirSync(issuesDir).filter(f => f.endsWith('.json'));
      issueFiles.forEach(file => {
        const content = JSON.parse(fs.readFileSync(path.join(issuesDir, file), 'utf8'));
        const oldIssueId = content.id;
        const featureId = content.featureId;

        // Get new feature ID
        const newFeatId = this.featureMap.get(featureId) || featureId;

        // Extract issue type and number
        const match = oldIssueId.match(/(STORY|BUG|DEBT|SPIKE)-(\d+)/);
        if (match) {
          const [, type, num] = match;
          const issueNum = parseInt(num, 10);
          const newIssueId = `${newFeatId}-${type}-${String(issueNum).padStart(3, '0')}`;
          this.issueMap.set(oldIssueId, newIssueId);
        }
      });
    }

    console.log(`Mapped ${this.moduleMap.size} modules`);
    console.log(`Mapped ${this.featureMap.size} features`);
    console.log(`Mapped ${this.issueMap.size} issues`);
  }

  /**
   * Migrate a single module file
   */
  migrateModule(filePath) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update module ID
    if (content.id) {
      content.id = this.moduleMap.get(content.id) || this.convertDigits(content.id);
    }

    // Update feature references
    if (content.features && Array.isArray(content.features)) {
      content.features = content.features.map(featId =>
        this.featureMap.get(featId) || featId
      );
    }

    return content;
  }

  /**
   * Migrate a single feature file
   */
  migrateFeature(filePath) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update feature ID
    if (content.id) {
      content.id = this.featureMap.get(content.id) || content.id;
    }

    // Update module ID reference
    if (content.moduleId) {
      content.moduleId = this.moduleMap.get(content.moduleId) || this.convertDigits(content.moduleId);
    }

    // Update issue references
    if (content.issues && Array.isArray(content.issues)) {
      content.issues = content.issues.map(issueId =>
        this.issueMap.get(issueId) || issueId
      );
    }

    // Update feature dependencies if they exist
    if (content.featureDependencies && Array.isArray(content.featureDependencies)) {
      content.featureDependencies = content.featureDependencies.map(dep => ({
        ...dep,
        featureId: this.featureMap.get(dep.featureId) || dep.featureId
      }));
    }

    // Update related features if they exist (for enhanced templates)
    if (content.relatedFeatures && Array.isArray(content.relatedFeatures)) {
      content.relatedFeatures = content.relatedFeatures.map(rel => ({
        ...rel,
        featureId: this.featureMap.get(rel.featureId) || rel.featureId
      }));
    }

    // Update data contract references if they exist
    if (content.dataContract) {
      if (content.dataContract.consumes) {
        content.dataContract.consumes = content.dataContract.consumes.map(item => ({
          ...item,
          sourceFeature: item.sourceFeature ?
            (this.featureMap.get(item.sourceFeature) || item.sourceFeature) :
            item.sourceFeature
        }));
      }
      if (content.dataContract.produces) {
        content.dataContract.produces = content.dataContract.produces.map(item => ({
          ...item,
          consumers: item.consumers ?
            item.consumers.map(c => this.featureMap.get(c) || c) :
            item.consumers
        }));
      }
    }

    return content;
  }

  /**
   * Migrate a single issue file
   */
  migrateIssue(filePath) {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Update issue ID
    if (content.id) {
      content.id = this.issueMap.get(content.id) || content.id;
    }

    // Update feature ID reference
    if (content.featureId) {
      content.featureId = this.featureMap.get(content.featureId) || content.featureId;
    }

    // Update related issues for bugs
    if (content.relatedIssues && Array.isArray(content.relatedIssues)) {
      content.relatedIssues = content.relatedIssues.map(rel => ({
        ...rel,
        id: this.issueMap.get(rel.id) || rel.id
      }));
    }

    // Update affected features for bugs
    if (content.impact && content.impact.affectedFeatures && Array.isArray(content.impact.affectedFeatures)) {
      content.impact.affectedFeatures = content.impact.affectedFeatures.map(featId =>
        this.featureMap.get(featId) || featId
      );
    }

    return content;
  }

  /**
   * Run migration on all files in a directory
   */
  migrateDirectory(dir, migrateFunc, label) {
    if (!fs.existsSync(dir)) {
      console.log(`Directory ${dir} does not exist, skipping...`);
      return;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    console.log(`\nMigrating ${files.length} ${label}...`);

    files.forEach(file => {
      const filePath = path.join(dir, file);
      console.log(`  Processing ${file}...`);

      try {
        const migrated = migrateFunc.call(this, filePath);
        fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2) + '\n', 'utf8');
        console.log(`    ✓ Migrated successfully`);
      } catch (error) {
        console.error(`    ✗ Error: ${error.message}`);
      }
    });
  }

  /**
   * Run the complete migration
   */
  migrate(baseDir) {
    const modulesDir = path.join(baseDir, 'test/modules');
    const featuresDir = path.join(baseDir, 'test/features');
    const issuesDir = path.join(baseDir, 'test/issues');

    console.log('='.repeat(60));
    console.log('CONTRACT ID MIGRATION');
    console.log('='.repeat(60));

    // Phase 1: Build relationship maps
    this.buildRelationshipMaps(modulesDir, featuresDir, issuesDir);

    // Phase 2: Migrate files
    this.migrateDirectory(modulesDir, this.migrateModule, 'modules');
    this.migrateDirectory(featuresDir, this.migrateFeature, 'features');
    this.migrateDirectory(issuesDir, this.migrateIssue, 'issues');

    console.log('\n' + '='.repeat(60));
    console.log('Migration complete!');
    console.log('='.repeat(60));
    console.log('\nSummary:');
    console.log(`  Modules migrated: ${this.moduleMap.size}`);
    console.log(`  Features migrated: ${this.featureMap.size}`);
    console.log(`  Issues migrated: ${this.issueMap.size}`);
    console.log('\nNext steps:');
    console.log('  1. Review the migrated files');
    console.log('  2. Run validation: npm run validate:module test/modules/*.json');
    console.log('  3. Run validation: npm run validate:feature test/features/*.json');
    console.log('  4. Run validation: npm run validate:story test/issues/STORY-*.json');
  }
}

// Run migration if called directly
const baseDir = path.join(__dirname, '../..');
const migrator = new IDMigrator();
migrator.migrate(baseDir);

export default IDMigrator;
