/**
 * MEMORY Operations
 *
 * Tools for storing and retrieving Claude session memory
 */

import { writeContract, listAllContracts } from '../lib/file-manager.js';
import { generateId } from '../lib/id-generator.js';
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { getContractsDir } from '../lib/file-manager.js';

export interface Memory {
  id: string;
  sessionId: string;
  timestamp: string;
  context: {
    summary: string;
    keyDecisions?: Array<{
      decision: string;
      reasoning: string;
      timestamp?: string;
    }>;
    workCompleted?: Array<{
      task: string;
      relatedContracts?: string[];
      filesModified?: string[];
    }>;
    pendingTasks?: Array<{
      task: string;
      priority?: 'critical' | 'high' | 'medium' | 'low';
      blockers?: string[];
      context?: string;
    }>;
    learnings?: Array<{
      topic: string;
      insight: string;
      applicationArea?: string;
    }>;
    codePatterns?: Array<{
      pattern: string;
      description: string;
      example?: string;
    }>;
    problems?: Array<{
      problem: string;
      solution: string;
      preventionStrategy?: string;
    }>;
    conversationHighlights?: Array<{
      topic: string;
      userIntent: string;
      outcome: string;
    }>;
  };
  projectContext?: {
    workingDirectory?: string;
    branch?: string;
    environment?: string;
    relatedModules?: string[];
    relatedFeatures?: string[];
  };
  continuityNotes?: {
    nextSteps?: string[];
    importantContext?: string;
    warnings?: string[];
    openQuestions?: string[];
  };
  metrics?: {
    duration?: number;
    contractsCreated?: number;
    contractsModified?: number;
    filesModified?: number;
  };
  metadata: {
    createdAt: string;
    createdBy?: string;
    sessionType?: 'planning' | 'development' | 'debugging' | 'review' | 'research' | 'refactoring';
    tags?: string[];
  };
}

/**
 * Store a new memory snapshot
 */
export interface StoreMemoryInput {
  sessionId?: string;
  summary: string;
  keyDecisions?: Memory['context']['keyDecisions'];
  workCompleted?: Memory['context']['workCompleted'];
  pendingTasks?: Memory['context']['pendingTasks'];
  learnings?: Memory['context']['learnings'];
  codePatterns?: Memory['context']['codePatterns'];
  problems?: Memory['context']['problems'];
  conversationHighlights?: Memory['context']['conversationHighlights'];
  projectContext?: Memory['projectContext'];
  continuityNotes?: Memory['continuityNotes'];
  metrics?: Memory['metrics'];
  sessionType?: Memory['metadata']['sessionType'];
  tags?: string[];
}

export function storeMemory(input: StoreMemoryInput): Memory {
  const id = generateId('MEM');
  const now = new Date().toISOString();

  // Generate sessionId if not provided (based on date and random string)
  const sessionId = input.sessionId || `session-${new Date().toISOString().split('T')[0]}-${Math.random().toString(36).substring(7)}`;

  const memory: Memory = {
    id,
    sessionId,
    timestamp: now,
    context: {
      summary: input.summary,
      ...(input.keyDecisions && { keyDecisions: input.keyDecisions }),
      ...(input.workCompleted && { workCompleted: input.workCompleted }),
      ...(input.pendingTasks && { pendingTasks: input.pendingTasks }),
      ...(input.learnings && { learnings: input.learnings }),
      ...(input.codePatterns && { codePatterns: input.codePatterns }),
      ...(input.problems && { problems: input.problems }),
      ...(input.conversationHighlights && { conversationHighlights: input.conversationHighlights }),
    },
    ...(input.projectContext && { projectContext: input.projectContext }),
    ...(input.continuityNotes && { continuityNotes: input.continuityNotes }),
    ...(input.metrics && { metrics: input.metrics }),
    metadata: {
      createdAt: now,
      ...(input.sessionType && { sessionType: input.sessionType }),
      ...(input.tags && { tags: input.tags }),
    },
  };

  // Write directly to file (Memory is not a Contract type)
  const contractsDir = getContractsDir();
  const memoryDir = join(contractsDir, 'memories');
  const filePath = join(memoryDir, `${id}.json`);

  // Ensure directory exists
  mkdirSync(memoryDir, { recursive: true });

  // Write file
  writeFileSync(filePath, JSON.stringify(memory, null, 2), 'utf-8');

  return memory;
}

/**
 * Get a specific memory by ID
 */
export function getMemory(id: string): Memory {
  const contractsDir = getContractsDir();
  const memoryDir = join(contractsDir, 'memories');
  const filePath = join(memoryDir, `${id}.json`);

  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as Memory;
}

/**
 * List all memories, optionally filtered
 */
export interface ListMemoriesInput {
  sessionId?: string;
  sessionType?: Memory['metadata']['sessionType'];
  tags?: string[];
  limit?: number;
}

export function listMemories(input: ListMemoriesInput = {}): Memory[] {
  const contractsDir = getContractsDir();
  const memoryDir = join(contractsDir, 'memories');

  // Read all memory files
  if (!existsSync(memoryDir)) {
    return [];
  }

  const files = readdirSync(memoryDir).filter((f: string) => f.endsWith('.json'));
  let memories = files.map((file: string) => {
    const content = readFileSync(join(memoryDir, file), 'utf-8');
    return JSON.parse(content) as Memory;
  });

  // Filter by sessionId
  if (input.sessionId) {
    memories = memories.filter((m: Memory) => m.sessionId === input.sessionId);
  }

  // Filter by sessionType
  if (input.sessionType) {
    memories = memories.filter((m: Memory) => m.metadata.sessionType === input.sessionType);
  }

  // Filter by tags
  if (input.tags && input.tags.length > 0) {
    memories = memories.filter((m: Memory) =>
      m.metadata.tags?.some((tag: string) => input.tags!.includes(tag))
    );
  }

  // Sort by timestamp (most recent first)
  memories.sort((a: Memory, b: Memory) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply limit
  if (input.limit && input.limit > 0) {
    memories = memories.slice(0, input.limit);
  }

  return memories;
}

/**
 * Get recent memories (last N sessions)
 */
export function getRecentMemories(limit: number = 5): Memory[] {
  return listMemories({ limit });
}

/**
 * Search memories by keyword
 */
export interface SearchMemoriesInput {
  query: string;
  searchIn?: ('summary' | 'decisions' | 'tasks' | 'learnings' | 'problems' | 'all')[];
  limit?: number;
}

export function searchMemories(input: SearchMemoriesInput): Memory[] {
  const searchIn = input.searchIn || ['all'];
  const query = input.query.toLowerCase();
  const allMemories = listMemories();

  const matches = allMemories.filter(memory => {
    // Search in summary
    if (searchIn.includes('all') || searchIn.includes('summary')) {
      if (memory.context.summary.toLowerCase().includes(query)) {
        return true;
      }
    }

    // Search in decisions
    if (searchIn.includes('all') || searchIn.includes('decisions')) {
      if (memory.context.keyDecisions?.some(d =>
        d.decision.toLowerCase().includes(query) ||
        d.reasoning.toLowerCase().includes(query)
      )) {
        return true;
      }
    }

    // Search in tasks
    if (searchIn.includes('all') || searchIn.includes('tasks')) {
      if (memory.context.workCompleted?.some(w =>
        w.task.toLowerCase().includes(query)
      )) {
        return true;
      }
      if (memory.context.pendingTasks?.some(t =>
        t.task.toLowerCase().includes(query)
      )) {
        return true;
      }
    }

    // Search in learnings
    if (searchIn.includes('all') || searchIn.includes('learnings')) {
      if (memory.context.learnings?.some(l =>
        l.topic.toLowerCase().includes(query) ||
        l.insight.toLowerCase().includes(query)
      )) {
        return true;
      }
    }

    // Search in problems
    if (searchIn.includes('all') || searchIn.includes('problems')) {
      if (memory.context.problems?.some(p =>
        p.problem.toLowerCase().includes(query) ||
        p.solution.toLowerCase().includes(query)
      )) {
        return true;
      }
    }

    return false;
  });

  // Apply limit
  if (input.limit && input.limit > 0) {
    return matches.slice(0, input.limit);
  }

  return matches;
}

/**
 * Get memories related to specific contracts
 */
export function getMemoriesByContract(contractId: string): Memory[] {
  const allMemories = listMemories();

  return allMemories.filter(memory => {
    // Check in workCompleted
    if (memory.context.workCompleted?.some(w =>
      w.relatedContracts?.includes(contractId)
    )) {
      return true;
    }

    // Check in projectContext
    if (contractId.startsWith('MOD-') &&
        memory.projectContext?.relatedModules?.includes(contractId)) {
      return true;
    }

    if (contractId.startsWith('FEAT-') &&
        memory.projectContext?.relatedFeatures?.includes(contractId)) {
      return true;
    }

    return false;
  });
}

/**
 * Get continuation context for resuming work
 * Returns the most recent memory with its continuity notes
 */
export function getContinuationContext(sessionId?: string): {
  lastMemory: Memory | null;
  continuityNotes: Memory['continuityNotes'] | null;
  pendingTasks: Memory['context']['pendingTasks'] | null;
} {
  const memories = sessionId
    ? listMemories({ sessionId, limit: 1 })
    : listMemories({ limit: 1 });

  if (memories.length === 0) {
    return {
      lastMemory: null,
      continuityNotes: null,
      pendingTasks: null,
    };
  }

  const lastMemory = memories[0];

  return {
    lastMemory,
    continuityNotes: lastMemory.continuityNotes || null,
    pendingTasks: lastMemory.context.pendingTasks || null,
  };
}
