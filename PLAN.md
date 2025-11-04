# Product OS MCP Server - Implementation Plan

## Vision

Build an MCP (Model Context Protocol) server that allows Claude Code to naturally manage product contracts through conversation. Users can paste ideas from ChatGPT, ask Claude to show/update contracts, and have Claude automatically track progress while coding.

---

## Key Questions & Answers

### 1. Full CRUD Operations

**Question:** We need complete CRUD for modules/features/issues, including list operations.

**Answer:** Yes! The MCP server will provide full CRUD:

**CREATE:**
- `create_module` - Create new module from description
- `create_feature` - Create feature with PRD
- `create_issue` - Create story/bug/debt/spike
- `parse_and_import` - Parse text and create multiple items

**READ:**
- `get_module` - Get single module details
- `get_feature` - Get single feature with PRD
- `get_issue` - Get single issue (any type)
- `list_modules` - List all modules with filters
- `list_features` - List features (all or by module)
- `list_issues` - List issues with filters (status, type, assignee, feature)
- `search_all` - Search across all contracts

**UPDATE:**
- `update_module` - Update module fields
- `update_feature` - Update feature/PRD fields
- `update_issue` - Update any issue field
- `update_status` - Quick status change
- `update_assignee` - Quick assignee change
- `check_acceptance_criteria` - Mark AC as verified
- `check_definition_of_done` - Mark DoD items complete
- `add_feature_to_module` - Link feature to module
- `add_issue_to_feature` - Link issue to feature

**DELETE:**
- `delete_module` - Delete module (with safety checks)
- `delete_feature` - Delete feature (with safety checks)
- `delete_issue` - Delete issue
- `archive_item` - Soft delete (change status to archived)

### 2. Reuse Existing Validation & Schemas

**Question:** Will we reuse the contracts and validation logic already written?

**Answer:** Absolutely! 100% reuse:

```
product-os-mcp/
├── src/
│   └── tools/
│       ├── create.ts        # Uses existing templates
│       ├── validate.ts      # Uses existing validator
│       └── update.ts        # Uses existing schemas
└── contracts/               # SYMLINK or COPY from product-os
    ├── schemas/             # ← Same JSON schemas
    ├── templates/           # ← Same templates
    ├── validators/          # ← Same validation logic
    └── converters/          # ← Same MD converter
```

The MCP server is a **thin wrapper** that:
- Calls existing `validateContract()` function
- Uses existing JSON schemas
- Uses existing templates
- Generates IDs with existing pattern
- Converts to MD with existing converter

**No duplication. All validation logic stays in one place.**

### 3. Installation in New Projects

**Question:** How do we install and make Claude Code aware?

**Answer:** Two-part setup:

**Option A: NPM Package (Recommended)**
```bash
# In your new project
npm install --save-dev @vibeops/product-os-mcp

# Initialize
npx product-os init
# Creates: contracts/, .product-os-config.json, updates package.json

# Configure Claude Code to use MCP
# (MCP config goes in Claude Code settings, points to this package)
```

**Option B: Copy Repo (Simpler for now)**
```bash
# Copy this repo into your project
cp -r product-os/ my-project/.product-os/

# Configure MCP server path in Claude Code settings
```

**Making Claude Code Aware:**
1. Claude Code has MCP server settings
2. Add entry pointing to product-os-mcp
3. Restart Claude Code
4. Tools automatically available in conversation

**Example MCP config** (in Claude Code settings):
```json
{
  "mcpServers": {
    "product-os": {
      "command": "node",
      "args": ["/path/to/product-os-mcp/build/index.js"],
      "cwd": "/path/to/your-project"
    }
  }
}
```

Or if installed via npm:
```json
{
  "mcpServers": {
    "product-os": {
      "command": "npx",
      "args": ["-y", "@vibeops/product-os-mcp"]
    }
  }
}
```

### 4. Tying Contracts to Actual Project Code

**Question:** How do we connect these contracts to the actual code being built?

**Answer:** Multiple integration points:

**4a. File References in Contracts**
Add optional `implementation` field to schemas:
```json
{
  "id": "STORY-0006",
  "title": "Drag and drop deals",
  "implementation": {
    "files": [
      "src/components/Pipeline/DealCard.tsx",
      "src/components/Pipeline/Board.tsx",
      "src/api/deals.ts"
    ],
    "prs": ["#123"],
    "commits": ["abc123", "def456"]
  }
}
```

**4b. Claude Code Workflow**
```
You: "Start working on STORY-0006"

Claude Code:
1. Calls get_issue("STORY-0006")
2. Reads AC, DoD, context
3. Asks: "Should I create new files or update existing?"
4. Creates/updates code
5. As it codes, updates contract:
   - Adds file paths to implementation.files
   - Checks off DoD items
   - Updates status
6. When done: marks complete, updates timestamps
```

**4c. Git Commit Integration**
```bash
# Git commit hook (optional)
git commit -m "Implement drag and drop [STORY-0006]"

# Hook extracts STORY-0006, updates contract:
- Adds commit hash
- Updates "lastWorkedOn" timestamp
- Optionally prompts for DoD progress
```

**4d. Bidirectional Navigation**
```
# In code comments:
// STORY-0006: Drag and drop functionality
export const DealCard = () => { ... }

# Claude can:
- Read comment, call get_issue("STORY-0006") for context
- Update contract when modifying this code
- Link code ↔ contract automatically
```

**4e. Status Dashboard**
```bash
# Ask Claude:
"Show me which stories have code but aren't complete"
"What files are related to the authentication module?"
"Which stories touch the Pipeline component?"

# Claude can cross-reference contracts ↔ code
```

---

## Implementation Plan

### Phase 1: Core MCP Server Infrastructure ⬜
**Goal:** Basic MCP server that can read/list contracts

**Tasks:**
- [ ] 1.1 Set up MCP server project structure
- [ ] 1.2 Create basic MCP server entry point
- [ ] 1.3 Implement file manager (read contracts from disk)
- [ ] 1.4 Implement ID scanner (find all contracts, next IDs)
- [ ] 1.5 Test MCP server runs and Claude can connect

**Deliverables:**
- MCP server runs
- Claude Code can see it's connected
- Basic health check tool works

**Time Estimate:** 2-3 hours

---

### Phase 2: READ Operations ⬜
**Goal:** Claude can view any contract naturally

**Tools to Implement:**
- [ ] 2.1 `get_module(id)` - Get single module
- [ ] 2.2 `get_feature(id)` - Get single feature
- [ ] 2.3 `get_issue(id)` - Get single issue (any type)
- [ ] 2.4 `list_modules(filters?)` - List all/filtered modules
- [ ] 2.5 `list_features(moduleId?, filters?)` - List features
- [ ] 2.6 `list_issues(featureId?, type?, status?, assignee?)` - List issues
- [ ] 2.7 `search_all(query)` - Search across all contracts

**Test Conversations:**
```
You: "Show me all modules"
You: "What features are in the authentication module?"
You: "List all in-progress stories"
You: "Show me STORY-0006"
You: "Find anything related to pipeline"
```

**Deliverables:**
- All READ tools working
- Claude can view contracts naturally
- Filtering/search works

**Time Estimate:** 3-4 hours

---

### Phase 3: CREATE Operations ✅
**Goal:** Create new contracts from conversation

**Tools to Implement:**
- [x] 3.1 `create_module(data)` - Create module with validation
- [x] 3.2 `create_feature(data)` - Create feature with auto-linking
- [x] 3.3 `create_issue(data)` - Create any issue type
- [x] 3.4 Auto ID generation
- [x] 3.5 Auto timestamp generation
- [x] 3.6 Auto parent-child linking
- [x] 3.7 Validation using existing schemas
- [ ] 3.8 Auto markdown generation (deferred to Phase 9)

**Test Conversations:**
```
You: "Create a module for user authentication"
You: "Add a login feature to MOD-0004"
You: "Create a story for email login in FEAT-0007"
```

**Deliverables:**
- ✅ Can create any contract type
- ✅ IDs auto-generated
- ✅ Timestamps auto-generated
- ✅ Auto-linked to parents
- ⬜ Markdown generated (will add in Phase 9)

**Time Estimate:** 4-5 hours
**Actual Time:** ~3 hours

---

### Phase 4: UPDATE Operations ⬜
**Goal:** Update existing contracts easily

**Tools to Implement:**
- [ ] 4.1 `update_module(id, changes)` - Update module fields
- [ ] 4.2 `update_feature(id, changes)` - Update feature/PRD
- [ ] 4.3 `update_issue(id, changes)` - Update issue fields
- [ ] 4.4 `update_status(id, status)` - Quick status change
- [ ] 4.5 `update_assignee(id, assignee)` - Quick assignment
- [ ] 4.6 `check_acceptance_criteria(id, criteria_indices)` - Mark AC verified
- [ ] 4.7 `check_definition_of_done(id, dod_indices)` - Mark DoD complete
- [ ] 4.8 `add_issue_to_feature(featureId, issueId)` - Link issue
- [ ] 4.9 Update timestamps automatically
- [ ] 4.10 Regenerate markdown after updates

**Test Conversations:**
```
You: "Update STORY-0006 status to in-progress"
You: "Assign STORY-0006 to me"
You: "Check off the first 2 acceptance criteria for STORY-0006"
You: "Mark DoD items 1, 2, and 3 as complete"
```

**Deliverables:**
- All update operations work
- Validation enforced
- Timestamps auto-updated
- Markdown regenerated

**Time Estimate:** 3-4 hours

---

### Phase 5: Smart Import/Parse ⬜
**Goal:** Paste ChatGPT output and get contracts

**Tools to Implement:**
- [ ] 5.1 `parse_and_import(text, options?)` - Main parser
- [ ] 5.2 Detect freeform vs structured text
- [ ] 5.3 Extract modules from text
- [ ] 5.4 Extract features from text
- [ ] 5.5 Extract issues from text
- [ ] 5.6 Extract acceptance criteria
- [ ] 5.7 Extract PRD elements
- [ ] 5.8 Create all contracts from parsed data
- [ ] 5.9 Link hierarchy automatically
- [ ] 5.10 Handle ambiguous input (ask clarifying questions)

**Test Conversations:**
```
You: "Here's what ChatGPT came up with:
[pastes 2 pages of product ideas]"

Claude: "I found:
- 1 Module: Authentication
- 3 Features: Login, Signup, OAuth
- 12 User Stories
- 2 Tech Debt items

Should I create these?"

You: "Yes"
Claude: [Creates all contracts]
```

**Deliverables:**
- Can parse freeform text
- Can parse structured output
- Creates complete hierarchy
- Validates all contracts
- Asks for clarification when needed

**Time Estimate:** 5-6 hours

---

### Phase 6: DELETE/Archive Operations ⬜
**Goal:** Remove or archive contracts safely

**Tools to Implement:**
- [ ] 6.1 `delete_module(id, force?)` - Delete with safety checks
- [ ] 6.2 `delete_feature(id, force?)` - Delete with safety checks
- [ ] 6.3 `delete_issue(id)` - Delete issue
- [ ] 6.4 `archive_item(id)` - Soft delete (status=archived)
- [ ] 6.5 Safety: Warn if deleting module with features
- [ ] 6.6 Safety: Warn if deleting feature with issues
- [ ] 6.7 Cascade option (delete children too)
- [ ] 6.8 Update parent references

**Test Conversations:**
```
You: "Delete STORY-0010"
You: "Archive the authentication module"
You: "Delete MOD-0004 and all its features and issues"
```

**Deliverables:**
- Can delete any contract
- Safety warnings work
- Can archive instead of delete
- Parent references updated

**Time Estimate:** 2-3 hours

---

### Phase 7: Development Integration ⬜
**Goal:** Claude tracks progress while coding

**Features to Implement:**
- [ ] 7.1 Add `implementation` field to issue schemas
- [ ] 7.2 Tool: `add_implementation_files(issueId, files[])`
- [ ] 7.3 Tool: `add_commit_reference(issueId, commitHash)`
- [ ] 7.4 Tool: `add_pr_reference(issueId, prNumber)`
- [ ] 7.5 Update CLAUDE.md with development workflow
- [ ] 7.6 Add code comment → contract linking docs
- [ ] 7.7 Git commit hook template (optional)
- [ ] 7.8 Auto-update contracts when Claude codes

**Workflow Documentation:**
```
When starting work on an issue:
1. Call get_issue(id) to understand requirements
2. Create/update files
3. Call add_implementation_files(id, files)
4. As DoD items complete, check them off
5. When done, update status to completed
```

**Deliverables:**
- Implementation tracking in contracts
- Claude can link code ↔ contracts
- Workflow documented in CLAUDE.md
- Optional git hooks provided

**Time Estimate:** 3-4 hours

---

### Phase 8: Enhanced Features ⬜
**Goal:** Nice-to-have improvements

**Features:**
- [ ] 8.1 `get_stats()` - Progress statistics
- [ ] 8.2 `get_my_work(assignee)` - What's assigned to me
- [ ] 8.3 `get_blockers()` - All blocked items
- [ ] 8.4 `get_ready_to_start()` - Issues with DoR complete
- [ ] 8.5 `get_needs_review()` - In-review items
- [ ] 8.6 Bulk operations (update multiple items)
- [ ] 8.7 Templates for common contract patterns
- [ ] 8.8 Export to other formats (CSV, JIRA, Linear)

**Deliverables:**
- Enhanced query capabilities
- Better productivity features
- Integration options

**Time Estimate:** 4-5 hours

---

### Phase 9: Documentation & Polish ⬜
**Goal:** Make it easy for others to use

**Tasks:**
- [ ] 9.1 Update CLAUDE.md with all MCP tools
- [ ] 9.2 Create INSTALLATION.md guide
- [ ] 9.3 Create WORKFLOW.md with examples
- [ ] 9.4 Add inline code documentation
- [ ] 9.5 Create example projects
- [ ] 9.6 Add error handling and helpful messages
- [ ] 9.7 Create troubleshooting guide
- [ ] 9.8 Add tests for critical functions

**Deliverables:**
- Complete documentation
- Example usage
- Error messages helpful
- Ready for others to use

**Time Estimate:** 3-4 hours

---

### Phase 10: Package & Distribution ⬜
**Goal:** Make it installable anywhere

**Tasks:**
- [ ] 10.1 Set up npm package structure
- [ ] 10.2 Create package.json
- [ ] 10.3 Build/compile setup
- [ ] 10.4 Create `init` command for new projects
- [ ] 10.5 Test installation in fresh project
- [ ] 10.6 Publish to npm (private or public)
- [ ] 10.7 Version management strategy
- [ ] 10.8 Update/migration guides

**Deliverables:**
- NPM package published
- Can install in any project
- Init command works
- Versioning strategy

**Time Estimate:** 3-4 hours

---

## Total Estimated Time

- Phase 1: 2-3 hours
- Phase 2: 3-4 hours
- Phase 3: 4-5 hours
- Phase 4: 3-4 hours
- Phase 5: 5-6 hours
- Phase 6: 2-3 hours
- Phase 7: 3-4 hours
- Phase 8: 4-5 hours
- Phase 9: 3-4 hours
- Phase 10: 3-4 hours

**Total: 32-46 hours** (~1-2 weeks)

**MVP (Phases 1-5): 17-23 hours** (~3-5 days)

---

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] Claude can read all contracts naturally
- [ ] Claude can create contracts from conversation
- [ ] Claude can update contracts (status, assignee, checklists)
- [ ] Can import ChatGPT output
- [ ] All existing validation/schemas reused
- [ ] Works in at least one real project

### Full Product
- [ ] Complete CRUD operations
- [ ] Smart parsing handles any input format
- [ ] Development integration (code ↔ contracts)
- [ ] Can install in any project via npm
- [ ] Documented and ready for team use
- [ ] Handles edge cases gracefully

---

## Technical Architecture

### Repository Structure
```
product-os-mcp/
├── src/
│   ├── index.ts                 # MCP server entry
│   ├── server.ts                # MCP server setup
│   ├── tools/
│   │   ├── create.ts            # CREATE operations
│   │   ├── read.ts              # READ operations
│   │   ├── update.ts            # UPDATE operations
│   │   ├── delete.ts            # DELETE operations
│   │   ├── parse.ts             # Import/parse operations
│   │   └── stats.ts             # Analytics/queries
│   ├── lib/
│   │   ├── file-manager.ts      # File I/O
│   │   ├── id-generator.ts      # ID generation
│   │   ├── validator.ts         # Wrapper around existing validator
│   │   ├── linker.ts            # Parent-child linking
│   │   ├── parser.ts            # Text parsing logic
│   │   └── timestamp.ts         # ISO timestamp helpers
│   ├── contracts/               # Symlink to product-os contracts
│   │   ├── schemas/
│   │   ├── templates/
│   │   ├── validators/
│   │   └── converters/
│   └── types/
│       └── contracts.ts         # TypeScript types
├── build/                       # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

### Key Design Principles

1. **Reuse Everything**: Don't duplicate validation, schemas, or templates
2. **Thin Wrapper**: MCP server just exposes existing logic via tools
3. **Fail Safe**: Validate before writing, never corrupt contracts
4. **Auto-Link**: Always maintain parent-child relationships
5. **Conversational**: Tools designed for natural language, not commands
6. **Atomic**: Updates either fully succeed or fully fail
7. **Timestamps**: Always update metadata automatically
8. **Markdown Sync**: Keep .md files in sync with .json

---

## Next Steps

1. ✅ Review this plan with user
2. ⬜ Get approval on architecture decisions
3. ⬜ Start Phase 1: Core MCP Infrastructure
4. ⬜ Test with real ChatGPT output examples
5. ⬜ Iterate based on real usage

---

## Open Questions

1. **MCP Server Location**:
   - Separate repo or subdirectory of product-os?
   - Recommendation: Separate repo, easier to version/publish

2. **Contract Storage**:
   - Keep current structure (modules/, features/, issues/)?
   - Or flatten (all in contracts/ with type prefix)?
   - Recommendation: Keep current structure, more intuitive

3. **Validation Strictness**:
   - Block invalid contracts or allow with warnings?
   - Recommendation: Block by default, flag to force

4. **Markdown Generation**:
   - Always auto-generate or manual trigger?
   - Recommendation: Always auto-generate, it's cheap

5. **Multi-Project Support**:
   - One MCP server per project or shared?
   - Recommendation: Per project (cleaner boundaries)

---

## Risks & Mitigations

**Risk 1: Text parsing is unreliable**
- Mitigation: Always confirm with user before creating
- Mitigation: Allow manual editing after parse

**Risk 2: Contract corruption**
- Mitigation: Validate before writing
- Mitigation: Git is backup, can always revert
- Mitigation: Atomic operations

**Risk 3: ID collisions**
- Mitigation: Scan all existing before generating
- Mitigation: Lock file during creation (if needed)

**Risk 4: Claude updates wrong contract**
- Mitigation: Always show what's being updated
- Mitigation: Require confirmation for destructive ops

**Risk 5: MCP server performance with many contracts**
- Mitigation: Cache in memory, watch for changes
- Mitigation: Index for fast searching
- Mitigation: Test with 1000+ contracts

---

## Future Enhancements (Post-MVP)

- Web UI for browsing contracts
- Real-time collaboration (multiple users)
- Integration with Jira/Linear/GitHub Issues
- Analytics dashboard
- Automated testing based on contracts
- Code generation from contracts
- Contract versioning/history
- Templates library
- AI-powered suggestions
- Bulk import from CSV/Excel
- Export to various formats
- Mobile app for status updates
- Slack/Discord integration
- Time tracking integration
- Burndown charts and reports
