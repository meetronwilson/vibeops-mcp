/**
 * Critical Path Analysis Tools
 *
 * Tools for analyzing feature dependencies and recommending work priorities
 */

import { listFeatures } from './read.js';
import {
  buildDependencyGraph,
  detectCycles,
  topologicalSort,
  calculateDepths,
  findLongestPath,
  getReadyFeatures,
  getBlockedFeatures,
  countBlockedFeatures,
} from '../lib/graph-utils.js';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CalculateCriticalPathInput {
  targetFeatureId: string;
}

export interface CriticalPathResult {
  targetFeature: {
    id: string;
    name: string;
    status: string;
  };
  criticalPath: Array<{
    featureId: string;
    name: string;
    status: string;
    blocksCount: number;
  }>;
  totalPathLength: number;
  parallelWorkAvailable: Array<{
    featureId: string;
    name: string;
    reason: string;
  }>;
  blockedFeatures: Array<{
    featureId: string;
    name: string;
    waitingOn: string[];
  }>;
  recommendations: string[];
}

export interface WorkFilters {
  moduleId?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  maxResults?: number;
}

export interface NextFeatureResult {
  readyToStart: Array<{
    featureId: string;
    name: string;
    moduleId: string;
    priority: string;
    blocksCount: number;
    reason: string;
  }>;
  blockedFeatures: Array<{
    featureId: string;
    name: string;
    waitingOn: string[];
  }>;
  inProgress: Array<{
    featureId: string;
    name: string;
    unblocks: string[];
  }>;
  recommendations: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Array<{
    type: 'circular_dependency' | 'invalid_reference' | 'self_dependency';
    message: string;
    features: string[];
    details?: string;
  }>;
  warnings: Array<{
    type: 'orphaned_feature' | 'multiple_paths' | 'deep_nesting';
    message: string;
    features: string[];
  }>;
}

export interface GraphOptions {
  moduleId?: string;
  highlightCriticalPath?: string;
  includeCompleted?: boolean;
  format?: 'mermaid' | 'json';
}

export interface DependencyGraphResult {
  format: string;
  content: string;
  features: number;
  dependencies: number;
  criticalPathHighlighted: boolean;
}

// ============================================================================
// Main Functions
// ============================================================================

/**
 * Calculate critical path to reach a target feature
 */
export function calculateCriticalPath(input: CalculateCriticalPathInput): CriticalPathResult {
  const targetId = input.targetFeatureId;

  // Load all features
  const allFeatures = listFeatures({});
  const graph = buildDependencyGraph(allFeatures);

  // Validate target exists
  const targetNode = graph.get(targetId);
  if (!targetNode) {
    throw new Error(`Feature ${targetId} not found`);
  }

  // Calculate depths
  calculateDepths(graph);

  // Find critical path
  const criticalPath = findLongestPath(targetId, graph);

  // Get blocked features
  const blockedMap = getBlockedFeatures(graph);

  // Find parallel work opportunities
  const readyFeatures = getReadyFeatures(graph);
  const parallelWork = readyFeatures
    .filter(id => !criticalPath.includes(id) && id !== targetId)
    .map(id => {
      const node = graph.get(id)!;
      return {
        featureId: id,
        name: node.feature.name,
        reason: `Can be worked on in parallel (no dependencies on critical path)`,
      };
    });

  // Build result
  const pathDetails = criticalPath.map(id => {
    const node = graph.get(id)!;
    return {
      featureId: id,
      name: node.feature.name,
      status: node.feature.status,
      blocksCount: countBlockedFeatures(id, graph),
    };
  });

  const blockedDetails = Array.from(blockedMap.entries()).map(([id, deps]) => {
    const node = graph.get(id)!;
    return {
      featureId: id,
      name: node.feature.name,
      waitingOn: deps,
    };
  });

  // Generate recommendations
  const recommendations: string[] = [];

  // Find features in progress on critical path
  const inProgressOnPath = criticalPath.filter(id => {
    const node = graph.get(id)!;
    return node.feature.status === 'in-progress';
  });

  if (inProgressOnPath.length > 0) {
    recommendations.push(
      `Complete ${inProgressOnPath.length} in-progress feature(s) on critical path: ${inProgressOnPath.join(', ')}`
    );
  }

  // Find next feature on critical path that's ready
  const nextOnPath = criticalPath.find(id => {
    const node = graph.get(id)!;
    return node.feature.status !== 'completed' && readyFeatures.includes(id);
  });

  if (nextOnPath) {
    const node = graph.get(nextOnPath)!;
    recommendations.push(
      `Start ${nextOnPath} (${node.feature.name}) - next on critical path`
    );
  }

  // Recommend parallel work if available
  if (parallelWork.length > 0) {
    recommendations.push(
      `${parallelWork.length} feature(s) can be worked in parallel: ${parallelWork.slice(0, 3).map(f => f.featureId).join(', ')}`
    );
  }

  return {
    targetFeature: {
      id: targetId,
      name: targetNode.feature.name,
      status: targetNode.feature.status,
    },
    criticalPath: pathDetails,
    totalPathLength: criticalPath.length,
    parallelWorkAvailable: parallelWork,
    blockedFeatures: blockedDetails,
    recommendations,
  };
}

/**
 * Get recommendations for what to work on next
 */
export function getNextFeature(filters: WorkFilters = {}): NextFeatureResult {
  const { moduleId, priority, maxResults = 5 } = filters;

  // Load all features
  let allFeatures = listFeatures({});

  // Apply filters
  if (moduleId) {
    allFeatures = allFeatures.filter(f => f.moduleId === moduleId);
  }
  if (priority) {
    allFeatures = allFeatures.filter(f => f.priority === priority);
  }

  // Build graph
  const graph = buildDependencyGraph(allFeatures);
  calculateDepths(graph);

  // Get ready features
  const readyIds = getReadyFeatures(graph);

  // Get blocked features
  const blockedMap = getBlockedFeatures(graph);

  // Get in-progress features
  const inProgressIds = allFeatures
    .filter(f => f.status === 'in-progress')
    .map(f => f.id);

  // Score and sort ready features
  const scoredReady = readyIds
    .filter(id => {
      const node = graph.get(id)!;
      return node.feature.status !== 'completed' && node.feature.status !== 'in-progress';
    })
    .map(id => {
      const node = graph.get(id)!;
      const blocksCount = countBlockedFeatures(id, graph);

      // Calculate priority score
      const priorityScore = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      }[node.feature.priority || 'medium'];

      // Overall score: blocks count (most important) + priority
      const score = blocksCount * 10 + priorityScore;

      return {
        featureId: id,
        name: node.feature.name,
        moduleId: node.feature.moduleId,
        priority: node.feature.priority || 'medium',
        blocksCount,
        score,
        reason: blocksCount > 0
          ? `Unblocks ${blocksCount} downstream feature(s)`
          : `Ready to start (no blocking dependencies)`,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  // Prepare blocked features
  const blockedDetails = Array.from(blockedMap.entries())
    .map(([id, deps]) => {
      const node = graph.get(id)!;
      return {
        featureId: id,
        name: node.feature.name,
        waitingOn: deps,
      };
    })
    .slice(0, maxResults);

  // Prepare in-progress features
  const inProgressDetails = inProgressIds.map(id => {
    const node = graph.get(id)!;
    return {
      featureId: id,
      name: node.feature.name,
      unblocks: node.dependents.filter(depId => {
        const dep = graph.get(depId);
        return dep && dep.feature.status !== 'completed';
      }),
    };
  });

  // Generate recommendations
  const recommendations: string[] = [];

  if (inProgressDetails.length > 0) {
    const highImpact = inProgressDetails.find(f => f.unblocks.length > 0);
    if (highImpact) {
      recommendations.push(
        `Prioritize completing ${highImpact.featureId} - it will unblock ${highImpact.unblocks.length} feature(s)`
      );
    }
  }

  if (scoredReady.length > 0) {
    const top = scoredReady[0];
    recommendations.push(`Start ${top.featureId} (${top.name}) - ${top.reason.toLowerCase()}`);
  }

  if (scoredReady.length > 1) {
    recommendations.push(
      `${scoredReady.length} feature(s) ready to start - consider team capacity for parallel work`
    );
  }

  if (blockedDetails.length > 0) {
    recommendations.push(
      `${blockedDetails.length} feature(s) currently blocked - focus on unblocking them`
    );
  }

  return {
    readyToStart: scoredReady,
    blockedFeatures: blockedDetails,
    inProgress: inProgressDetails,
    recommendations,
  };
}

/**
 * Validate feature dependencies
 */
export function validateDependencies(): ValidationResult {
  const allFeatures = listFeatures({});
  const graph = buildDependencyGraph(allFeatures);

  const errors: ValidationResult['errors'] = [];
  const warnings: ValidationResult['warnings'] = [];

  // Check for circular dependencies
  const cycles = detectCycles(graph);
  for (const cycle of cycles) {
    errors.push({
      type: 'circular_dependency',
      message: `Circular dependency detected: ${cycle.join(' -> ')}`,
      features: cycle,
      details: 'Features form a dependency cycle which makes them impossible to complete',
    });
  }

  // Check for invalid references and self-dependencies
  for (const feature of allFeatures) {
    const deps = feature.featureDependencies || [];

    for (const dep of deps) {
      // Check self-dependency
      if (dep.featureId === feature.id) {
        errors.push({
          type: 'self_dependency',
          message: `${feature.id} depends on itself`,
          features: [feature.id],
          details: 'A feature cannot depend on itself',
        });
      }

      // Check invalid reference
      if (!graph.has(dep.featureId)) {
        errors.push({
          type: 'invalid_reference',
          message: `${feature.id} depends on non-existent feature ${dep.featureId}`,
          features: [feature.id, dep.featureId],
          details: `Feature ${dep.featureId} does not exist`,
        });
      }
    }
  }

  // Check for orphaned features (no dependencies and no dependents)
  for (const [id, node] of graph.entries()) {
    if (node.dependencies.length === 0 && node.dependents.length === 0) {
      warnings.push({
        type: 'orphaned_feature',
        message: `${id} (${node.feature.name}) has no dependencies and no dependents`,
        features: [id],
      });
    }
  }

  // Check for deep nesting (depth > 5)
  calculateDepths(graph);
  for (const [id, node] of graph.entries()) {
    if (node.depth > 5) {
      warnings.push({
        type: 'deep_nesting',
        message: `${id} has a deep dependency chain (depth: ${node.depth})`,
        features: [id],
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate dependency graph visualization
 */
export function getDependencyGraph(options: GraphOptions = {}): DependencyGraphResult {
  const {
    moduleId,
    highlightCriticalPath,
    includeCompleted = true,
    format = 'mermaid',
  } = options;

  // Load features
  let allFeatures = listFeatures({});
  if (moduleId) {
    allFeatures = allFeatures.filter(f => f.moduleId === moduleId);
  }
  if (!includeCompleted) {
    allFeatures = allFeatures.filter(f => f.status !== 'completed');
  }

  const graph = buildDependencyGraph(allFeatures);

  // Get critical path if requested
  let criticalPathIds: string[] = [];
  if (highlightCriticalPath) {
    if (!graph.has(highlightCriticalPath)) {
      throw new Error(`Target feature ${highlightCriticalPath} not found`);
    }
    calculateDepths(graph);
    criticalPathIds = findLongestPath(highlightCriticalPath, graph);
  }

  if (format === 'json') {
    // Return JSON format
    const nodes = Array.from(graph.entries()).map(([id, node]) => ({
      id,
      name: node.feature.name,
      status: node.feature.status,
      dependencies: node.dependencies,
      dependents: node.dependents,
      onCriticalPath: criticalPathIds.includes(id),
    }));

    return {
      format: 'json',
      content: JSON.stringify({ nodes }, null, 2),
      features: graph.size,
      dependencies: Array.from(graph.values()).reduce((sum, node) => sum + node.dependencies.length, 0),
      criticalPathHighlighted: criticalPathIds.length > 0,
    };
  }

  // Generate Mermaid diagram
  const lines: string[] = ['graph TD'];

  // Add nodes
  for (const [id, node] of graph.entries()) {
    const statusEmoji = {
      completed: '✅',
      'in-progress': '🔄',
      'in-review': '👀',
      ready: '📋',
      draft: '📝',
      cancelled: '❌',
    }[node.feature.status] || '⏸️';

    const label = `${node.feature.name}<br/>${statusEmoji} ${node.feature.status}`;
    lines.push(`  ${id}["${label}"]`);
  }

  // Add edges
  let dependencyCount = 0;
  for (const [id, node] of graph.entries()) {
    for (const depId of node.dependencies) {
      if (graph.has(depId)) {
        const edgeLabel = criticalPathIds.includes(id) && criticalPathIds.includes(depId)
          ? '|CRITICAL|'
          : '|blocks|';
        lines.push(`  ${depId} -->${edgeLabel} ${id}`);
        dependencyCount++;
      }
    }
  }

  // Add styling
  for (const [id, node] of graph.entries()) {
    let color = '#D3D3D3'; // Default gray
    if (node.feature.status === 'completed') color = '#90EE90'; // Green
    else if (node.feature.status === 'in-progress') color = '#FFD700'; // Gold
    else if (node.feature.status === 'in-review') color = '#87CEEB'; // Sky blue

    if (criticalPathIds.includes(id)) {
      lines.push(`  style ${id} fill:${color},stroke:#FF0000,stroke-width:3px`);
    } else {
      lines.push(`  style ${id} fill:${color}`);
    }
  }

  return {
    format: 'mermaid',
    content: lines.join('\n'),
    features: graph.size,
    dependencies: dependencyCount,
    criticalPathHighlighted: criticalPathIds.length > 0,
  };
}
