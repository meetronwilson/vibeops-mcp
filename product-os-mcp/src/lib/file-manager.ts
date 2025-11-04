/**
 * File Manager
 *
 * Handles reading and writing contract files from the filesystem.
 * Works with the existing contract directory structure.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, basename } from 'path';
import { mkdirSync } from 'fs';
import type { Contract, ContractType, ContractFile } from '../types/contracts.js';

/**
 * Get the base contracts directory
 * Looks for contracts/ in current working directory
 */
export function getContractsDir(): string {
  const cwd = process.cwd();
  const contractsDir = join(cwd, 'contracts');

  if (!existsSync(contractsDir)) {
    throw new Error(`Contracts directory not found at: ${contractsDir}`);
  }

  return contractsDir;
}

/**
 * Get subdirectory for a contract type
 */
export function getTypeDir(type: ContractType): string {
  const contractsDir = getContractsDir();

  const typeDirMap: Record<ContractType, string> = {
    'module': join(contractsDir, '../test/modules'), // TODO: Change to production path
    'feature': join(contractsDir, '../test/features'),
    'user-story': join(contractsDir, '../test/issues'),
    'bug': join(contractsDir, '../test/issues'),
    'tech-debt': join(contractsDir, '../test/issues'),
    'spike': join(contractsDir, '../test/issues'),
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
