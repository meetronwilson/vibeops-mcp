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
