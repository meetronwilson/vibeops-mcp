/**
 * Feature Dependency Management Tools
 *
 * Specialized tools for managing feature dependencies in a conversational way
 */

import { readContract, writeContract } from '../lib/file-manager.js';
import { Feature } from '../types/contracts.js';
import { validateDependencies } from './critical-path.js';

// ============================================================================
// Type Definitions
// ============================================================================

export interface AddFeatureDependencyInput {
  featureId: string;
  dependsOnFeatureId: string;
  type: 'blocks' | 'requires' | 'related';
  reason?: string;
}

export interface RemoveFeatureDependencyInput {
  featureId: string;
  dependsOnFeatureId: string;
}

export interface UpdateFeatureDependenciesInput {
  featureId: string;
  dependencies: Array<{
    featureId: string;
    type: 'blocks' | 'requires' | 'related';
    reason?: string;
  }>;
  mode?: 'replace' | 'append';
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Add a dependency to a feature
 */
export function addFeatureDependency(input: AddFeatureDependencyInput): Feature {
  const { featureId, dependsOnFeatureId, type, reason } = input;

  // Validate feature exists
  const feature = readContract(featureId) as Feature;
  if (!feature) {
    throw new Error(`Feature ${featureId} not found`);
  }

  // Validate dependency feature exists
  try {
    readContract(dependsOnFeatureId);
  } catch (error) {
    throw new Error(`Dependency feature ${dependsOnFeatureId} not found`);
  }

  // Prevent self-dependency
  if (featureId === dependsOnFeatureId) {
    throw new Error(`Feature ${featureId} cannot depend on itself`);
  }

  // Initialize featureDependencies if not present
  if (!feature.featureDependencies) {
    feature.featureDependencies = [];
  }

  // Check if dependency already exists
  const existingIndex = feature.featureDependencies.findIndex(
    d => d.featureId === dependsOnFeatureId
  );

  if (existingIndex !== -1) {
    // Update existing dependency
    feature.featureDependencies[existingIndex] = {
      featureId: dependsOnFeatureId,
      type,
      reason,
    };
  } else {
    // Add new dependency
    feature.featureDependencies.push({
      featureId: dependsOnFeatureId,
      type,
      reason,
    });
  }

  // Update timestamp
  feature.metadata.updatedAt = new Date().toISOString();

  // Write updated feature
  writeContract(feature);

  // Validate to catch circular dependencies
  const validation = validateDependencies();
  if (!validation.isValid) {
    const circularError = validation.errors.find(e =>
      e.type === 'circular_dependency' && e.features.includes(featureId)
    );

    if (circularError) {
      throw new Error(
        `Adding this dependency would create a circular dependency: ${circularError.message}`
      );
    }
  }

  return feature;
}

/**
 * Remove a dependency from a feature
 */
export function removeFeatureDependency(input: RemoveFeatureDependencyInput): Feature {
  const { featureId, dependsOnFeatureId } = input;

  // Validate feature exists
  const feature = readContract(featureId) as Feature;
  if (!feature) {
    throw new Error(`Feature ${featureId} not found`);
  }

  // Check if feature has dependencies
  if (!feature.featureDependencies || feature.featureDependencies.length === 0) {
    throw new Error(`Feature ${featureId} has no dependencies to remove`);
  }

  // Find and remove the dependency
  const initialLength = feature.featureDependencies.length;
  feature.featureDependencies = feature.featureDependencies.filter(
    d => d.featureId !== dependsOnFeatureId
  );

  if (feature.featureDependencies.length === initialLength) {
    throw new Error(
      `Feature ${featureId} does not depend on ${dependsOnFeatureId}`
    );
  }

  // Update timestamp
  feature.metadata.updatedAt = new Date().toISOString();

  // Write updated feature
  writeContract(feature);

  return feature;
}

/**
 * Update all dependencies for a feature
 */
export function updateFeatureDependencies(input: UpdateFeatureDependenciesInput): Feature {
  const { featureId, dependencies, mode = 'replace' } = input;

  // Validate feature exists
  const feature = readContract(featureId) as Feature;
  if (!feature) {
    throw new Error(`Feature ${featureId} not found`);
  }

  // Validate all dependency features exist
  for (const dep of dependencies) {
    // Prevent self-dependency
    if (dep.featureId === featureId) {
      throw new Error(`Feature ${featureId} cannot depend on itself`);
    }

    // Check if dependency exists
    try {
      readContract(dep.featureId);
    } catch (error) {
      throw new Error(`Dependency feature ${dep.featureId} not found`);
    }
  }

  // Update dependencies based on mode
  if (mode === 'replace') {
    feature.featureDependencies = dependencies;
  } else if (mode === 'append') {
    // Initialize if not present
    if (!feature.featureDependencies) {
      feature.featureDependencies = [];
    }

    // Append new dependencies, avoiding duplicates
    for (const dep of dependencies) {
      const existingIndex = feature.featureDependencies.findIndex(
        d => d.featureId === dep.featureId
      );

      if (existingIndex !== -1) {
        // Update existing
        feature.featureDependencies[existingIndex] = dep;
      } else {
        // Add new
        feature.featureDependencies.push(dep);
      }
    }
  }

  // Update timestamp
  feature.metadata.updatedAt = new Date().toISOString();

  // Write updated feature
  writeContract(feature);

  // Validate to catch circular dependencies
  const validation = validateDependencies();
  if (!validation.isValid) {
    const circularError = validation.errors.find(e =>
      e.type === 'circular_dependency' && e.features.includes(featureId)
    );

    if (circularError) {
      throw new Error(
        `These dependencies would create a circular dependency: ${circularError.message}`
      );
    }
  }

  return feature;
}

/**
 * Get all dependencies for a feature (convenience function)
 */
export function getFeatureDependencies(featureId: string): {
  feature: Feature;
  dependencies: Array<{
    featureId: string;
    type: 'blocks' | 'requires' | 'related';
    reason?: string;
  }>;
  dependencyCount: number;
} {
  const feature = readContract(featureId) as Feature;
  if (!feature) {
    throw new Error(`Feature ${featureId} not found`);
  }

  const dependencies = feature.featureDependencies || [];

  return {
    feature: {
      id: feature.id,
      name: feature.name,
      status: feature.status,
    } as Feature,
    dependencies,
    dependencyCount: dependencies.length,
  };
}
