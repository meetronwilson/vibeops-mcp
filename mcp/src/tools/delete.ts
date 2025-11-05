/**
 * DELETE Operations
 *
 * Tools for deleting and archiving contracts safely
 */

import { readContract, deleteContract, writeContract, contractExists } from '../lib/file-manager.js';
import type { Module, Feature, Issue } from '../types/contracts.js';

/**
 * Delete a module
 */
export interface DeleteModuleInput {
  id: string;
  force?: boolean; // If true, delete even if has features
  cascade?: boolean; // If true, also delete all features and issues
}

export interface DeleteResult {
  deleted: string[];
  warnings?: string[];
}

export function deleteModule(input: DeleteModuleInput): DeleteResult {
  if (!contractExists(input.id)) {
    throw new Error(`Module ${input.id} does not exist`);
  }

  const module = readContract(input.id) as Module;
  const result: DeleteResult = {
    deleted: [],
    warnings: [],
  };

  // Check if module has features
  if (module.features.length > 0 && !input.force && !input.cascade) {
    throw new Error(
      `Cannot delete module ${input.id}: it has ${module.features.length} feature(s). ` +
      `Use force=true to delete anyway, or cascade=true to delete all features and issues.`
    );
  }

  // If cascade, delete all features and their issues
  if (input.cascade) {
    for (const featureId of module.features) {
      if (contractExists(featureId)) {
        const featureResult = deleteFeature({ id: featureId, cascade: true });
        result.deleted.push(...featureResult.deleted);
        if (featureResult.warnings) {
          result.warnings?.push(...featureResult.warnings);
        }
      }
    }
  } else if (input.force && module.features.length > 0) {
    result.warnings?.push(
      `Module ${input.id} deleted but ${module.features.length} feature(s) remain orphaned: ${module.features.join(', ')}`
    );
  }

  // Delete the module
  deleteContract(input.id);
  result.deleted.push(input.id);

  return result;
}

/**
 * Delete a feature
 */
export interface DeleteFeatureInput {
  id: string;
  force?: boolean; // If true, delete even if has issues
  cascade?: boolean; // If true, also delete all issues
}

export function deleteFeature(input: DeleteFeatureInput): DeleteResult {
  if (!contractExists(input.id)) {
    throw new Error(`Feature ${input.id} does not exist`);
  }

  const feature = readContract(input.id) as Feature;
  const result: DeleteResult = {
    deleted: [],
    warnings: [],
  };

  // Check if feature has issues
  if (feature.issues.length > 0 && !input.force && !input.cascade) {
    throw new Error(
      `Cannot delete feature ${input.id}: it has ${feature.issues.length} issue(s). ` +
      `Use force=true to delete anyway, or cascade=true to delete all issues.`
    );
  }

  // If cascade, delete all issues
  if (input.cascade) {
    for (const issueId of feature.issues) {
      if (contractExists(issueId)) {
        const issueResult = deleteIssue({ id: issueId });
        result.deleted.push(...issueResult.deleted);
      }
    }
  } else if (input.force && feature.issues.length > 0) {
    result.warnings?.push(
      `Feature ${input.id} deleted but ${feature.issues.length} issue(s) remain orphaned: ${feature.issues.join(', ')}`
    );
  }

  // Remove feature from parent module
  if (contractExists(feature.moduleId)) {
    const module = readContract(feature.moduleId) as Module;
    module.features = module.features.filter(fid => fid !== input.id);
    module.metadata.updatedAt = new Date().toISOString();
    writeContract(module);
  }

  // Delete the feature
  deleteContract(input.id);
  result.deleted.push(input.id);

  return result;
}

/**
 * Delete an issue
 */
export interface DeleteIssueInput {
  id: string;
}

export function deleteIssue(input: DeleteIssueInput): DeleteResult {
  if (!contractExists(input.id)) {
    throw new Error(`Issue ${input.id} does not exist`);
  }

  const issue = readContract(input.id) as Issue;
  const result: DeleteResult = {
    deleted: [],
  };

  // Remove issue from parent feature
  if (contractExists(issue.featureId)) {
    const feature = readContract(issue.featureId) as Feature;
    feature.issues = feature.issues.filter(iid => iid !== input.id);
    feature.metadata.updatedAt = new Date().toISOString();
    writeContract(feature);
  }

  // Delete the issue
  deleteContract(input.id);
  result.deleted.push(input.id);

  return result;
}

/**
 * Archive a contract (soft delete by changing status)
 */
export function archiveItem(id: string) {
  if (!contractExists(id)) {
    throw new Error(`Contract ${id} does not exist`);
  }

  const contract = readContract(id);

  // Set status to archived/cancelled based on type
  let archivedStatus: string;
  if (id.startsWith('MOD-')) {
    archivedStatus = 'archived';
  } else if (id.startsWith('FEAT-')) {
    archivedStatus = 'cancelled';
  } else if (id.startsWith('STORY-')) {
    archivedStatus = 'done'; // User stories don't have archived, use done
  } else if (id.startsWith('BUG-')) {
    archivedStatus = 'closed';
  } else if (id.startsWith('DEBT-')) {
    archivedStatus = 'deferred';
  } else if (id.startsWith('SPIKE-')) {
    archivedStatus = 'abandoned';
  } else {
    throw new Error(`Unknown contract type for ${id}`);
  }

  const updated = {
    ...contract,
    status: archivedStatus,
    metadata: {
      ...contract.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated as any);
  return updated;
}
