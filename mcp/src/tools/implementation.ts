/**
 * IMPLEMENTATION TRACKING Operations
 *
 * Tools for linking code files, commits, and PRs to issues
 */

import { readContract, writeContract } from '../lib/file-manager.js';
import type { Issue } from '../types/contracts.js';

/**
 * Add implementation files to an issue
 */
export function addImplementationFiles(issueId: string, files: string[]): Issue {
  const issue = readContract(issueId) as Issue;

  const updated = {
    ...issue,
    implementation: {
      ...issue.implementation,
      files: [...(issue.implementation?.files || []), ...files].filter(
        (file, index, self) => self.indexOf(file) === index
      ), // Remove duplicates
      commits: issue.implementation?.commits || [],
      prs: issue.implementation?.prs || [],
    },
    metadata: {
      ...issue.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated as any);
  return updated;
}

/**
 * Add commit reference to an issue
 */
export function addCommitReference(issueId: string, commitHash: string): Issue {
  const issue = readContract(issueId) as Issue;

  const updated = {
    ...issue,
    implementation: {
      files: issue.implementation?.files || [],
      commits: [...(issue.implementation?.commits || []), commitHash].filter(
        (hash, index, self) => self.indexOf(hash) === index
      ), // Remove duplicates
      prs: issue.implementation?.prs || [],
    },
    metadata: {
      ...issue.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated as any);
  return updated;
}

/**
 * Add PR reference to an issue
 */
export function addPRReference(issueId: string, prNumber: string): Issue {
  const issue = readContract(issueId) as Issue;

  const updated = {
    ...issue,
    implementation: {
      files: issue.implementation?.files || [],
      commits: issue.implementation?.commits || [],
      prs: [...(issue.implementation?.prs || []), prNumber].filter(
        (pr, index, self) => self.indexOf(pr) === index
      ), // Remove duplicates
    },
    metadata: {
      ...issue.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated as any);
  return updated;
}

/**
 * Get all issues that touch a specific file
 */
export function getIssuesByFile(filePath: string): Issue[] {
  // This would require scanning all issues
  // For now, return empty array - can be implemented later with indexing
  return [];
}

/**
 * Get all files for an issue
 */
export function getImplementationFiles(issueId: string): string[] {
  const issue = readContract(issueId) as Issue;
  return issue.implementation?.files || [];
}
