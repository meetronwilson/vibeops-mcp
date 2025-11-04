# Product OS MCP Server

**Model Context Protocol server for managing Product OS contracts through natural conversation with Claude Code.**

Turn your product ideas into structured contracts that track implementation, link to code, and maintain a complete audit trail—all through natural conversation.

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

### Phase 4 - UPDATE Operations ✅
- ✅ update_module, update_feature, update_issue
- ✅ update_status (quick status change for any contract)
- ✅ update_assignee (quick assignee change for issues)
- ✅ check_acceptance_criteria (mark AC as verified)
- ✅ check_definition_of_done (mark DoD items complete)
- ✅ add_definition_of_done (add new DoD items)
- ✅ answer_spike_question (answer spike questions)

### Phase 5 - Smart Import/Parse ✅
- ✅ parse_and_import (parse text and create contracts)
- ✅ Module/Feature/Issue detection from text
- ✅ PRD extraction (problem, goals, scope)
- ✅ Acceptance criteria extraction
- ✅ Dry-run preview mode
- ✅ Automatic hierarchy creation and linking

### Phase 6 - DELETE/Archive Operations ✅
- ✅ delete_module, delete_feature, delete_issue
- ✅ Safety checks (prevent deleting parents with children)
- ✅ Cascade deletion support
- ✅ archive_item (soft delete via status change)
- ✅ Automatic parent reference cleanup

### Phase 7 - Development Integration ✅
- ✅ add_implementation_files (link code files to issues)
- ✅ add_commit_reference (link git commits)
- ✅ add_pr_reference (link pull requests)
- ✅ Bidirectional code ↔ contract tracking
- ✅ Implementation field on all issue types

### Phase 8 - Enhanced Features ✅
- ✅ get_my_work (filter by assignee)
- ✅ get_blockers (all blocked items)
- ✅ get_ready_to_start (ready user stories)
- ✅ get_needs_review (items in review)
- ✅ get_in_progress (all active work)
- ✅ get_high_priority (critical/high priority)
- ✅ get_stats (contract counts)

## Complete Feature Set

**Total Tools: 35**

### Core CRUD (12 tools)
- CREATE: create_module, create_feature, create_issue
- READ: get_module, get_feature, get_issue, list_modules, list_features, list_issues
- UPDATE: update_module, update_feature, update_issue
- DELETE: delete_module, delete_feature, delete_issue

### Quick Operations (6 tools)
- update_status, update_assignee
- check_acceptance_criteria, check_definition_of_done, add_definition_of_done
- answer_spike_question

### Smart Features (3 tools)
- parse_and_import (with dry-run preview)
- search_all
- archive_item

### Development Integration (3 tools)
- add_implementation_files
- add_commit_reference
- add_pr_reference

### Enhanced Queries (7 tools)
- get_my_work
- get_blockers
- get_ready_to_start
- get_needs_review
- get_in_progress
- get_high_priority
- get_stats

### Utilities (1 tool)
- health_check

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

## Usage Examples

### Create Contracts from ChatGPT Output

```
You: I brainstormed with ChatGPT. Here's what we came up with:

Module: User Authentication
This module handles all user authentication and security features.

Feature: Email Login
Users need to securely log in with email and password.

Story: Login Form
As a user, I want to log in with email and password
So that I can access my account securely

Acceptance Criteria:
- Email validation works
- Password is masked
- Error messages are clear

Claude: [Parses and creates MOD-0004, FEAT-0007, STORY-0015 automatically]
```

### Track Implementation Progress

```
You: I'm working on STORY-0015

Claude: [Calls get_issue("STORY-0015"), shows AC and DoD]

You: I created Login.tsx and auth.ts

Claude: [Calls add_implementation_files("STORY-0015", ["src/components/Login.tsx", "src/api/auth.ts"])]

You: Check off the first two acceptance criteria

Claude: [Calls check_acceptance_criteria("STORY-0015", [0, 1])]

You: Mark it done

Claude: [Calls update_status("STORY-0015", "done")]
```

### Query Your Work

```
You: What's assigned to me?
Claude: [Calls get_my_work("yourname"), shows 5 items]

You: Show me what needs review
Claude: [Calls get_needs_review(), shows 3 items]

You: Any blockers?
Claude: [Calls get_blockers(), shows 1 blocked item]
```

## Project Structure

```
product-os-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── tools/
│   │   ├── read.ts           # READ operations
│   │   ├── create.ts         # CREATE operations
│   │   ├── update.ts         # UPDATE operations
│   │   ├── delete.ts         # DELETE operations
│   │   ├── parse.ts          # Smart import/parse
│   │   ├── implementation.ts # Code tracking
│   │   └── queries.ts        # Enhanced queries
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

## Workflow

1. **Ideate** with ChatGPT → Get product ideas
2. **Import** via Claude Code → Parse and create contracts
3. **Review** contracts → Natural language queries
4. **Develop** features → Code and track implementation
5. **Update** progress → Check off AC/DoD, update status
6. **Link** code → Automatic file/commit/PR tracking

## Phases Complete

✅ **Phase 1**: Infrastructure
✅ **Phase 2**: READ Operations
✅ **Phase 3**: CREATE Operations
✅ **Phase 4**: UPDATE Operations
✅ **Phase 5**: Smart Import/Parse
✅ **Phase 6**: DELETE/Archive Operations
✅ **Phase 7**: Development Integration
✅ **Phase 8**: Enhanced Features
⬜ **Phase 9**: Documentation & Polish (in progress)
⬜ **Phase 10**: Package & Distribution (planned)

See [PLAN.md](../PLAN.md) for complete implementation details.
