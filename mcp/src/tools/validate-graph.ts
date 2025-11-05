/**
 * Feature Dependency Graph Validation Tool
 *
 * Validates the entire feature dependency graph for:
 * - Circular dependencies
 * - Missing feature references
 * - Orphaned features (no relationships)
 * - Data contract consistency
 * - Module boundary violations
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface FeatureContract {
  id: string;
  name: string;
  moduleId: string;
  capabilityTags?: string[];
  relatedFeatures?: Array<{
    featureId: string;
    relationship: string;
    description: string;
  }>;
  dataContract?: {
    consumes?: Array<{
      sourceFeature?: string;
      dataType: string;
      required?: boolean;
    }>;
    produces?: Array<{
      dataType: string;
      consumers?: string[];
    }>;
  };
}

interface ModuleContract {
  id: string;
  name: string;
  features: string[];
  relatedModules?: Array<{
    moduleId: string;
    relationship: string;
    integrationPoints?: Array<{
      fromFeature: string;
      toFeature: string;
    }>;
  }>;
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  featureId?: string;
  message: string;
  recommendation?: string;
}

interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  statistics: {
    totalFeatures: number;
    totalModules: number;
    featuresWithRelationships: number;
    featuresWithDataContracts: number;
    orphanedFeatures: number;
    circularDependencies: number;
  };
}

/**
 * Detect circular dependencies using DFS
 */
function detectCircularDependencies(
  features: Map<string, FeatureContract>
): Array<string[]> {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: Array<string[]> = [];

  function dfs(featureId: string, path: string[]): void {
    visited.add(featureId);
    recursionStack.add(featureId);
    path.push(featureId);

    const feature = features.get(featureId);
    if (!feature || !feature.relatedFeatures) {
      recursionStack.delete(featureId);
      return;
    }

    for (const rel of feature.relatedFeatures) {
      if (rel.relationship === 'depends-on' || rel.relationship === 'blocks') {
        if (recursionStack.has(rel.featureId)) {
          // Found a cycle
          const cycleStart = path.indexOf(rel.featureId);
          cycles.push([...path.slice(cycleStart), rel.featureId]);
        } else if (!visited.has(rel.featureId)) {
          dfs(rel.featureId, [...path]);
        }
      }
    }

    recursionStack.delete(featureId);
  }

  for (const featureId of features.keys()) {
    if (!visited.has(featureId)) {
      dfs(featureId, []);
    }
  }

  return cycles;
}

/**
 * Validate data contract consistency
 */
function validateDataContracts(
  features: Map<string, FeatureContract>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [featureId, feature] of features.entries()) {
    if (!feature.dataContract) continue;

    // Check if consumed data sources exist
    if (feature.dataContract.consumes) {
      for (const consume of feature.dataContract.consumes) {
        if (consume.sourceFeature) {
          if (!features.has(consume.sourceFeature)) {
            issues.push({
              type: 'error',
              category: 'data-contract',
              featureId,
              message: `Consumes data from non-existent feature: ${consume.sourceFeature}`,
              recommendation: `Either create ${consume.sourceFeature} or update data contract to reference correct source`
            });
          } else {
            // Check if source actually produces this data
            const sourceFeature = features.get(consume.sourceFeature)!;
            const produces = sourceFeature.dataContract?.produces?.some(p =>
              p.dataType === consume.dataType
            );

            if (!produces) {
              issues.push({
                type: 'warning',
                category: 'data-contract',
                featureId,
                message: `${consume.sourceFeature} doesn't explicitly produce "${consume.dataType}"`,
                recommendation: `Update ${consume.sourceFeature}'s data contract to list "${consume.dataType}" in produces`
              });
            }
          }
        }
      }
    }

    // Check if produced data consumers exist
    if (feature.dataContract.produces) {
      for (const produce of feature.dataContract.produces) {
        if (produce.consumers) {
          for (const consumerId of produce.consumers) {
            if (!features.has(consumerId)) {
              issues.push({
                type: 'warning',
                category: 'data-contract',
                featureId,
                message: `Lists non-existent consumer: ${consumerId}`,
                recommendation: `Remove ${consumerId} from consumers or create the feature`
              });
            } else {
              // Check if consumer actually consumes this data
              const consumer = features.get(consumerId)!;
              const consumes = consumer.dataContract?.consumes?.some(c =>
                c.sourceFeature === featureId && c.dataType === produce.dataType
              );

              if (!consumes) {
                issues.push({
                  type: 'info',
                  category: 'data-contract',
                  featureId,
                  message: `${consumerId} doesn't explicitly consume "${produce.dataType}"`,
                  recommendation: `Update ${consumerId}'s data contract to list consumption of "${produce.dataType}"`
                });
              }
            }
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Validate module boundaries
 */
function validateModuleBoundaries(
  features: Map<string, FeatureContract>,
  modules: Map<string, ModuleContract>
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const [featureId, feature] of features.entries()) {
    if (!feature.relatedFeatures) continue;

    for (const rel of feature.relatedFeatures) {
      const relatedFeature = features.get(rel.featureId);
      if (!relatedFeature) continue;

      // Check if cross-module relationship is documented at module level
      if (feature.moduleId !== relatedFeature.moduleId) {
        const module = modules.get(feature.moduleId);
        if (module && module.relatedModules) {
          const hasModuleRelation = module.relatedModules.some(rm =>
            rm.moduleId === relatedFeature.moduleId
          );

          if (!hasModuleRelation) {
            issues.push({
              type: 'warning',
              category: 'module-boundary',
              featureId,
              message: `Cross-module relationship with ${rel.featureId} not documented at module level`,
              recommendation: `Add relatedModules entry in ${feature.moduleId} linking to ${relatedFeature.moduleId}`
            });
          } else {
            // Check if integration point is documented
            const moduleRel = module.relatedModules.find(rm =>
              rm.moduleId === relatedFeature.moduleId
            );
            const hasIntegrationPoint = moduleRel?.integrationPoints?.some(ip =>
              (ip.fromFeature === featureId && ip.toFeature === rel.featureId) ||
              (ip.toFeature === featureId && ip.fromFeature === rel.featureId)
            );

            if (!hasIntegrationPoint) {
              issues.push({
                type: 'info',
                category: 'module-boundary',
                featureId,
                message: `Cross-module integration point not documented: ${featureId} ↔ ${rel.featureId}`,
                recommendation: `Add integration point in ${feature.moduleId}'s relatedModules`
              });
            }
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Main validation function
 */
export async function validateFeatureGraph(
  featuresDir: string,
  modulesDir: string
): Promise<ValidationResult> {
  const issues: ValidationIssue[] = [];
  const features = new Map<string, FeatureContract>();
  const modules = new Map<string, ModuleContract>();

  // Load all features
  const featureFiles = await fs.readdir(featuresDir);
  for (const file of featureFiles.filter(f => f.endsWith('.json') && f.startsWith('FEAT-'))) {
    const content = await fs.readFile(path.join(featuresDir, file), 'utf-8');
    const feature: FeatureContract = JSON.parse(content);
    features.set(feature.id, feature);
  }

  // Load all modules
  try {
    const moduleFiles = await fs.readdir(modulesDir);
    for (const file of moduleFiles.filter(f => f.endsWith('.json') && f.startsWith('MOD-'))) {
      const content = await fs.readFile(path.join(modulesDir, file), 'utf-8');
      const module: ModuleContract = JSON.parse(content);
      modules.set(module.id, module);
    }
  } catch (err) {
    issues.push({
      type: 'warning',
      category: 'system',
      message: 'Could not load modules directory. Module-level validation skipped.',
    });
  }

  // 1. Check for missing feature references
  for (const [featureId, feature] of features.entries()) {
    if (feature.relatedFeatures) {
      for (const rel of feature.relatedFeatures) {
        if (!features.has(rel.featureId)) {
          issues.push({
            type: 'error',
            category: 'missing-reference',
            featureId,
            message: `References non-existent feature: ${rel.featureId}`,
            recommendation: `Remove reference or create ${rel.featureId}`
          });
        }
      }
    }
  }

  // 2. Detect circular dependencies
  const cycles = detectCircularDependencies(features);
  for (const cycle of cycles) {
    issues.push({
      type: 'error',
      category: 'circular-dependency',
      message: `Circular dependency detected: ${cycle.join(' → ')}`,
      recommendation: 'Break the cycle by changing one of the dependencies to "complements" or "integrates-with"'
    });
  }

  // 3. Find orphaned features (no relationships at all)
  const orphanedFeatures: string[] = [];
  for (const [featureId, feature] of features.entries()) {
    const hasOutgoing = feature.relatedFeatures && feature.relatedFeatures.length > 0;
    const hasIncoming = Array.from(features.values()).some(f =>
      f.relatedFeatures?.some(rel => rel.featureId === featureId)
    );
    const hasDataContract = feature.dataContract &&
      ((feature.dataContract.consumes && feature.dataContract.consumes.length > 0) ||
       (feature.dataContract.produces && feature.dataContract.produces.length > 0));

    if (!hasOutgoing && !hasIncoming && !hasDataContract) {
      orphanedFeatures.push(featureId);
      issues.push({
        type: 'info',
        category: 'orphaned-feature',
        featureId,
        message: `Feature has no relationships with other features`,
        recommendation: 'Consider if this feature depends on or relates to any existing features'
      });
    }
  }

  // 4. Validate data contracts
  issues.push(...validateDataContracts(features));

  // 5. Validate module boundaries
  issues.push(...validateModuleBoundaries(features, modules));

  // 6. Check for asymmetric relationships
  for (const [featureId, feature] of features.entries()) {
    if (feature.relatedFeatures) {
      for (const rel of feature.relatedFeatures) {
        const relatedFeature = features.get(rel.featureId);
        if (relatedFeature && relatedFeature.relatedFeatures) {
          const reverseRel = relatedFeature.relatedFeatures.find(r =>
            r.featureId === featureId
          );

          // Relationships that should be symmetric
          const symmetricRelationships = ['integrates-with', 'complements'];
          if (symmetricRelationships.includes(rel.relationship) && !reverseRel) {
            issues.push({
              type: 'warning',
              category: 'asymmetric-relationship',
              featureId,
              message: `${rel.relationship} with ${rel.featureId} is not reciprocated`,
              recommendation: `Add reciprocal ${rel.relationship} entry in ${rel.featureId}`
            });
          }

          // Check for matching inverse relationships
          const inverseMap: Record<string, string> = {
            'depends-on': 'blocks',
            'blocks': 'depends-on',
            'provides-data-to': 'consumes-data-from',
            'consumes-data-from': 'provides-data-to'
          };

          if (rel.relationship in inverseMap) {
            const expectedInverse = inverseMap[rel.relationship];
            if (reverseRel && reverseRel.relationship !== expectedInverse) {
              issues.push({
                type: 'info',
                category: 'relationship-mismatch',
                featureId,
                message: `Relationship mismatch: ${featureId} ${rel.relationship} ${rel.featureId}, but ${rel.featureId} ${reverseRel.relationship} ${featureId}`,
                recommendation: `Expected ${expectedInverse} relationship in ${rel.featureId}`
              });
            }
          }
        }
      }
    }
  }

  // Calculate statistics
  const featuresWithRelationships = Array.from(features.values()).filter(f =>
    f.relatedFeatures && f.relatedFeatures.length > 0
  ).length;

  const featuresWithDataContracts = Array.from(features.values()).filter(f =>
    f.dataContract && (
      (f.dataContract.consumes && f.dataContract.consumes.length > 0) ||
      (f.dataContract.produces && f.dataContract.produces.length > 0)
    )
  ).length;

  return {
    valid: issues.filter(i => i.type === 'error').length === 0,
    issues: issues.sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2 };
      return order[a.type] - order[b.type];
    }),
    statistics: {
      totalFeatures: features.size,
      totalModules: modules.size,
      featuresWithRelationships,
      featuresWithDataContracts,
      orphanedFeatures: orphanedFeatures.length,
      circularDependencies: cycles.length
    }
  };
}

/**
 * Format validation results for display
 */
export function formatValidationResults(result: ValidationResult): string {
  let output = '# Feature Graph Validation Report\n\n';

  // Statistics
  output += '## Statistics\n\n';
  output += `- Total Features: ${result.statistics.totalFeatures}\n`;
  output += `- Total Modules: ${result.statistics.totalModules}\n`;
  output += `- Features with Relationships: ${result.statistics.featuresWithRelationships} (${Math.round(result.statistics.featuresWithRelationships / result.statistics.totalFeatures * 100)}%)\n`;
  output += `- Features with Data Contracts: ${result.statistics.featuresWithDataContracts} (${Math.round(result.statistics.featuresWithDataContracts / result.statistics.totalFeatures * 100)}%)\n`;
  output += `- Orphaned Features: ${result.statistics.orphanedFeatures}\n`;
  output += `- Circular Dependencies: ${result.statistics.circularDependencies}\n\n`;

  // Overall status
  if (result.valid) {
    output += '✅ **VALIDATION PASSED** - No critical errors found.\n\n';
  } else {
    output += '❌ **VALIDATION FAILED** - Critical errors must be resolved.\n\n';
  }

  // Issues by severity
  const errors = result.issues.filter(i => i.type === 'error');
  const warnings = result.issues.filter(i => i.type === 'warning');
  const infos = result.issues.filter(i => i.type === 'info');

  if (errors.length > 0) {
    output += `## 🔴 Errors (${errors.length})\n\n`;
    for (const issue of errors) {
      output += `### ${issue.featureId || 'System'} - ${issue.category}\n`;
      output += `**Issue:** ${issue.message}\n`;
      if (issue.recommendation) {
        output += `**Fix:** ${issue.recommendation}\n`;
      }
      output += '\n';
    }
  }

  if (warnings.length > 0) {
    output += `## 🟡 Warnings (${warnings.length})\n\n`;
    for (const issue of warnings) {
      output += `### ${issue.featureId || 'System'} - ${issue.category}\n`;
      output += `**Issue:** ${issue.message}\n`;
      if (issue.recommendation) {
        output += `**Recommendation:** ${issue.recommendation}\n`;
      }
      output += '\n';
    }
  }

  if (infos.length > 0) {
    output += `## ℹ️  Informational (${infos.length})\n\n`;
    for (const issue of infos) {
      output += `- ${issue.featureId || 'System'}: ${issue.message}\n`;
    }
  }

  return output;
}
