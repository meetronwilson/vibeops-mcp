# Product OS MCP Server

Model Context Protocol server for managing Product OS contracts through natural conversation with Claude Code.

## Installation

### 1. Install Dependencies

```bash
cd product-os-mcp
npm install
npm run build
```

### 2. Configure Claude Code

Add this to your Claude Code MCP settings (usually in `~/Library/Application Support/Claude/claude_desktop_config.json` on Mac):

```json
{
  "mcpServers": {
    "product-os": {
      "command": "node",
      "args": [
        "/Users/ronwilson/Desktop/cursor-projects/3-anckr-internal/vibeops/product-os/product-os-mcp/build/index.js"
      ],
      "cwd": "/Users/ronwilson/Desktop/cursor-projects/3-anckr-internal/vibeops/product-os"
    }
  }
}
```

**Important:** Update the paths to match your actual installation location.

### 3. Restart Claude Code

After adding the configuration, restart Claude Code to load the MCP server.

### 4. Test the Connection

In Claude Code, try:

```
"Test the product-os health check"
```

Claude should respond with server health information.

## Current Features

### Phase 1 - Infrastructure ✅
- ✅ Basic MCP server infrastructure
- ✅ File manager (read/write contracts)
- ✅ ID scanner and generator
- ✅ Health check tool

### Phase 2 - READ Operations ✅
- ✅ get_module, get_feature, get_issue
- ✅ list_modules, list_features, list_issues
- ✅ search_all across all contracts
- ✅ get_stats for contract counts

### Phase 3 - CREATE Operations ✅
- ✅ create_module with auto-ID generation
- ✅ create_feature with auto-linking to parent module
- ✅ create_issue (user story, bug, tech debt, spike) with auto-linking

## Coming Next (Phase 4)

- UPDATE operations (update fields, check off items, status changes)
- Smart Import/Parse (Phase 5)

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Test Locally

```bash
node build/index.js
```

## Project Structure

```
product-os-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/                # MCP tool implementations (coming in Phase 2)
│   ├── lib/
│   │   ├── file-manager.ts   # File I/O operations
│   │   └── id-generator.ts   # ID generation and scanning
│   └── types/
│       └── contracts.ts      # TypeScript contract types
├── build/                    # Compiled JavaScript
└── package.json
```

## Architecture

The MCP server is a **thin wrapper** around existing Product OS functionality:

- **Reuses** existing JSON schemas from `../contracts/schemas/`
- **Reuses** existing validation logic
- **Reuses** existing templates
- **Reuses** existing markdown converter

This ensures a single source of truth for all contract logic.

## Next Steps

See [PLAN.md](../PLAN.md) for the full implementation roadmap.
