/**
 * CREATE Operations
 *
 * Tools for creating new contracts with auto-generation and validation
 */

import { writeContract, readContract, updateContract, contractExists } from '../lib/file-manager.js';
import { generateNextId } from '../lib/id-generator.js';
import type {
  Module,
  Feature,
  Issue,
  ContractType,
  Metadata,
  UserStory,
  Bug,
  TechDebt,
  Spike,
  AcceptanceCriterion,
  ChecklistItem,
  ReadyItem,
  ReproductionStep,
  Environment,
  Impact,
  Effort,
  Question,
  Timebox,
  Findings,
} from '../types/contracts.js';

/**
 * Generate standard metadata for new contracts
 */
function generateMetadata(createdBy?: string, tags?: string[]): Metadata {
  const now = new Date().toISOString();
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: createdBy || 'claude-code',
    tags,
  };
}

/**
 * Create a new module
 */
export interface CreateModuleInput {
  name: string;
  description: string;
  type: 'theme' | 'initiative';
  status?: Module['status'];
  owner?: string;
  startDate?: string;
  targetDate?: string;
  tags?: string[];
  createdBy?: string;
}

export function createModule(input: CreateModuleInput): Module {
  const id = generateNextId('module');

  // Check if ID already exists (safety check for race conditions)
  if (contractExists(id)) {
    throw new Error(`Module ${id} already exists. This may indicate a race condition or duplicate creation.`);
  }

  const module: Module = {
    id,
    name: input.name,
    description: input.description,
    type: input.type,
    status: input.status || 'planning',
    features: [],
    owner: input.owner,
    startDate: input.startDate,
    targetDate: input.targetDate,
    metadata: generateMetadata(input.createdBy, input.tags),
  };

  writeContract(module);
  return module;
}

/**
 * Create a new feature and link it to parent module
 */
export interface CreateFeatureInput {
  name: string;
  description: string;
  moduleId: string;
  priority?: Feature['priority'];
  status?: Feature['status'];
  prd: {
    problemStatement: string;
    goals: string[];
    successMetrics: Array<{ metric: string; target: string }>;
    scope: {
      inScope: string[];
      outOfScope?: string[];
    };
    userStories?: string[];
    dependencies?: string[];
  };
  owner?: string;
  tags?: string[];
  createdBy?: string;
}

export function createFeature(input: CreateFeatureInput): Feature {
  // Verify parent module exists
  if (!contractExists(input.moduleId)) {
    throw new Error(`Parent module ${input.moduleId} does not exist`);
  }

  const id = generateNextId('feature');

  // Check if ID already exists (safety check for race conditions)
  if (contractExists(id)) {
    throw new Error(`Feature ${id} already exists. This may indicate a race condition or duplicate creation.`);
  }

  const feature: Feature = {
    id,
    name: input.name,
    description: input.description,
    moduleId: input.moduleId,
    priority: input.priority,
    status: input.status || 'draft',
    issues: [],
    prd: input.prd,
    owner: input.owner,
    metadata: generateMetadata(input.createdBy, input.tags),
  };

  // Write the feature contract
  writeContract(feature);

  // Update parent module to include this feature
  const module = readContract(input.moduleId) as Module;
  if (!module.features.includes(id)) {
    module.features.push(id);
    module.metadata.updatedAt = new Date().toISOString();
    writeContract(module);
  }

  return feature;
}

/**
 * Create a new issue (user story, bug, tech debt, or spike) and link to feature
 */
export interface CreateIssueInput {
  type: 'user-story' | 'bug' | 'tech-debt' | 'spike';
  title: string;
  featureId: string;
  description: string;
  assignee?: string;
  tags?: string[];
  createdBy?: string;

  // User Story specific
  status?: UserStory['status'];
  acceptanceCriteria?: string[]; // Will be converted to AcceptanceCriterion[]
  storyPoints?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';

  // Bug specific
  bugStatus?: Bug['status'];
  severity?: 'critical' | 'high' | 'medium' | 'low';
  reproductionSteps?: Array<{ step: string; expectedResult: string; actualResult: string }>;
  environment?: { platform: string; browser?: string; version?: string };
  rootCause?: string;

  // Tech Debt specific
  techDebtStatus?: TechDebt['status'];
  impact?: {
    severity: 'critical' | 'high' | 'medium' | 'low';
    areas: Array<'performance' | 'maintainability' | 'scalability' | 'security' | 'reliability' | 'developer-experience'>;
    description: string;
  };
  effort?: {
    estimate: 'xs' | 'small' | 'medium' | 'large' | 'xl';
    complexity: 'low' | 'medium' | 'high';
    storyPoints?: number;
  };
  proposedSolution?: string;
  techDebtPriority?: 'critical' | 'high' | 'medium' | 'low';

  // Spike specific
  spikeStatus?: Spike['status'];
  questions?: string[]; // Will be converted to Question[]
  timebox?: { duration: number; unit: 'hours' | 'days' | 'weeks'; startDate?: string; endDate?: string };
  objectives?: string[];
}

export function createIssue(input: CreateIssueInput): Issue {
  // Verify parent feature exists
  if (!contractExists(input.featureId)) {
    throw new Error(`Parent feature ${input.featureId} does not exist`);
  }

  const id = generateNextId(input.type);

  // Check if ID already exists (safety check for race conditions)
  if (contractExists(id)) {
    throw new Error(`Issue ${id} already exists. This may indicate a race condition or duplicate creation.`);
  }

  let issue: Issue;

  // Build type-specific issue
  switch (input.type) {
    case 'user-story': {
      const userStory: UserStory = {
        id,
        title: input.title,
        description: input.description,
        featureId: input.featureId,
        status: input.status || 'backlog',
        acceptanceCriteria: (input.acceptanceCriteria || []).map(criterion => ({
          criterion,
          verified: false,
        })),
        definitionOfDone: [],
        definitionOfReady: [],
        assignee: input.assignee,
        storyPoints: input.storyPoints,
        priority: input.priority,
        metadata: generateMetadata(input.createdBy, input.tags),
      };
      issue = userStory;
      break;
    }

    case 'bug': {
      const bug: Bug = {
        id,
        title: input.title,
        description: input.description,
        featureId: input.featureId,
        status: input.bugStatus || 'open',
        severity: input.severity || 'medium',
        reproductionSteps: input.reproductionSteps || [],
        environment: input.environment || { platform: 'unknown' },
        assignee: input.assignee,
        rootCause: input.rootCause,
        metadata: generateMetadata(input.createdBy, input.tags),
      };
      issue = bug;
      break;
    }

    case 'tech-debt': {
      const techDebt: TechDebt = {
        id,
        title: input.title,
        description: input.description,
        featureId: input.featureId,
        status: input.techDebtStatus || 'identified',
        impact: input.impact || {
          severity: 'medium',
          areas: ['maintainability'],
          description: 'No impact specified',
        },
        effort: input.effort || {
          estimate: 'medium',
          complexity: 'medium',
        },
        proposedSolution: input.proposedSolution,
        assignee: input.assignee,
        priority: input.techDebtPriority,
        metadata: generateMetadata(input.createdBy, input.tags),
      };
      issue = techDebt;
      break;
    }

    case 'spike': {
      const spike: Spike = {
        id,
        title: input.title,
        description: input.description,
        featureId: input.featureId,
        status: input.spikeStatus || 'planned',
        questions: (input.questions || []).map(question => ({
          question,
          answered: false,
        })),
        timebox: input.timebox || { duration: 3, unit: 'days' },
        objectives: input.objectives || [],
        assignee: input.assignee,
        metadata: generateMetadata(input.createdBy, input.tags),
      };
      issue = spike;
      break;
    }
  }

  // Write the issue contract
  writeContract(issue);

  // Update parent feature to include this issue
  const feature = readContract(input.featureId) as Feature;
  if (!feature.issues.includes(id)) {
    feature.issues.push(id);
    feature.metadata.updatedAt = new Date().toISOString();
    writeContract(feature);
  }

  return issue;
}
