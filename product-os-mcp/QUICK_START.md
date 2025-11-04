# Quick Start Guide

Get started with Product OS MCP Server in 5 minutes.

## Install

```bash
npm install -g @vibeops/product-os-mcp
```

Or in your project:

```bash
npm install --save-dev @vibeops/product-os-mcp
```

## Configure Claude Code

Edit your Claude Code config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "product-os": {
      "command": "product-os-mcp",
      "cwd": "/path/to/your/project"
    }
  }
}
```

## Create Project Structure

```bash
cd /path/to/your/project
mkdir -p test/modules test/features test/issues
```

## Restart Claude Code

Quit and restart Claude Code to load the MCP server.

## Test It

In Claude Code, try:

```
Test the product-os health check
```

You should see server status and contract counts.

## Create Your First Contracts

```
Create a module for user authentication
```

```
Add a login feature to that module
```

```
Create a story for the login form in that feature
```

## View Contracts

```
Show me all modules
```

```
Show me STORY-0001
```

## Next Steps

- Read [WORKFLOW.md](./WORKFLOW.md) for detailed examples
- See [INSTALLATION.md](./INSTALLATION.md) for troubleshooting
- Check [README.md](./README.md) for all 35 tools

## Common Commands

**Create contracts:**
- "Create a module for [feature area]"
- "Add a feature for [functionality]"
- "Create a story for [user action]"

**View contracts:**
- "Show me all modules"
- "List features in MOD-0001"
- "Show me STORY-0005"

**Update progress:**
- "Mark STORY-0001 as in-progress"
- "Check off the first acceptance criterion"
- "Add these files to STORY-0001: [file list]"

**Query work:**
- "What's assigned to me?"
- "Show me all blockers"
- "What needs review?"

## Import from ChatGPT

Paste ChatGPT brainstorming output directly:

```
I brainstormed with ChatGPT. Here's what we came up with:

Module: Sales Pipeline
Description of the module...

Feature: Drag and Drop
Description of the feature...

Story: Move Deal Card
As a sales rep, I want to...
```

Claude will parse and create all contracts automatically!

## Tips

1. **Natural language**: Just ask normally, no special syntax
2. **Preview first**: Use dry-run mode for large imports
3. **Link code**: Add files as you create them
4. **Update often**: Keep status and checklists current
5. **Archive, don't delete**: Preserve history

## Help

- Issues: https://github.com/vibeops/product-os/issues
- Docs: https://github.com/vibeops/product-os#readme
