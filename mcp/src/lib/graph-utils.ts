/**
 * Graph Utilities for Dependency Analysis
 *
 * Core algorithms for analyzing feature dependency graphs
 */

import { Feature } from '../types/contracts.js';

export interface GraphNode {
  feature: Feature;
  dependencies: string[];  // Features that block this one
  dependents: string[];    // Features blocked by this one
  depth: number;           // Distance from features with no dependencies
}

/**
 * Build a dependency graph from features
 */
export function buildDependencyGraph(features: Feature[]): Map<string, GraphNode> {
  const graph = new Map<string, GraphNode>();

  // Initialize all nodes
  for (const feature of features) {
    graph.set(feature.id, {
      feature,
      dependencies: [],
      dependents: [],
      depth: -1, // Will be calculated later
    });
  }

  // Build edges
  for (const feature of features) {
    const deps = feature.featureDependencies || [];

    // Only consider 'blocks' type for critical path (hard dependencies)
    const blockingDeps = deps
      .filter(d => d.type === 'blocks')
      .map(d => d.featureId);

    const node = graph.get(feature.id)!;
    node.dependencies = blockingDeps;

    // Add this feature as a dependent of its dependencies
    for (const depId of blockingDeps) {
      const depNode = graph.get(depId);
      if (depNode) {
        depNode.dependents.push(feature.id);
      }
    }
  }

  return graph;
}

/**
 * Detect cycles in the dependency graph using DFS with color marking
 * Returns array of cycles (each cycle is an array of feature IDs)
 */
export function detectCycles(graph: Map<string, GraphNode>): string[][] {
  const cycles: string[][] = [];
  const color = new Map<string, 'white' | 'gray' | 'black'>();
  const parent = new Map<string, string | null>();

  // Initialize all nodes as white (unvisited)
  for (const nodeId of graph.keys()) {
    color.set(nodeId, 'white');
    parent.set(nodeId, null);
  }

  function dfs(nodeId: string, path: string[]): void {
    color.set(nodeId, 'gray'); // Mark as being visited
    path.push(nodeId);

    const node = graph.get(nodeId);
    if (!node) return;

    for (const depId of node.dependencies) {
      if (!graph.has(depId)) continue; // Skip invalid dependencies

      if (color.get(depId) === 'gray') {
        // Back edge found - cycle detected
        const cycleStart = path.indexOf(depId);
        if (cycleStart !== -1) {
          cycles.push([...path.slice(cycleStart), depId]);
        }
      } else if (color.get(depId) === 'white') {
        parent.set(depId, nodeId);
        dfs(depId, [...path]);
      }
    }

    color.set(nodeId, 'black'); // Mark as fully visited
  }

  // Run DFS from each unvisited node
  for (const nodeId of graph.keys()) {
    if (color.get(nodeId) === 'white') {
      dfs(nodeId, []);
    }
  }

  return cycles;
}

/**
 * Topological sort using Kahn's algorithm
 * Returns null if cycle detected, otherwise returns sorted array
 */
export function topologicalSort(graph: Map<string, GraphNode>): string[] | null {
  const inDegree = new Map<string, number>();
  const result: string[] = [];
  const queue: string[] = [];

  // Calculate in-degrees
  for (const [nodeId, node] of graph.entries()) {
    inDegree.set(nodeId, node.dependencies.length);
    if (node.dependencies.length === 0) {
      queue.push(nodeId);
    }
  }

  // Process nodes with no dependencies
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    result.push(nodeId);

    const node = graph.get(nodeId)!;
    for (const dependentId of node.dependents) {
      const currentDegree = inDegree.get(dependentId)! - 1;
      inDegree.set(dependentId, currentDegree);

      if (currentDegree === 0) {
        queue.push(dependentId);
      }
    }
  }

  // If not all nodes processed, there's a cycle
  if (result.length !== graph.size) {
    return null;
  }

  return result;
}

/**
 * Calculate depth (longest path from start) for each node
 * Depth = maximum depth of all dependencies + 1
 */
export function calculateDepths(graph: Map<string, GraphNode>): void {
  const memo = new Map<string, number>();

  function getDepth(nodeId: string): number {
    if (memo.has(nodeId)) {
      return memo.get(nodeId)!;
    }

    const node = graph.get(nodeId);
    if (!node) return 0;

    // If no dependencies, depth is 0
    if (node.dependencies.length === 0) {
      memo.set(nodeId, 0);
      return 0;
    }

    // Depth is 1 + max depth of dependencies
    let maxDepth = 0;
    for (const depId of node.dependencies) {
      const depDepth = getDepth(depId);
      maxDepth = Math.max(maxDepth, depDepth);
    }

    const depth = maxDepth + 1;
    memo.set(nodeId, depth);
    node.depth = depth;
    return depth;
  }

  // Calculate depth for all nodes
  for (const nodeId of graph.keys()) {
    getDepth(nodeId);
  }
}

/**
 * Find the longest path (critical path) to a target node
 */
export function findLongestPath(
  targetId: string,
  graph: Map<string, GraphNode>
): string[] {
  const path: string[] = [];
  const visited = new Set<string>();

  function findPath(nodeId: string): string[] | null {
    if (visited.has(nodeId)) {
      return null; // Cycle or already visited
    }

    visited.add(nodeId);
    const node = graph.get(nodeId);
    if (!node) return null;

    // If no dependencies, this is the start
    if (node.dependencies.length === 0) {
      return [nodeId];
    }

    // Find longest path through dependencies
    let longestPath: string[] = [];
    for (const depId of node.dependencies) {
      const depPath = findPath(depId);
      if (depPath && depPath.length > longestPath.length) {
        longestPath = depPath;
      }
    }

    visited.delete(nodeId);
    return [...longestPath, nodeId];
  }

  const result = findPath(targetId);
  return result || [];
}

/**
 * Get all features that are ready to start (no incomplete dependencies)
 */
export function getReadyFeatures(graph: Map<string, GraphNode>): string[] {
  const ready: string[] = [];

  for (const [nodeId, node] of graph.entries()) {
    // Skip if already completed
    if (node.feature.status === 'completed') {
      continue;
    }

    // Check if all dependencies are completed
    const allDepsCompleted = node.dependencies.every(depId => {
      const dep = graph.get(depId);
      return dep && dep.feature.status === 'completed';
    });

    if (allDepsCompleted) {
      ready.push(nodeId);
    }
  }

  return ready;
}

/**
 * Get all features that are blocked (have incomplete dependencies)
 */
export function getBlockedFeatures(graph: Map<string, GraphNode>): Map<string, string[]> {
  const blocked = new Map<string, string[]>();

  for (const [nodeId, node] of graph.entries()) {
    // Skip if already completed
    if (node.feature.status === 'completed') {
      continue;
    }

    // Find incomplete dependencies
    const incompleteDeps = node.dependencies.filter(depId => {
      const dep = graph.get(depId);
      return dep && dep.feature.status !== 'completed';
    });

    if (incompleteDeps.length > 0) {
      blocked.set(nodeId, incompleteDeps);
    }
  }

  return blocked;
}

/**
 * Count how many features a given feature blocks
 */
export function countBlockedFeatures(
  featureId: string,
  graph: Map<string, GraphNode>
): number {
  const visited = new Set<string>();

  function countRecursive(nodeId: string): number {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);

    const node = graph.get(nodeId);
    if (!node) return 0;

    let count = node.dependents.length;
    for (const depId of node.dependents) {
      count += countRecursive(depId);
    }

    return count;
  }

  return countRecursive(featureId);
}
