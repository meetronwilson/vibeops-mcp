/**
 * ENHANCED QUERY Operations
 *
 * Advanced query tools for productivity
 */

import { listIssues } from './read.js';
import type { Issue, UserStory } from '../types/contracts.js';

/**
 * Get all work assigned to a specific person
 */
export function getMyWork(assignee: string) {
  const allIssues = listIssues();
  return allIssues.filter(issue => issue.assignee === assignee);
}

/**
 * Get all blocked items
 */
export function getBlockers() {
  const allIssues = listIssues();
  return allIssues.filter(issue => {
    if ('status' in issue) {
      return issue.status === 'blocked';
    }
    return false;
  });
}

/**
 * Get issues that are ready to start
 * (User stories with "ready" status)
 */
export function getReadyToStart() {
  const allIssues = listIssues({ type: 'user-story' });
  return allIssues.filter(issue => {
    const story = issue as UserStory;
    return story.status === 'ready';
  });
}

/**
 * Get items that need review
 */
export function getNeedsReview() {
  const allIssues = listIssues();
  return allIssues.filter(issue => {
    if ('status' in issue) {
      return issue.status === 'in-review' || issue.status === 'needs-verification';
    }
    return false;
  });
}

/**
 * Get in-progress items
 */
export function getInProgress() {
  const allIssues = listIssues();
  return allIssues.filter(issue => {
    if ('status' in issue) {
      return issue.status === 'in-progress';
    }
    return false;
  });
}

/**
 * Get high priority items
 */
export function getHighPriority() {
  const allIssues = listIssues();
  return allIssues.filter(issue => {
    if ('priority' in issue) {
      return issue.priority === 'critical' || issue.priority === 'high';
    }
    if ('severity' in issue) {
      return issue.severity === 'critical' || issue.severity === 'high';
    }
    return false;
  });
}
