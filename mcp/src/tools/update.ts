/**
 * UPDATE Operations
 *
 * Tools for updating existing contracts
 */

import { readContract, writeContract } from '../lib/file-manager.js';
import type {
  Module,
  Feature,
  UserStory,
  Bug,
  TechDebt,
  Spike,
  Issue,
} from '../types/contracts.js';

/**
 * Update a module
 */
export interface UpdateModuleInput {
  id: string;
  name?: string;
  description?: string;
  type?: Module['type'];
  status?: Module['status'];
  owner?: string;
  startDate?: string;
  targetDate?: string;
  tags?: string[];
}

export function updateModule(input: UpdateModuleInput): Module {
  const existing = readContract(input.id) as Module;

  const updated: Module = {
    ...existing,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.type !== undefined && { type: input.type }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.owner !== undefined && { owner: input.owner }),
    ...(input.startDate !== undefined && { startDate: input.startDate }),
    ...(input.targetDate !== undefined && { targetDate: input.targetDate }),
    metadata: {
      ...existing.metadata,
      ...(input.tags !== undefined && { tags: input.tags }),
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated);
  return updated;
}

/**
 * Update a feature
 */
export interface UpdateFeatureInput {
  id: string;
  name?: string;
  description?: string;
  status?: Feature['status'];
  priority?: Feature['priority'];
  owner?: string;
  tags?: string[];
  prd?: {
    problemStatement?: string;
    goals?: string[];
    successMetrics?: Array<{ metric: string; target: string }>;
    scope?: {
      inScope?: string[];
      outOfScope?: string[];
    };
    userStories?: string[];
    dependencies?: string[];
  };
}

export function updateFeature(input: UpdateFeatureInput): Feature {
  const existing = readContract(input.id) as Feature;

  const updated: Feature = {
    ...existing,
    ...(input.name !== undefined && { name: input.name }),
    ...(input.description !== undefined && { description: input.description }),
    ...(input.status !== undefined && { status: input.status }),
    ...(input.priority !== undefined && { priority: input.priority }),
    ...(input.owner !== undefined && { owner: input.owner }),
    ...(input.prd && {
      prd: {
        ...existing.prd,
        ...(input.prd.problemStatement !== undefined && {
          problemStatement: input.prd.problemStatement,
        }),
        ...(input.prd.goals !== undefined && { goals: input.prd.goals }),
        ...(input.prd.successMetrics !== undefined && {
          successMetrics: input.prd.successMetrics,
        }),
        ...(input.prd.scope && {
          scope: {
            ...existing.prd.scope,
            ...(input.prd.scope.inScope !== undefined && {
              inScope: input.prd.scope.inScope,
            }),
            ...(input.prd.scope.outOfScope !== undefined && {
              outOfScope: input.prd.scope.outOfScope,
            }),
          },
        }),
        ...(input.prd.userStories !== undefined && {
          userStories: input.prd.userStories,
        }),
        ...(input.prd.dependencies !== undefined && {
          dependencies: input.prd.dependencies,
        }),
      },
    }),
    metadata: {
      ...existing.metadata,
      ...(input.tags !== undefined && { tags: input.tags }),
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated);
  return updated;
}

/**
 * Update an issue (any type)
 */
export interface UpdateIssueInput {
  id: string;
  title?: string;
  description?: string;
  assignee?: string;
  tags?: string[];

  // User Story specific
  status?: UserStory['status'];
  storyPoints?: number;
  priority?: 'critical' | 'high' | 'medium' | 'low';

  // Bug specific
  bugStatus?: Bug['status'];
  severity?: 'critical' | 'high' | 'medium' | 'low';
  rootCause?: string;

  // Tech Debt specific
  techDebtStatus?: TechDebt['status'];
  proposedSolution?: string;
  techDebtPriority?: 'critical' | 'high' | 'medium' | 'low';

  // Spike specific
  spikeStatus?: Spike['status'];
}

export function updateIssue(input: UpdateIssueInput): Issue {
  const existing = readContract(input.id) as Issue;

  // Determine issue type from ID
  let updated: Issue;

  if (input.id.startsWith('STORY-')) {
    const story = existing as UserStory;
    updated = {
      ...story,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.assignee !== undefined && { assignee: input.assignee }),
      ...(input.storyPoints !== undefined && { storyPoints: input.storyPoints }),
      ...(input.priority !== undefined && { priority: input.priority }),
      metadata: {
        ...story.metadata,
        ...(input.tags !== undefined && { tags: input.tags }),
        updatedAt: new Date().toISOString(),
      },
    } as UserStory;
  } else if (input.id.startsWith('BUG-')) {
    const bug = existing as Bug;
    updated = {
      ...bug,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.bugStatus !== undefined && { status: input.bugStatus }),
      ...(input.assignee !== undefined && { assignee: input.assignee }),
      ...(input.severity !== undefined && { severity: input.severity }),
      ...(input.rootCause !== undefined && { rootCause: input.rootCause }),
      metadata: {
        ...bug.metadata,
        ...(input.tags !== undefined && { tags: input.tags }),
        updatedAt: new Date().toISOString(),
      },
    } as Bug;
  } else if (input.id.startsWith('DEBT-')) {
    const debt = existing as TechDebt;
    updated = {
      ...debt,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.techDebtStatus !== undefined && { status: input.techDebtStatus }),
      ...(input.assignee !== undefined && { assignee: input.assignee }),
      ...(input.proposedSolution !== undefined && {
        proposedSolution: input.proposedSolution,
      }),
      ...(input.techDebtPriority !== undefined && { priority: input.techDebtPriority }),
      metadata: {
        ...debt.metadata,
        ...(input.tags !== undefined && { tags: input.tags }),
        updatedAt: new Date().toISOString(),
      },
    } as TechDebt;
  } else if (input.id.startsWith('SPIKE-')) {
    const spike = existing as Spike;
    updated = {
      ...spike,
      ...(input.title !== undefined && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.spikeStatus !== undefined && { status: input.spikeStatus }),
      ...(input.assignee !== undefined && { assignee: input.assignee }),
      metadata: {
        ...spike.metadata,
        ...(input.tags !== undefined && { tags: input.tags }),
        updatedAt: new Date().toISOString(),
      },
    } as Spike;
  } else {
    throw new Error(`Unknown issue type for ID: ${input.id}`);
  }

  writeContract(updated);
  return updated;
}

/**
 * Quick status update for any contract
 */
export function updateStatus(id: string, status: string) {
  const existing = readContract(id);

  const updated = {
    ...existing,
    status: status as any, // Accept any string, TypeScript will validate at contract level
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated as any);
  return updated;
}

/**
 * Quick assignee update for issues
 */
export function updateAssignee(id: string, assignee: string) {
  const existing = readContract(id) as Issue;

  const updated = {
    ...existing,
    assignee,
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated);
  return updated;
}

/**
 * Check off acceptance criteria for user stories
 */
export interface CheckAcceptanceCriteriaInput {
  id: string;
  indices: number[]; // 0-based indices to mark as verified
}

export function checkAcceptanceCriteria(input: CheckAcceptanceCriteriaInput): UserStory {
  const existing = readContract(input.id) as UserStory;

  if (!input.id.startsWith('STORY-')) {
    throw new Error(`${input.id} is not a user story`);
  }

  const updated: UserStory = {
    ...existing,
    acceptanceCriteria: existing.acceptanceCriteria.map((ac, index) => {
      if (input.indices.includes(index)) {
        return { ...ac, verified: true };
      }
      return ac;
    }),
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated);
  return updated;
}

/**
 * Check off definition of done items for user stories
 */
export interface CheckDefinitionOfDoneInput {
  id: string;
  indices: number[]; // 0-based indices to mark as completed
}

export function checkDefinitionOfDone(input: CheckDefinitionOfDoneInput): UserStory {
  const existing = readContract(input.id) as UserStory;

  if (!input.id.startsWith('STORY-')) {
    throw new Error(`${input.id} is not a user story`);
  }

  const updated: UserStory = {
    ...existing,
    definitionOfDone: existing.definitionOfDone.map((item, index) => {
      if (input.indices.includes(index)) {
        return { ...item, completed: true };
      }
      return item;
    }),
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated);
  return updated;
}

/**
 * Add items to definition of done
 */
export function addDefinitionOfDone(id: string, items: string[]): UserStory {
  const existing = readContract(id) as UserStory;

  if (!id.startsWith('STORY-')) {
    throw new Error(`${id} is not a user story`);
  }

  const newItems = items.map(item => ({ item, completed: false }));

  const updated: UserStory = {
    ...existing,
    definitionOfDone: [...existing.definitionOfDone, ...newItems],
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated);
  return updated;
}

/**
 * Answer spike questions
 */
export interface AnswerSpikeQuestionInput {
  id: string;
  questionIndex: number;
  answer: string;
}

export function answerSpikeQuestion(input: AnswerSpikeQuestionInput): Spike {
  const existing = readContract(input.id) as Spike;

  if (!input.id.startsWith('SPIKE-')) {
    throw new Error(`${input.id} is not a spike`);
  }

  const updated: Spike = {
    ...existing,
    questions: existing.questions.map((q, index) => {
      if (index === input.questionIndex) {
        return { ...q, answered: true, answer: input.answer };
      }
      return q;
    }),
    metadata: {
      ...existing.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  writeContract(updated);
  return updated;
}
