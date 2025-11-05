/**
 * TypeScript types for VibeOps contracts
 * These mirror the JSON schemas
 */

export interface Metadata {
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
}

export interface Module {
  id: string;
  name: string;
  description: string;
  type: 'theme' | 'initiative';
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
  features: string[];
  owner?: string;
  startDate?: string;
  targetDate?: string;
  metadata: Metadata;
}

export interface PRD {
  problemStatement: string;
  goals: string[];
  successMetrics: Array<{
    metric: string;
    target: string;
  }>;
  scope: {
    inScope: string[];
    outOfScope?: string[];
  };
  userStories?: string[];
  dependencies?: string[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  status: 'draft' | 'ready' | 'in-progress' | 'in-review' | 'completed' | 'cancelled';
  prd: PRD;
  issues: string[];
  owner?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  metadata: Metadata;
}

export interface AcceptanceCriterion {
  criterion: string;
  verified: boolean;
}

export interface ChecklistItem {
  item: string;
  completed: boolean;
}

export interface ReadyItem {
  item: string;
  ready: boolean;
}

export interface Implementation {
  files?: string[];
  commits?: string[];
  prs?: string[];
}

export interface UserStory {
  id: string;
  title: string;
  description: string;
  featureId: string;
  status: 'backlog' | 'ready' | 'in-progress' | 'in-review' | 'done' | 'blocked';
  acceptanceCriteria: AcceptanceCriterion[];
  definitionOfDone: ChecklistItem[];
  definitionOfReady: ReadyItem[];
  assignee?: string;
  storyPoints?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  implementation?: Implementation;
  metadata: Metadata;
}

export interface ReproductionStep {
  step: string;
  expectedResult: string;
  actualResult: string;
}

export interface Environment {
  platform: string;
  browser?: string;
  version?: string;
  additionalDetails?: Record<string, any>;
}

export interface Bug {
  id: string;
  title: string;
  description: string;
  featureId: string;
  status: 'open' | 'in-progress' | 'needs-verification' | 'verified' | 'closed' | 'wont-fix';
  severity: 'critical' | 'high' | 'medium' | 'low';
  reproductionSteps: ReproductionStep[];
  environment: Environment;
  attachments?: Array<{
    filename: string;
    url: string;
    description?: string;
  }>;
  assignee?: string;
  rootCause?: string;
  implementation?: Implementation;
  metadata: Metadata;
}

export interface Impact {
  severity: 'critical' | 'high' | 'medium' | 'low';
  areas: Array<'performance' | 'maintainability' | 'scalability' | 'security' | 'reliability' | 'developer-experience'>;
  description: string;
  metrics?: Array<{
    metric: string;
    currentValue: string;
    targetValue: string;
  }>;
}

export interface Effort {
  estimate: 'xs' | 'small' | 'medium' | 'large' | 'xl';
  complexity: 'low' | 'medium' | 'high';
  storyPoints?: number;
  dependencies?: string[];
}

export interface TechDebt {
  id: string;
  title: string;
  description: string;
  featureId: string;
  status: 'identified' | 'prioritized' | 'in-progress' | 'completed' | 'deferred';
  impact: Impact;
  effort: Effort;
  proposedSolution?: string;
  assignee?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  implementation?: Implementation;
  metadata: Metadata;
}

export interface Question {
  question: string;
  answered: boolean;
  answer?: string;
}

export interface Timebox {
  duration: number;
  unit: 'hours' | 'days' | 'weeks';
  startDate?: string;
  endDate?: string;
}

export interface Findings {
  summary?: string;
  recommendations?: string[];
  risks?: string[];
  nextSteps?: string[];
}

export interface Spike {
  id: string;
  title: string;
  description: string;
  featureId: string;
  status: 'planned' | 'in-progress' | 'completed' | 'abandoned';
  questions: Question[];
  timebox: Timebox;
  objectives: string[];
  findings?: Findings;
  assignee?: string;
  artifacts?: Array<{
    name: string;
    type: 'document' | 'prototype' | 'code' | 'diagram' | 'other';
    url?: string;
    description?: string;
  }>;
  implementation?: Implementation;
  metadata: Metadata;
}

export type Issue = UserStory | Bug | TechDebt | Spike;
export type Contract = Module | Feature | Issue;

export type ContractType = 'module' | 'feature' | 'user-story' | 'bug' | 'tech-debt' | 'spike';

export interface ContractFile {
  path: string;
  type: ContractType;
  id: string;
  data: Contract;
}
