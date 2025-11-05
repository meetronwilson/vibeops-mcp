/**
 * ID Generator
 *
 * Scans existing contracts and generates next available IDs.
 * Ensures unique IDs across the system.
 */

import { listContracts } from './file-manager.js';
import type { ContractType } from '../types/contracts.js';

/**
 * Get the ID prefix for a contract type
 */
export function getIdPrefix(type: ContractType): string {
  const prefixMap: Record<ContractType, string> = {
    'module': 'MOD',
    'feature': 'FEAT',
    'user-story': 'STORY',
    'bug': 'BUG',
    'tech-debt': 'DEBT',
    'spike': 'SPIKE',
  };

  return prefixMap[type];
}

/**
 * Extract numeric part from an ID
 * e.g., "MOD-0005" → 5
 */
export function extractIdNumber(id: string): number {
  const match = id.match(/-(\d+)$/);
  if (!match) {
    throw new Error(`Invalid ID format: ${id}`);
  }
  return parseInt(match[1], 10);
}

/**
 * Get the highest ID number for a given type
 */
export function getHighestId(type: ContractType): number {
  const contracts = listContracts(type);

  if (contracts.length === 0) {
    return 0;
  }

  const numbers = contracts.map(c => extractIdNumber(c.id));
  return Math.max(...numbers);
}

/**
 * Generate the next available ID for a contract type
 */
export function generateNextId(type: ContractType): string {
  const prefix = getIdPrefix(type);
  const highest = getHighestId(type);
  const next = highest + 1;

  // Format with leading zeros (4 digits)
  const formatted = next.toString().padStart(4, '0');

  return `${prefix}-${formatted}`;
}

/**
 * Validate ID format
 */
export function validateIdFormat(id: string): boolean {
  const patterns: Record<string, RegExp> = {
    'MOD': /^MOD-\d{4}$/,
    'FEAT': /^FEAT-\d{4}$/,
    'STORY': /^STORY-\d{4}$/,
    'BUG': /^BUG-\d{4}$/,
    'DEBT': /^DEBT-\d{4}$/,
    'SPIKE': /^SPIKE-\d{4}$/,
    'MEM': /^MEM-\d{4}$/,
  };

  for (const [prefix, pattern] of Object.entries(patterns)) {
    if (id.startsWith(prefix)) {
      return pattern.test(id);
    }
  }

  return false;
}

/**
 * Get all existing IDs of a given type
 */
export function getAllIds(type: ContractType): string[] {
  const contracts = listContracts(type);
  return contracts.map(c => c.id).sort();
}

/**
 * Get contract counts by type
 */
export function getContractCounts(): Record<ContractType, number> {
  const types: ContractType[] = ['module', 'feature', 'user-story', 'bug', 'tech-debt', 'spike'];

  const counts = {} as Record<ContractType, number>;

  for (const type of types) {
    counts[type] = listContracts(type).length;
  }

  return counts;
}

/**
 * Generate ID for memory or other non-contract types
 * e.g., generateId('MEM') → 'MEM-0001'
 */
export function generateId(prefix: string): string {
  const { listAllContracts } = require('./file-manager.js');
  const allContracts = listAllContracts();

  // Find all IDs with this prefix
  const matchingIds = allContracts
    .filter((c: any) => c.id.startsWith(prefix + '-'))
    .map((c: any) => extractIdNumber(c.id));

  const highest = matchingIds.length > 0 ? Math.max(...matchingIds) : 0;
  const next = highest + 1;

  // Format with leading zeros (4 digits)
  const formatted = next.toString().padStart(4, '0');

  return `${prefix}-${formatted}`;
}
