/**
 * READ Operations
 *
 * Tools for retrieving and viewing contracts
 */

import { readContract, listContracts, listAllContracts, contractExists } from '../lib/file-manager.js';
import type { Module, Feature, Issue, ContractType } from '../types/contracts.js';

/**
 * Get a single module by ID
 */
export function getModule(id: string): Module {
  const contract = readContract(id);

  if (!id.startsWith('MOD-')) {
    throw new Error(`ID ${id} is not a module`);
  }

  return contract as Module;
}

/**
 * Get a single feature by ID
 */
export function getFeature(id: string): Feature {
  const contract = readContract(id);

  if (!id.startsWith('FEAT-')) {
    throw new Error(`ID ${id} is not a feature`);
  }

  return contract as Feature;
}

/**
 * Get a single issue by ID (any type)
 */
export function getIssue(id: string): Issue {
  const contract = readContract(id);

  const issueTypes = ['STORY-', 'BUG-', 'DEBT-', 'SPIKE-'];
  if (!issueTypes.some(type => id.startsWith(type))) {
    throw new Error(`ID ${id} is not an issue`);
  }

  return contract as Issue;
}

/**
 * List all modules with optional filtering
 */
export interface ListModulesOptions {
  status?: Module['status'];
  type?: Module['type'];
}

export function listModules(options?: ListModulesOptions) {
  const contracts = listContracts('module');
  let modules = contracts.map(c => c.data as Module);

  // Apply filters
  if (options?.status) {
    modules = modules.filter(m => m.status === options.status);
  }

  if (options?.type) {
    modules = modules.filter(m => m.type === options.type);
  }

  return modules;
}

/**
 * List all features with optional filtering
 */
export interface ListFeaturesOptions {
  moduleId?: string;
  status?: Feature['status'];
  priority?: Feature['priority'];
}

export function listFeatures(options?: ListFeaturesOptions) {
  const contracts = listContracts('feature');
  let features = contracts.map(c => c.data as Feature);

  // Apply filters
  if (options?.moduleId) {
    features = features.filter(f => f.moduleId === options.moduleId);
  }

  if (options?.status) {
    features = features.filter(f => f.status === options.status);
  }

  if (options?.priority) {
    features = features.filter(f => f.priority === options.priority);
  }

  return features;
}

/**
 * List all issues with optional filtering
 */
export interface ListIssuesOptions {
  featureId?: string;
  type?: 'user-story' | 'bug' | 'tech-debt' | 'spike';
  status?: string;
  assignee?: string;
  priority?: string;
}

export function listIssues(options?: ListIssuesOptions) {
  let issueTypes: ContractType[] = ['user-story', 'bug', 'tech-debt', 'spike'];

  // If type filter specified, only get that type
  if (options?.type) {
    issueTypes = [options.type];
  }

  let allIssues: Issue[] = [];

  for (const type of issueTypes) {
    const contracts = listContracts(type);
    const issues = contracts.map(c => c.data as Issue);
    allIssues.push(...issues);
  }

  // Apply filters
  if (options?.featureId) {
    allIssues = allIssues.filter(i => i.featureId === options.featureId);
  }

  if (options?.status) {
    allIssues = allIssues.filter(i => i.status === options.status);
  }

  if (options?.assignee) {
    allIssues = allIssues.filter(i => 'assignee' in i && i.assignee === options.assignee);
  }

  if (options?.priority) {
    allIssues = allIssues.filter(i => 'priority' in i && i.priority === options.priority);
  }

  return allIssues;
}

/**
 * Search across all contracts
 */
export function searchAll(query: string) {
  const allContracts = listAllContracts();
  const lowerQuery = query.toLowerCase();

  const results = allContracts.filter(contract => {
    const data = contract.data;
    const searchableText = JSON.stringify(data).toLowerCase();
    return searchableText.includes(lowerQuery);
  });

  return results.map(r => ({
    id: r.id,
    type: r.type,
    data: r.data,
  }));
}

/**
 * Get contract summary (for displaying overview)
 */
export function getContractSummary(id: string) {
  const contract = readContract(id);

  if (id.startsWith('MOD-')) {
    const module = contract as Module;
    return {
      id: module.id,
      type: 'module' as const,
      name: module.name,
      description: module.description,
      status: module.status,
      featuresCount: module.features.length,
    };
  }

  if (id.startsWith('FEAT-')) {
    const feature = contract as Feature;
    return {
      id: feature.id,
      type: 'feature' as const,
      name: feature.name,
      description: feature.description,
      moduleId: feature.moduleId,
      status: feature.status,
      priority: feature.priority,
      issuesCount: feature.issues.length,
    };
  }

  // Issue
  const issue = contract as Issue;
  return {
    id: issue.id,
    type: 'issue' as const,
    title: issue.title,
    featureId: issue.featureId,
    status: issue.status,
  };
}
