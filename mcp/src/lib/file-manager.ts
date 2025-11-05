/**
 * File Manager
 *
 * Handles reading and writing contract files from the filesystem.
 * Works with the existing contract directory structure.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, copyFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { mkdirSync } from 'fs';
import { fileURLToPath } from 'url';

// Get the directory where this module is located
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import type { Contract, ContractType, ContractFile } from '../types/contracts.js';

/**
 * Get the base contracts directory
 * Looks for .vibeops/ in current working directory
 * Auto-creates the directory structure if it doesn't exist
 */
export function getContractsDir(): string {
  const cwd = process.cwd();
  const contractsDir = join(cwd, '.vibeops');

  // Auto-create contracts directory if it doesn't exist
  if (!existsSync(contractsDir)) {
    console.error(`📦 VibeOps: Initializing contract directory structure...`);
    mkdirSync(contractsDir, { recursive: true });

    // Create contract storage directories
    mkdirSync(join(contractsDir, 'modules'), { recursive: true });
    mkdirSync(join(contractsDir, 'features'), { recursive: true });
    mkdirSync(join(contractsDir, 'issues'), { recursive: true });

    // Create schema, template, validator directories
    mkdirSync(join(contractsDir, 'schemas'), { recursive: true });
    mkdirSync(join(contractsDir, 'templates'), { recursive: true });
    mkdirSync(join(contractsDir, 'validators'), { recursive: true });
    mkdirSync(join(contractsDir, 'converters'), { recursive: true });

    // Copy schemas, templates, validators from the package
    const packageContractsDir = join(__dirname, '../../contracts');

    try {
      // Copy all schemas
      const schemasSource = join(packageContractsDir, 'schemas');
      const schemasDest = join(contractsDir, 'schemas');
      if (existsSync(schemasSource)) {
        const schemaFiles = readdirSync(schemasSource);
        schemaFiles.forEach(file => {
          copyFileSync(join(schemasSource, file), join(schemasDest, file));
        });
        console.error(`📋 Copied ${schemaFiles.length} schema files`);
      }

      // Copy all templates
      const templatesSource = join(packageContractsDir, 'templates');
      const templatesDest = join(contractsDir, 'templates');
      if (existsSync(templatesSource)) {
        const templateFiles = readdirSync(templatesSource);
        templateFiles.forEach(file => {
          copyFileSync(join(templatesSource, file), join(templatesDest, file));
        });
        console.error(`📝 Copied ${templateFiles.length} template files`);
      }

      // Copy validators
      const validatorsSource = join(packageContractsDir, 'validators');
      const validatorsDest = join(contractsDir, 'validators');
      if (existsSync(validatorsSource)) {
        const validatorFiles = readdirSync(validatorsSource);
        validatorFiles.forEach(file => {
          copyFileSync(join(validatorsSource, file), join(validatorsDest, file));
        });
        console.error(`✅ Copied ${validatorFiles.length} validator files`);
      }

      // Copy converters
      const convertersSource = join(packageContractsDir, 'converters');
      const convertersDest = join(contractsDir, 'converters');
      if (existsSync(convertersSource)) {
        const converterFiles = readdirSync(convertersSource);
        converterFiles.forEach(file => {
          copyFileSync(join(convertersSource, file), join(convertersDest, file));
        });
        console.error(`🔄 Copied ${converterFiles.length} converter files`);
      }

      // Copy documentation files to .vibeops directory
      const packageRoot = join(__dirname, '../..');
      const docsToCache = ['README.md', 'INSTALLATION.md', 'QUICK_START.md'];
      let copiedDocs = 0;

      docsToCache.forEach(docFile => {
        const sourcePath = join(packageRoot, docFile);
        const destPath = join(contractsDir, docFile);
        if (existsSync(sourcePath) && !existsSync(destPath)) {
          try {
            copyFileSync(sourcePath, destPath);
            copiedDocs++;
          } catch (err) {
            // Silently fail if we can't copy docs
          }
        }
      });

      if (copiedDocs > 0) {
        console.error(`📚 Copied ${copiedDocs} documentation files`);
      }
    } catch (error) {
      console.error(`⚠️  Warning: Could not copy contract files:`, error);
    }

    console.error(`✅ VibeOps initialized at: ${contractsDir}`);
  }

  return contractsDir;
}

/**
 * Get subdirectory for a contract type
 */
export function getTypeDir(type: ContractType): string {
  const contractsDir = getContractsDir();

  const typeDirMap: Record<ContractType, string> = {
    'module': join(contractsDir, 'modules'),
    'feature': join(contractsDir, 'features'),
    'user-story': join(contractsDir, 'issues'),
    'bug': join(contractsDir, 'issues'),
    'tech-debt': join(contractsDir, 'issues'),
    'spike': join(contractsDir, 'issues'),
  };

  return typeDirMap[type];
}

/**
 * Detect contract type from ID prefix
 */
export function detectContractType(id: string): ContractType {
  if (id.startsWith('MOD-')) return 'module';
  if (id.startsWith('FEAT-')) return 'feature';
  if (id.startsWith('STORY-')) return 'user-story';
  if (id.startsWith('BUG-')) return 'bug';
  if (id.startsWith('DEBT-')) return 'tech-debt';
  if (id.startsWith('SPIKE-')) return 'spike';

  throw new Error(`Unknown contract ID format: ${id}`);
}

/**
 * Read a contract by ID
 */
export function readContract(id: string): Contract {
  const type = detectContractType(id);
  const dir = getTypeDir(type);

  // Find file with this ID (could have any filename)
  const files = readdirSync(dir);
  const file = files.find(f => f.startsWith(id) && f.endsWith('.json'));

  if (!file) {
    throw new Error(`Contract not found: ${id}`);
  }

  const filePath = join(dir, file);
  const content = readFileSync(filePath, 'utf-8');

  return JSON.parse(content) as Contract;
}

/**
 * Write a contract to disk
 */
export function writeContract(contract: Contract, filename?: string): string {
  const type = detectContractType(contract.id);
  const dir = getTypeDir(type);

  // Ensure directory exists
  mkdirSync(dir, { recursive: true });

  // Generate filename if not provided
  if (!filename) {
    // Use pattern: ID-slugified-title.json
    const slug = 'title' in contract
      ? contract.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : 'name' in contract
      ? contract.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      : 'contract';

    filename = `${contract.id}-${slug}.json`;
  }

  const filePath = join(dir, filename);

  // Write with pretty formatting
  writeFileSync(filePath, JSON.stringify(contract, null, 2), 'utf-8');

  return filePath;
}

/**
 * Check if a contract exists
 */
export function contractExists(id: string): boolean {
  try {
    readContract(id);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all contracts of a given type
 */
export function listContracts(type: ContractType): ContractFile[] {
  const dir = getTypeDir(type);

  if (!existsSync(dir)) {
    return [];
  }

  const files = readdirSync(dir);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  const contracts: ContractFile[] = [];

  for (const file of jsonFiles) {
    try {
      const filePath = join(dir, file);
      const content = readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content) as Contract;

      contracts.push({
        path: filePath,
        type,
        id: data.id,
        data,
      });
    } catch (error) {
      console.error(`Error reading contract ${file}:`, error);
    }
  }

  return contracts;
}

/**
 * List all contracts across all types
 */
export function listAllContracts(): ContractFile[] {
  const types: ContractType[] = ['module', 'feature', 'user-story', 'bug', 'tech-debt', 'spike'];
  const allContracts: ContractFile[] = [];

  for (const type of types) {
    allContracts.push(...listContracts(type));
  }

  return allContracts;
}

/**
 * Delete a contract
 */
export function deleteContract(id: string): void {
  const type = detectContractType(id);
  const dir = getTypeDir(type);

  const files = readdirSync(dir);
  const file = files.find(f => f.startsWith(id) && f.endsWith('.json'));

  if (!file) {
    throw new Error(`Contract not found: ${id}`);
  }

  const filePath = join(dir, file);
  const fs = require('fs');
  fs.unlinkSync(filePath);
}

/**
 * Update an existing contract
 */
export function updateContract(id: string, updates: Partial<Contract>): Contract {
  const existing = readContract(id);

  // Merge updates
  const updated = {
    ...existing,
    ...updates,
    metadata: {
      ...existing.metadata,
      ...updates.metadata,
      updatedAt: new Date().toISOString(),
    },
  } as Contract;

  // Write back to same file
  const type = detectContractType(id);
  const dir = getTypeDir(type);
  const files = readdirSync(dir);
  const file = files.find(f => f.startsWith(id) && f.endsWith('.json'));

  if (file) {
    writeContract(updated, file);
  } else {
    writeContract(updated);
  }

  return updated;
}
