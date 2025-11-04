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
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

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

    default:
      throw new Error(`Unknown tool: ${name}`);
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
