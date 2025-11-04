# Installation Guide

Complete guide to installing and configuring Product OS MCP Server.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **Claude Code**: Latest version with MCP support
- **npm**: Comes with Node.js

## Installation Methods

### Method 1: NPM Package (Recommended)

Once published to npm, install via:

```bash
npm install -g @vibeops/product-os-mcp
```

Or as a project dependency:

```bash
cd your-project
npm install --save-dev @vibeops/product-os-mcp
```

### Method 2: From Source (Development)

Clone and build from source:

```bash
# Clone the repository
git clone https://github.com/vibeops/product-os.git
cd product-os/product-os-mcp

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## Configuration

### Step 1: Configure Claude Code

Add the MCP server to your Claude Code configuration file.

**Configuration file location:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

### Step 2: Add MCP Server Entry

**If installed globally via npm:**

```json
{
  "mcpServers": {
    "product-os": {
      "command": "product-os-mcp",
      "cwd": "/path/to/your/project/root"
    }
  }
}
```

**If installed locally in project:**

```json
{
  "mcpServers": {
    "product-os": {
      "command": "npx",
      "args": ["product-os-mcp"],
      "cwd": "/path/to/your/project/root"
    }
  }
}
```

**If running from source:**

```json
{
  "mcpServers": {
    "product-os": {
      "command": "node",
      "args": ["/full/path/to/product-os/product-os-mcp/build/index.js"],
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

### Step 4: Restart Claude Code

After updating the configuration:

1. Quit Claude Code completely
2. Restart Claude Code
3. The MCP server will load automatically

## Verify Installation

### Test the Connection

Open Claude Code and ask:

```
Test the product-os health check
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
cd product-os-mcp
rm -rf build node_modules
npm install
npm run build
```

### Claude Code Can't See Tools

1. Restart Claude Code completely
2. Check config file syntax (valid JSON)
3. Verify no duplicate "product-os" entries
4. Check Claude Code console for errors

## Upgrading

### NPM Package

```bash
# Global installation
npm update -g @vibeops/product-os-mcp

# Project installation
npm update @vibeops/product-os-mcp
```

### From Source

```bash
cd product-os/product-os-mcp
git pull origin main
npm install
npm run build
```

After upgrading, restart Claude Code.

## Uninstalling

### NPM Package

```bash
# Global
npm uninstall -g @vibeops/product-os-mcp

# Project
npm uninstall @vibeops/product-os-mcp
```

### Configuration Cleanup

Remove the MCP server entry from Claude Code config:

```json
{
  "mcpServers": {
    // Remove the "product-os" entry
  }
}
```

Restart Claude Code.

## Multiple Projects

You can configure multiple instances for different projects:

```json
{
  "mcpServers": {
    "product-os-project-a": {
      "command": "product-os-mcp",
      "cwd": "/path/to/project-a"
    },
    "product-os-project-b": {
      "command": "product-os-mcp",
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

- **Issues**: https://github.com/vibeops/product-os/issues
- **Documentation**: https://github.com/vibeops/product-os#readme
