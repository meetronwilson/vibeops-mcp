# Installation Guide

Complete guide to installing and configuring VibeOps MCP Server.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Claude Desktop OR Claude Code CLI**: Latest version with MCP support
- **npm**: Comes with Node.js

## Important: Choose Your Platform

This MCP server works with **both Claude Desktop (GUI) and Claude Code (CLI)**, but they use **different configuration files**:

- **Claude Desktop**: GUI application, config at `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Code CLI**: Terminal tool, config at `~/.claude.json` or project `.mcp.json`

Follow the configuration steps for YOUR platform below.

## Installation Methods

### Method 1: NPM Package (Recommended)

Once published to npm, install via:

```bash
npm install -g @vibeops/vibeops
```

Or as a project dependency:

```bash
cd your-project
npm install --save-dev @vibeops/vibeops
```

### Method 2: From Source (Development)

Clone and build from source:

```bash
# Clone the repository
git clone https://github.com/vibeops/vibeops.git
cd vibeops/vibeops

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Configuration

### Option A: Claude Code CLI Configuration

If you're using **Claude Code CLI** (the `claude` terminal command):

**Configuration file locations:**
- **User scope (recommended)**: `~/.claude.json`
- **Project scope**: `.mcp.json` in your project root
- **Enterprise**: System-level managed config files

**Add MCP Server Entry to `~/.claude.json`:**

```json
{
  "mcpServers": {
    "vibeops": {
      "command": "node",
      "args": ["/full/path/to/vibeops/build/index.js"],
      "cwd": "/path/to/your/project/root"
    }
  }
}
```

**Or use the CLI wizard:**
```bash
claude mcp add vibeops --scope user
```

### Option B: Claude Desktop (GUI) Configuration

If you're using **Claude Desktop** (the GUI application):

**Configuration file location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

**Add MCP Server Entry to config file:**

**If installed globally via npm:**

```json
{
  "mcpServers": {
    "vibeops": {
      "command": "vibeops",
      "cwd": "/path/to/your/project/root"
    }
  }
}
```

**If installed locally in project:**

```json
{
  "mcpServers": {
    "vibeops": {
      "command": "npx",
      "args": ["vibeops"],
      "cwd": "/path/to/your/project/root"
    }
  }
}
```

**If running from source:**

```json
{
  "mcpServers": {
    "vibeops": {
      "command": "node",
      "args": ["/full/path/to/vibeops/vibeops/build/index.js"],
      "cwd": "/path/to/your/project/root"
    }
  }
}
```

**Important:** The `cwd` (current working directory) should point to your project root where you want contracts to be created.

### Step 3: Initialize Project Structure

In your project root, create the required directories:

```bash
cd /path/to/your/project
mkdir -p test/modules test/features test/issues
```

Or let Claude Code create them when you create your first contract.

### Step 3: Restart Your Application

**For Claude Code CLI:**
- No restart needed! Start a new terminal session with `claude`
- Or run `claude mcp list` to verify the server is configured

**For Claude Desktop:**
1. Quit Claude Desktop completely
2. Restart Claude Desktop
3. The MCP server will load automatically

## Verify Installation

### Test the Connection

Open Claude Code and ask:

```
Test the vibeops health check
```

You should see a response with:
- Server name and version
- Total contract counts
- Status: "healthy"

### Test Basic Operations

Try these commands to verify everything works:

```
Show me all modules
```

```
What's the current status of all contracts?
```

```
Create a module for user authentication
```

## Troubleshooting

### MCP Server Not Loading

**Check Claude Code logs:**
- Look for MCP server startup messages
- Check for any error messages

**Common issues:**
1. **Path incorrect**: Verify paths in config are absolute, not relative
2. **Node version**: Ensure Node.js >= 18.0.0 (`node --version`)
3. **Build missing**: If running from source, run `npm run build`
4. **Permissions**: Ensure execute permissions on index.js

### Server Starts But Tools Don't Work

**Check working directory:**
```json
"cwd": "/correct/path/to/your/project"
```

Must point to where you want contracts created.

**Create required directories:**
```bash
mkdir -p test/modules test/features test/issues
```

### "Cannot find module" Errors

**Rebuild the project:**
```bash
cd vibeops
rm -rf build node_modules
npm install
npm run build
```

### Claude Code Can't See Tools

1. Restart Claude Code completely
2. Check config file syntax (valid JSON)
3. Verify no duplicate "vibeops" entries
4. Check Claude Code console for errors

## Upgrading

### NPM Package

```bash
# Global installation
npm update -g @vibeops/vibeops

# Project installation
npm update @vibeops/vibeops
```

### From Source

```bash
cd vibeops/vibeops
git pull origin main
npm install
npm run build
```

After upgrading, restart Claude Code.

## Uninstalling

### NPM Package

```bash
# Global
npm uninstall -g @vibeops/vibeops

# Project
npm uninstall @vibeops/vibeops
```

### Configuration Cleanup

Remove the MCP server entry from Claude Code config:

```json
{
  "mcpServers": {
    // Remove the "vibeops" entry
  }
}
```

Restart Claude Code.

## Multiple Projects

You can configure multiple instances for different projects:

```json
{
  "mcpServers": {
    "vibeops-project-a": {
      "command": "vibeops",
      "cwd": "/path/to/project-a"
    },
    "vibeops-project-b": {
      "command": "vibeops",
      "cwd": "/path/to/project-b"
    }
  }
}
```

Each instance runs independently with its own contract storage.

## Next Steps

- Read [WORKFLOW.md](./WORKFLOW.md) for usage examples
- See [README.md](./README.md) for complete feature list
- Check [../PLAN.md](../PLAN.md) for implementation details

## Getting Help

- **Issues**: https://github.com/vibeops/vibeops/issues
- **Documentation**: https://github.com/vibeops/vibeops#readme
