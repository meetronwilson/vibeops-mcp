/**
 * Feature Overlap Detection Tool
 *
 * Analyzes potential overlaps between features based on:
 * - Capability tag overlap
 * - Semantic similarity in problem statements
 * - Scope collision detection
 * - Target user overlap
 * - Out-of-scope conflicts
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface FeatureContract {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  capabilityTags?: string[];
  targetUsers?: string[];
  relatedFeatures?: Array<{
    featureId: string;
    relationship: string;
    description: string;
  }>;
  prd: {
    problemStatement: string;
    scope: {
      inScope: string[];
      outOfScope: string[];
    };
  };
}

interface OverlapResult {
  featureId: string;
  featureName: string;
  severity: 'high' | 'medium' | 'low';
  reasons: string[];
  recommendations: string[];
  details: {
    tagOverlap?: string[];
    similarityScore?: number;
    scopeConflicts?: string[];
    userOverlap?: string[];
  };
}

interface CheckOverlapInput {
  featureId?: string;  // For updates to existing features
  name?: string;
  problemStatement: string;
  capabilityTags: string[];
  targetUsers: string[];
  inScope: string[];
  outOfScope?: string[];
  moduleId?: string;
}

/**
 * Calculate semantic similarity between two text strings
 * Uses simple word overlap for now - can be enhanced with NLP
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Check for scope conflicts between features
 */
function findScopeConflicts(
  proposedInScope: string[],
  proposedOutOfScope: string[],
  existingFeature: FeatureContract
): string[] {
  const conflicts: string[] = [];

  // Check if proposed in-scope items are in another feature's out-of-scope
  for (const item of proposedInScope) {
    for (const existingOutScope of existingFeature.prd.scope.outOfScope) {
      if (item.toLowerCase().includes(existingOutScope.toLowerCase()) ||
          existingOutScope.toLowerCase().includes(item.toLowerCase())) {
        conflicts.push(`"${item}" conflicts with ${existingFeature.id}'s out-of-scope: "${existingOutScope}"`);
      }
    }
  }

  // Check if proposed out-of-scope items are in another feature's in-scope
  for (const item of proposedOutOfScope) {
    for (const existingInScope of existingFeature.prd.scope.inScope) {
      if (item.toLowerCase().includes(existingInScope.toLowerCase()) ||
          existingInScope.toLowerCase().includes(item.toLowerCase())) {
        conflicts.push(`Out-of-scope "${item}" conflicts with ${existingFeature.id}'s in-scope: "${existingInScope}"`);
      }
    }
  }

  return conflicts;
}

/**
 * Main overlap checking function
 */
export async function checkFeatureOverlap(
  input: CheckOverlapInput,
  featuresDir: string
): Promise<OverlapResult[]> {
  const results: OverlapResult[] = [];

  // Read all existing features
  const files = await fs.readdir(featuresDir);
  const featureFiles = files.filter(f => f.endsWith('.json') && f.startsWith('FEAT-'));

  for (const file of featureFiles) {
    const filePath = path.join(featuresDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const existingFeature: FeatureContract = JSON.parse(content);

    // Skip if checking against itself
    if (input.featureId && existingFeature.id === input.featureId) {
      continue;
    }

    const reasons: string[] = [];
    const details: OverlapResult['details'] = {};
    let severity: 'high' | 'medium' | 'low' = 'low';

    // 1. Check capability tag overlap
    if (input.capabilityTags && existingFeature.capabilityTags) {
      const tagOverlap = input.capabilityTags.filter(tag =>
        existingFeature.capabilityTags!.includes(tag)
      );

      if (tagOverlap.length > 0) {
        details.tagOverlap = tagOverlap;
        reasons.push(`Shares ${tagOverlap.length} capability tag(s): ${tagOverlap.join(', ')}`);

        if (tagOverlap.length >= 3) {
          severity = 'high';
        } else if (tagOverlap.length >= 2) {
          severity = severity === 'low' ? 'medium' : severity;
        }
      }
    }

    // 2. Check semantic similarity in problem statements
    const similarity = calculateSimilarity(
      input.problemStatement,
      existingFeature.prd.problemStatement
    );

    if (similarity > 0.3) {
      details.similarityScore = Math.round(similarity * 100);
      reasons.push(`${Math.round(similarity * 100)}% problem statement similarity`);

      if (similarity > 0.6) {
        severity = 'high';
      } else if (similarity > 0.4) {
        severity = severity === 'low' ? 'medium' : severity;
      }
    }

    // 3. Check target user overlap
    if (input.targetUsers && existingFeature.targetUsers) {
      const userOverlap = input.targetUsers.filter(user =>
        existingFeature.targetUsers!.some(eu =>
          eu.toLowerCase() === user.toLowerCase()
        )
      );

      if (userOverlap.length > 0) {
        details.userOverlap = userOverlap;
        reasons.push(`Targets same users: ${userOverlap.join(', ')}`);

        if (userOverlap.length > 0 && severity === 'high') {
          // Already high, keep it high
        } else if (userOverlap.length > 0) {
          severity = severity === 'low' ? 'medium' : severity;
        }
      }
    }

    // 4. Check scope conflicts
    const scopeConflicts = findScopeConflicts(
      input.inScope,
      input.outOfScope || [],
      existingFeature
    );

    if (scopeConflicts.length > 0) {
      details.scopeConflicts = scopeConflicts;
      reasons.push(...scopeConflicts);
      severity = 'high'; // Scope conflicts are always high severity
    }

    // 5. Check if in same module (increases severity)
    if (input.moduleId && existingFeature.moduleId === input.moduleId && reasons.length > 0) {
      reasons.push(`Both in module ${input.moduleId}`);
      if (severity === 'medium') severity = 'high';
    }

    // Only add to results if there's actual overlap
    if (reasons.length > 0) {
      const recommendations: string[] = [];

      // Generate recommendations based on severity and overlap type
      if (severity === 'high') {
        if (details.scopeConflicts && details.scopeConflicts.length > 0) {
          recommendations.push(`⚠️ CRITICAL: Scope conflict detected. Review boundaries between features.`);
          recommendations.push(`Consider: Is this truly a new feature or an extension of ${existingFeature.id}?`);
        }

        if (details.tagOverlap && details.tagOverlap.length >= 3) {
          recommendations.push(`High capability overlap suggests these features may be too similar.`);
          recommendations.push(`Options: 1) Merge into ${existingFeature.id}, 2) Define clear differentiation, 3) Create as sub-feature`);
        }

        if ((details.similarityScore || 0) > 60) {
          recommendations.push(`Problem statements are very similar. Consider if this addresses the same problem differently.`);
          recommendations.push(`If solving same problem: Enhance ${existingFeature.id} instead of creating new feature.`);
        }
      } else if (severity === 'medium') {
        recommendations.push(`Moderate overlap detected. Establish explicit relationship.`);
        recommendations.push(`Add relatedFeatures entry linking to ${existingFeature.id} with appropriate relationship type.`);
        recommendations.push(`Clearly document in outOfScope what differentiates this from ${existingFeature.id}.`);
      } else {
        recommendations.push(`Low overlap. Features likely complement each other.`);
        recommendations.push(`Consider adding relatedFeatures entry if there's data dependency.`);
      }

      results.push({
        featureId: existingFeature.id,
        featureName: existingFeature.name,
        severity,
        reasons,
        recommendations,
        details
      });
    }
  }

  // Sort by severity (high first)
  results.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return results;
}

/**
 * Format overlap results for display
 */
export function formatOverlapResults(results: OverlapResult[]): string {
  if (results.length === 0) {
    return '✅ No overlaps detected. Feature appears unique.';
  }

  let output = `⚠️  Potential overlaps detected with ${results.length} feature(s):\n\n`;

  const highPriority = results.filter(r => r.severity === 'high');
  const mediumPriority = results.filter(r => r.severity === 'medium');
  const lowPriority = results.filter(r => r.severity === 'low');

  if (highPriority.length > 0) {
    output += '🔴 HIGH PRIORITY OVERLAPS:\n';
    for (const result of highPriority) {
      output += `\n${result.featureId} (${result.featureName})\n`;
      output += result.reasons.map(r => `  • ${r}`).join('\n') + '\n';
      output += '\nRecommendations:\n';
      output += result.recommendations.map(r => `  → ${r}`).join('\n') + '\n';
    }
    output += '\n';
  }

  if (mediumPriority.length > 0) {
    output += '🟡 MEDIUM PRIORITY OVERLAPS:\n';
    for (const result of mediumPriority) {
      output += `\n${result.featureId} (${result.featureName})\n`;
      output += result.reasons.map(r => `  • ${r}`).join('\n') + '\n';
      output += '\nRecommendations:\n';
      output += result.recommendations.map(r => `  → ${r}`).join('\n') + '\n';
    }
    output += '\n';
  }

  if (lowPriority.length > 0) {
    output += '🟢 LOW PRIORITY (Informational):\n';
    for (const result of lowPriority) {
      output += `\n${result.featureId} (${result.featureName})\n`;
      output += result.reasons.map(r => `  • ${r}`).join('\n') + '\n';
    }
  }

  return output;
}
