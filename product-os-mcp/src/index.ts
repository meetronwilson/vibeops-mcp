#!/usr/bin/env node

/**
 * Product OS MCP Server
 *
 * Provides Model Context Protocol tools for managing Product OS contracts.
 * Allows Claude Code to naturally create, read, update, and delete
 * modules, features, and issues through conversation.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import {
  getModule,
  getFeature,
  getIssue,
  listModules,
  listFeatures,
  listIssues,
  searchAll,
  getContractSummary,
} from './tools/read.js';
import {
  createModule,
  createFeature,
  createIssue,
} from './tools/create.js';
import {
  updateModule,
  updateFeature,
  updateIssue,
  updateStatus,
  updateAssignee,
  checkAcceptanceCriteria,
  checkDefinitionOfDone,
  addDefinitionOfDone,
  answerSpikeQuestion,
} from './tools/update.js';
import { parseAndImport } from './tools/parse.js';
import { deleteModule, deleteFeature, deleteIssue, archiveItem } from './tools/delete.js';
import { addImplementationFiles, addCommitReference, addPRReference } from './tools/implementation.js';
import { getMyWork, getBlockers, getReadyToStart, getNeedsReview, getInProgress, getHighPriority } from './tools/queries.js';
import { getContractCounts } from './lib/id-generator.js';

// Create MCP server
const server = new Server(
  {
    name: 'product-os',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'health_check',
        description: 'Check if the Product OS MCP server is running correctly',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_module',
        description: 'Get a module by ID with all its details',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Module ID (e.g., MOD-0001)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_feature',
        description: 'Get a feature by ID with its PRD and all details',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Feature ID (e.g., FEAT-0001)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_issue',
        description: 'Get an issue (user story, bug, tech debt, or spike) by ID',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Issue ID (e.g., STORY-0001, BUG-0001, DEBT-0001, SPIKE-0001)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_modules',
        description: 'List all modules, optionally filtered by status or type',
        inputSchema: {
          type: 'object',
          properties: {
            status: {
              type: 'string',
              enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
              description: 'Filter by status',
            },
            type: {
              type: 'string',
              enum: ['theme', 'initiative'],
              description: 'Filter by type',
            },
          },
        },
      },
      {
        name: 'list_features',
        description: 'List all features, optionally filtered',
        inputSchema: {
          type: 'object',
          properties: {
            moduleId: {
              type: 'string',
              description: 'Filter by parent module ID',
            },
            status: {
              type: 'string',
              enum: ['draft', 'ready', 'in-progress', 'in-review', 'completed', 'cancelled'],
              description: 'Filter by status',
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Filter by priority',
            },
          },
        },
      },
      {
        name: 'list_issues',
        description: 'List all issues (stories, bugs, tech debt, spikes), optionally filtered',
        inputSchema: {
          type: 'object',
          properties: {
            featureId: {
              type: 'string',
              description: 'Filter by parent feature ID',
            },
            type: {
              type: 'string',
              enum: ['user-story', 'bug', 'tech-debt', 'spike'],
              description: 'Filter by issue type',
            },
            status: {
              type: 'string',
              description: 'Filter by status',
            },
            assignee: {
              type: 'string',
              description: 'Filter by assignee',
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Filter by priority',
            },
          },
        },
      },
      {
        name: 'search_all',
        description: 'Search across all contracts for a query string',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'get_stats',
        description: 'Get statistics about contracts (counts by type)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_module',
        description: 'Create a new module (theme or initiative) with auto-generated ID',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Module name',
            },
            description: {
              type: 'string',
              description: 'Module description',
            },
            type: {
              type: 'string',
              enum: ['theme', 'initiative'],
              description: 'Module type',
            },
            status: {
              type: 'string',
              enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
              description: 'Module status (default: planning)',
            },
            goals: {
              type: 'array',
              items: { type: 'string' },
              description: 'Module goals',
            },
            owner: {
              type: 'string',
              description: 'Module owner',
            },
            startDate: {
              type: 'string',
              description: 'Start date (ISO 8601)',
            },
            targetDate: {
              type: 'string',
              description: 'Target completion date (ISO 8601)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization',
            },
          },
          required: ['name', 'description', 'type'],
        },
      },
      {
        name: 'create_feature',
        description: 'Create a new feature with PRD and auto-link to parent module',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Feature name',
            },
            description: {
              type: 'string',
              description: 'Feature description',
            },
            moduleId: {
              type: 'string',
              description: 'Parent module ID (e.g., MOD-0001)',
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Feature priority',
            },
            status: {
              type: 'string',
              enum: ['draft', 'ready', 'in-progress', 'in-review', 'completed', 'cancelled'],
              description: 'Feature status (default: draft)',
            },
            prd: {
              type: 'object',
              description: 'Product Requirements Document',
              properties: {
                problem: { type: 'string' },
                solution: { type: 'string' },
                targetUsers: {
                  type: 'array',
                  items: { type: 'string' },
                },
                successCriteria: {
                  type: 'array',
                  items: { type: 'string' },
                },
                outOfScope: {
                  type: 'array',
                  items: { type: 'string' },
                },
                assumptions: {
                  type: 'array',
                  items: { type: 'string' },
                },
                risks: {
                  type: 'array',
                  items: { type: 'string' },
                },
                dependencies: {
                  type: 'array',
                  items: { type: 'string' },
                },
              },
            },
            owner: {
              type: 'string',
              description: 'Feature owner',
            },
            startDate: {
              type: 'string',
              description: 'Start date (ISO 8601)',
            },
            targetDate: {
              type: 'string',
              description: 'Target completion date (ISO 8601)',
            },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags for categorization',
            },
          },
          required: ['name', 'description', 'moduleId', 'priority'],
        },
      },
      {
        name: 'create_issue',
        description: 'Create a new issue (user story, bug, tech debt, or spike) and auto-link to feature',
        inputSchema: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['user-story', 'bug', 'tech-debt', 'spike'],
              description: 'Issue type',
            },
            title: {
              type: 'string',
              description: 'Issue title',
            },
            featureId: {
              type: 'string',
              description: 'Parent feature ID (e.g., FEAT-0001)',
            },
            description: {
              type: 'string',
              description: 'Issue description',
            },
            status: {
              type: 'string',
              description: 'Issue status (auto-set based on type if not provided)',
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Priority (for user stories and tech debt)',
            },
            assignee: {
              type: 'string',
              description: 'Assignee username',
            },
            labels: {
              type: 'array',
              items: { type: 'string' },
              description: 'Issue labels',
            },
            asA: {
              type: 'string',
              description: 'User story: As a...',
            },
            iWant: {
              type: 'string',
              description: 'User story: I want...',
            },
            soThat: {
              type: 'string',
              description: 'User story: So that...',
            },
            acceptanceCriteria: {
              type: 'array',
              items: { type: 'string' },
              description: 'User story: Acceptance criteria',
            },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Bug: Severity level',
            },
            stepsToReproduce: {
              type: 'array',
              items: { type: 'string' },
              description: 'Bug: Steps to reproduce',
            },
            expectedBehavior: {
              type: 'string',
              description: 'Bug: Expected behavior',
            },
            actualBehavior: {
              type: 'string',
              description: 'Bug: Actual behavior',
            },
            environment: {
              type: 'string',
              description: 'Bug: Environment details',
            },
            impact: {
              type: 'string',
              description: 'Tech debt: Impact description',
            },
            effort: {
              type: 'string',
              description: 'Tech debt: Effort estimate',
            },
            questions: {
              type: 'array',
              items: { type: 'string' },
              description: 'Spike: Questions to answer',
            },
            timebox: {
              type: 'object',
              description: 'Spike: Time constraint',
              properties: {
                duration: { type: 'number' },
                unit: { type: 'string' },
                startDate: { type: 'string' },
                endDate: { type: 'string' },
              },
            },
          },
          required: ['type', 'title', 'featureId', 'description'],
        },
      },
      {
        name: 'update_module',
        description: 'Update an existing module',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Module ID (e.g., MOD-0001)',
            },
            name: { type: 'string', description: 'Updated name' },
            description: { type: 'string', description: 'Updated description' },
            type: {
              type: 'string',
              enum: ['theme', 'initiative'],
              description: 'Module type',
            },
            status: {
              type: 'string',
              enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
              description: 'Module status',
            },
            owner: { type: 'string', description: 'Module owner' },
            startDate: { type: 'string', description: 'Start date (ISO 8601)' },
            targetDate: { type: 'string', description: 'Target date (ISO 8601)' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'update_feature',
        description: 'Update an existing feature',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Feature ID (e.g., FEAT-0001)',
            },
            name: { type: 'string', description: 'Updated name' },
            description: { type: 'string', description: 'Updated description' },
            status: {
              type: 'string',
              enum: ['draft', 'ready', 'in-progress', 'in-review', 'completed', 'cancelled'],
              description: 'Feature status',
            },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Priority',
            },
            owner: { type: 'string', description: 'Owner' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags',
            },
            prd: {
              type: 'object',
              description: 'PRD updates (partial)',
              properties: {
                problemStatement: { type: 'string' },
                goals: { type: 'array', items: { type: 'string' } },
                successMetrics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      metric: { type: 'string' },
                      target: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'update_issue',
        description: 'Update an existing issue (any type)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Issue ID (e.g., STORY-0001, BUG-0001)',
            },
            title: { type: 'string', description: 'Updated title' },
            description: { type: 'string', description: 'Updated description' },
            assignee: { type: 'string', description: 'Assignee' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Tags',
            },
            status: { type: 'string', description: 'Status (for user stories)' },
            storyPoints: { type: 'number', description: 'Story points' },
            priority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Priority',
            },
            bugStatus: { type: 'string', description: 'Status (for bugs)' },
            severity: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Severity (for bugs)',
            },
            rootCause: { type: 'string', description: 'Root cause (for bugs)' },
            techDebtStatus: { type: 'string', description: 'Status (for tech debt)' },
            proposedSolution: { type: 'string', description: 'Proposed solution (for tech debt)' },
            techDebtPriority: {
              type: 'string',
              enum: ['critical', 'high', 'medium', 'low'],
              description: 'Priority (for tech debt)',
            },
            spikeStatus: { type: 'string', description: 'Status (for spikes)' },
          },
          required: ['id'],
        },
      },
      {
        name: 'update_status',
        description: 'Quick status update for any contract',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Contract ID (any type)',
            },
            status: {
              type: 'string',
              description: 'New status',
            },
          },
          required: ['id', 'status'],
        },
      },
      {
        name: 'update_assignee',
        description: 'Quick assignee update for issues',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Issue ID',
            },
            assignee: {
              type: 'string',
              description: 'New assignee',
            },
          },
          required: ['id', 'assignee'],
        },
      },
      {
        name: 'check_acceptance_criteria',
        description: 'Mark acceptance criteria as verified for user stories',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User story ID (e.g., STORY-0001)',
            },
            indices: {
              type: 'array',
              items: { type: 'number' },
              description: 'Zero-based indices of criteria to mark verified',
            },
          },
          required: ['id', 'indices'],
        },
      },
      {
        name: 'check_definition_of_done',
        description: 'Mark definition of done items as completed for user stories',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User story ID (e.g., STORY-0001)',
            },
            indices: {
              type: 'array',
              items: { type: 'number' },
              description: 'Zero-based indices of DoD items to mark completed',
            },
          },
          required: ['id', 'indices'],
        },
      },
      {
        name: 'add_definition_of_done',
        description: 'Add new items to definition of done for user stories',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User story ID (e.g., STORY-0001)',
            },
            items: {
              type: 'array',
              items: { type: 'string' },
              description: 'DoD items to add',
            },
          },
          required: ['id', 'items'],
        },
      },
      {
        name: 'answer_spike_question',
        description: 'Answer a spike question',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Spike ID (e.g., SPIKE-0001)',
            },
            questionIndex: {
              type: 'number',
              description: 'Zero-based index of question to answer',
            },
            answer: {
              type: 'string',
              description: 'Answer to the question',
            },
          },
          required: ['id', 'questionIndex', 'answer'],
        },
      },
      {
        name: 'parse_and_import',
        description: 'Parse text (e.g., from ChatGPT) and create contracts. Supports modules, features, and issues.',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'Text to parse (can include modules, features, user stories, bugs, etc.)',
            },
            dryRun: {
              type: 'boolean',
              description: 'If true, only preview what would be created without actually creating contracts',
              default: false,
            },
          },
          required: ['text'],
        },
      },
      {
        name: 'delete_module',
        description: 'Delete a module (with safety checks for features)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Module ID (e.g., MOD-0001)',
            },
            force: {
              type: 'boolean',
              description: 'If true, delete even if module has features (leaves them orphaned)',
              default: false,
            },
            cascade: {
              type: 'boolean',
              description: 'If true, also delete all features and their issues',
              default: false,
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_feature',
        description: 'Delete a feature (with safety checks for issues)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Feature ID (e.g., FEAT-0001)',
            },
            force: {
              type: 'boolean',
              description: 'If true, delete even if feature has issues (leaves them orphaned)',
              default: false,
            },
            cascade: {
              type: 'boolean',
              description: 'If true, also delete all issues',
              default: false,
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_issue',
        description: 'Delete an issue',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Issue ID (e.g., STORY-0001, BUG-0001)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'archive_item',
        description: 'Archive a contract (soft delete by changing status to archived/cancelled/closed)',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Contract ID (any type)',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'add_implementation_files',
        description: 'Link code files to an issue (tracks which files implement this issue)',
        inputSchema: {
          type: 'object',
          properties: {
            issueId: {
              type: 'string',
              description: 'Issue ID (e.g., STORY-0001)',
            },
            files: {
              type: 'array',
              items: { type: 'string' },
              description: 'File paths (e.g., ["src/components/Login.tsx", "src/api/auth.ts"])',
            },
          },
          required: ['issueId', 'files'],
        },
      },
      {
        name: 'add_commit_reference',
        description: 'Link a git commit to an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueId: {
              type: 'string',
              description: 'Issue ID (e.g., STORY-0001)',
            },
            commitHash: {
              type: 'string',
              description: 'Git commit hash (e.g., "abc123def")',
            },
          },
          required: ['issueId', 'commitHash'],
        },
      },
      {
        name: 'add_pr_reference',
        description: 'Link a pull request to an issue',
        inputSchema: {
          type: 'object',
          properties: {
            issueId: {
              type: 'string',
              description: 'Issue ID (e.g., STORY-0001)',
            },
            prNumber: {
              type: 'string',
              description: 'PR number (e.g., "#123" or "123")',
            },
          },
          required: ['issueId', 'prNumber'],
        },
      },
      {
        name: 'get_my_work',
        description: 'Get all issues assigned to a specific person',
        inputSchema: {
          type: 'object',
          properties: {
            assignee: {
              type: 'string',
              description: 'Assignee name',
            },
          },
          required: ['assignee'],
        },
      },
      {
        name: 'get_blockers',
        description: 'Get all blocked issues',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_ready_to_start',
        description: 'Get all user stories that are ready to start',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_needs_review',
        description: 'Get all items that need review',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_in_progress',
        description: 'Get all in-progress items',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_high_priority',
        description: 'Get all high priority or critical items',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'health_check':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'healthy',
                  version: '0.1.0',
                  message: 'Product OS MCP server is running!',
                  cwd: process.cwd(),
                  timestamp: new Date().toISOString(),
                },
                null,
                2
              ),
            },
          ],
        };

      case 'get_module': {
        const module = getModule((args as any).id as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(module, null, 2),
            },
          ],
        };
      }

      case 'get_feature': {
        const feature = getFeature((args as any).id as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(feature, null, 2),
            },
          ],
        };
      }

      case 'get_issue': {
        const issue = getIssue((args as any).id as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issue, null, 2),
            },
          ],
        };
      }

      case 'list_modules': {
        const modules = listModules(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(modules, null, 2),
            },
          ],
        };
      }

      case 'list_features': {
        const features = listFeatures(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(features, null, 2),
            },
          ],
        };
      }

      case 'list_issues': {
        const issues = listIssues(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issues, null, 2),
            },
          ],
        };
      }

      case 'search_all': {
        const results = searchAll((args as any).query as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case 'get_stats': {
        const counts = getContractCounts();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Contract Statistics',
                  counts,
                  total: Object.values(counts).reduce((a, b) => a + b, 0),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'create_module': {
        const module = createModule(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Module created successfully',
                  module,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'create_feature': {
        const feature = createFeature(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Feature created successfully',
                  feature,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'create_issue': {
        const issue = createIssue(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Issue created successfully',
                  issue,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'update_module': {
        const module = updateModule(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Module updated successfully',
                  module,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'update_feature': {
        const feature = updateFeature(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Feature updated successfully',
                  feature,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'update_issue': {
        const issue = updateIssue(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Issue updated successfully',
                  issue,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'update_status': {
        const contract = updateStatus((args as any).id, (args as any).status);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Status updated successfully',
                  contract,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'update_assignee': {
        const issue = updateAssignee((args as any).id, (args as any).assignee);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Assignee updated successfully',
                  issue,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'check_acceptance_criteria': {
        const story = checkAcceptanceCriteria(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Acceptance criteria marked as verified',
                  story,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'check_definition_of_done': {
        const story = checkDefinitionOfDone(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Definition of done items marked as completed',
                  story,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'add_definition_of_done': {
        const story = addDefinitionOfDone((args as any).id, (args as any).items);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Definition of done items added',
                  story,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'answer_spike_question': {
        const spike = answerSpikeQuestion(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Spike question answered',
                  spike,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'parse_and_import': {
        const result = parseAndImport((args as any).text, {
          dryRun: (args as any).dryRun,
        });

        if ((args as any).dryRun) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    message: 'Preview: These contracts would be created',
                    preview: result.preview,
                    summary: {
                      modules: result.preview?.modules.length || 0,
                      features:
                        (result.preview?.modules.reduce((sum, m) => sum + m.features.length, 0) || 0) +
                        (result.preview?.orphanedFeatures.length || 0),
                      issues:
                        (result.preview?.modules.reduce(
                          (sum, m) => sum + m.features.reduce((s, f) => s + f.issues.length, 0),
                          0
                        ) || 0) + (result.preview?.orphanedIssues.length || 0),
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    message: 'Contracts created successfully',
                    created: result.created,
                    summary: {
                      modules: result.created.modules.length,
                      features: result.created.features.length,
                      issues: result.created.issues.length,
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }
      }

      case 'delete_module': {
        const result = deleteModule(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Module deleted',
                  deleted: result.deleted,
                  warnings: result.warnings,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'delete_feature': {
        const result = deleteFeature(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Feature deleted',
                  deleted: result.deleted,
                  warnings: result.warnings,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'delete_issue': {
        const result = deleteIssue(args as any);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Issue deleted',
                  deleted: result.deleted,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'archive_item': {
        const contract = archiveItem((args as any).id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Contract archived',
                  contract,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'add_implementation_files': {
        const issue = addImplementationFiles((args as any).issueId, (args as any).files);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Implementation files added',
                  issue,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'add_commit_reference': {
        const issue = addCommitReference((args as any).issueId, (args as any).commitHash);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Commit reference added',
                  issue,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'add_pr_reference': {
        const issue = addPRReference((args as any).issueId, (args as any).prNumber);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'PR reference added',
                  issue,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_my_work': {
        const issues = getMyWork((args as any).assignee);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  assignee: (args as any).assignee,
                  count: issues.length,
                  issues,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_blockers': {
        const issues = getBlockers();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Blocked issues',
                  count: issues.length,
                  issues,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_ready_to_start': {
        const issues = getReadyToStart();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Issues ready to start',
                  count: issues.length,
                  issues,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_needs_review': {
        const issues = getNeedsReview();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'Issues needing review',
                  count: issues.length,
                  issues,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_in_progress': {
        const issues = getInProgress();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'In-progress issues',
                  count: issues.length,
                  issues,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'get_high_priority': {
        const issues = getHighPriority();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  message: 'High priority issues',
                  count: issues.length,
                  issues,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: errorMessage,
              tool: name,
              arguments: args,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP communication)
  console.error('Product OS MCP server started');
  console.error('Working directory:', process.cwd());
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
