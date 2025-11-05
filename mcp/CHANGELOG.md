# Changelog

All notable changes to the VibeOps MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.1] - 2025-01-05

### Fixed
- **Memory Storage ESM Compatibility**: Removed CommonJS `require()` statements that were causing "require is not defined" errors in memory storage operations
  - Fixed `src/lib/id-generator.ts`: Changed `require('./file-manager.js')` to proper ESM import of `listAllContracts`
  - Fixed `src/lib/file-manager.ts`: Changed `require('fs')` to import `unlinkSync` at top of file
  - All MCP tools now properly support ESM module syntax
  - Memory storage (`store_memory`, `get_memory`, etc.) now works correctly

## [2.0.0] - 2025-01-20

### Added - Feature Overlap Detection System 🎉

**Major new capabilities to prevent duplicate functionality and maintain healthy feature dependencies:**

#### New Schema Fields
- **`capabilityTags`**: 50+ predefined tags for categorizing feature capabilities (ai-scheduling, task-management, etc.)
- **`targetUsers`**: Explicit user targeting to detect overlap (Superintendents, Project Managers, etc.)
- **`relatedFeatures`**: Structured relationships between features with 10 relationship types:
  - `depends-on`, `provides-data-to`, `consumes-data-from`, `overlaps-with`, `complements`, `supersedes`, `blocks`, `integrates-with`, `extends`, `replaced-by`
- **`dataContract`**: Explicit data inputs/outputs with consumers and producers tracking
- **`relatedModules`**: Cross-module relationships and integration points at module level

#### New MCP Tools (3)
- **`check_feature_overlap`**: Detect overlaps before creating/updating features
  - Analyzes capability tag overlap (3+ = HIGH, 2+ = MEDIUM severity)
  - Semantic similarity detection in problem statements
  - Scope conflict identification (inScope vs outOfScope)
  - Target user overlap checking
  - Returns severity-ranked results with actionable recommendations

- **`validate_feature_graph`**: Complete dependency graph validation
  - Circular dependency detection using DFS algorithm
  - Missing feature reference checks
  - Orphaned feature identification (no relationships)
  - Data contract consistency validation
  - Module boundary violation detection
  - Asymmetric relationship detection
  - Comprehensive validation report with statistics

- **`search_similar_features`**: Semantic search for similar features
  - Problem statement similarity analysis
  - Scope overlap detection
  - Goal matching
  - Keyword search with stop-word filtering
  - Jaccard similarity scoring

#### Enhanced Templates & Examples
- **Enhanced Feature Template**: Updated with all new fields and inline documentation
- **FEAT-002-enhanced.json**: Proactive Scheduling example with full relationships and data contracts
- **FEAT-0055-enhanced.json**: Course Area Task Management showing proper separation of concerns

#### Comprehensive Documentation
- **OVERLAP-DETECTION-GUIDE.md**: 15,000+ word complete guide with usage examples, workflows, best practices
- **MCP-INTEGRATION-GUIDE.md**: Step-by-step integration instructions, CI/CD setup, testing procedures
- **IMPLEMENTATION-SUMMARY.md**: Detailed overview of all changes and next steps

### Changed - Complete Rebranding

**All references updated from "product-os" to "vibeops":**
- Folder structure: `product-os/product-os-mcp/` → `vibeops-mcp/mcp/`
- Package maintained as `@anckr/vibeops`
- Repository: https://github.com/meetronwilson/vibeops-mcp (updated from product-os)
- All documentation files updated (17 files)
- All package.json and config files updated

### Benefits
- ✅ Prevents accidental feature duplication
- ✅ Makes dependencies explicit and trackable
- ✅ Ensures clear feature boundaries
- ✅ Validates data flow consistency
- ✅ Supports CI/CD integration for automatic validation
- ✅ Enables better architecture decisions

### Breaking Changes
- **Schema Changes**: Features now require `capabilityTags` and `targetUsers` fields (use enhanced templates)
- **Folder Structure**: Changed from `product-os-mcp/` to `mcp/` (update paths in configs)
- Migration guide available in OVERLAP-DETECTION-GUIDE.md

### Migration Guide
See OVERLAP-DETECTION-GUIDE.md for complete migration instructions. Quick steps:
1. Add `capabilityTags` to existing features (minimum 1 tag)
2. Add `targetUsers` array (who uses this feature)
3. Add `relatedFeatures` for known dependencies
4. Optionally add `dataContract` for integration clarity

---

## [1.2.6] - 2025-11-04

### Fixed
- **Comprehensive Null-Safety in Markdown Converter**: Fixed all remaining "Cannot read properties of undefined (reading 'map')" errors
  - Added null checks for ALL array operations in markdown-converter.ts:
    - Feature PRD: `goals`, `successMetrics`, `scope.inScope` arrays
    - User Story: `acceptanceCriteria`, `definitionOfDone`, `definitionOfReady` arrays
    - Bug: `reproductionSteps` array
    - Tech Debt: `impact.areas`, `impact.metrics` arrays
    - Spike: `questions`, `objectives` arrays
  - Now gracefully handles malformed contracts with undefined arrays
  - Displays helpful messages like "_No goals specified_" instead of crashing
  - The `generate_docs_site` tool should now work reliably with all contracts

**IMPORTANT**: After updating, you MUST restart Claude Code completely (quit and relaunch) to load the new version. The MCP server process needs to reload the package code.

---

## [1.0.0] - 2025-11-04

### Added - Initial Release

#### Phase 1: Core Infrastructure
- MCP server with stdio transport
- File manager for reading/writing JSON contracts
- ID scanner and generator for sequential IDs
- Health check tool

#### Phase 2: READ Operations (8 tools)
- `get_module` - Get single module by ID
- `get_feature` - Get single feature by ID
- `get_issue` - Get single issue by ID
- `list_modules` - List all modules with filters
- `list_features` - List features with filters
- `list_issues` - List issues with filters
- `search_all` - Search across all contracts
- `get_stats` - Get contract statistics

#### Phase 3: CREATE Operations (3 tools)
- `create_module` - Create modules with auto-ID generation
- `create_feature` - Create features with auto-linking to modules
- `create_issue` - Create issues (user-story, bug, tech-debt, spike) with auto-linking
- Auto-generated IDs with prefixes (MOD-, FEAT-, STORY-, BUG-, DEBT-, SPIKE-)
- Auto-generated timestamps (createdAt, updatedAt)
- Automatic parent-child relationship maintenance

#### Phase 4: UPDATE Operations (9 tools)
- `update_module` - Update module fields
- `update_feature` - Update feature and PRD fields
- `update_issue` - Update any issue field
- `update_status` - Quick status change
- `update_assignee` - Quick assignee change
- `check_acceptance_criteria` - Mark acceptance criteria as verified
- `check_definition_of_done` - Mark DoD items as complete
- `add_definition_of_done` - Add new DoD items
- `answer_spike_question` - Answer spike questions

#### Phase 5: Smart Import/Parse (1 tool)
- `parse_and_import` - Parse text and create multiple contracts
- Dry-run preview mode
- Module/Feature/Issue detection from structured text
- PRD extraction (problem, goals, scope)
- Acceptance criteria extraction
- Automatic hierarchy creation and linking

#### Phase 6: DELETE/Archive Operations (4 tools)
- `delete_module` - Delete modules with safety checks
- `delete_feature` - Delete features with safety checks
- `delete_issue` - Delete issues
- `archive_item` - Soft delete via status change
- Cascade deletion support
- Automatic parent reference cleanup

#### Phase 7: Development Integration (3 tools)
- `add_implementation_files` - Link code files to issues
- `add_commit_reference` - Link git commits to issues
- `add_pr_reference` - Link pull requests to issues
- Implementation interface added to all issue types
- Bidirectional code ↔ contract tracking

#### Phase 8: Enhanced Features (7 tools)
- `get_my_work` - Filter issues by assignee
- `get_blockers` - Get all blocked items
- `get_ready_to_start` - Get ready user stories
- `get_needs_review` - Get items in review
- `get_in_progress` - Get all active work
- `get_high_priority` - Get critical/high priority items
- Enhanced productivity queries

#### Documentation
- Complete README.md with usage examples
- INSTALLATION.md guide
- WORKFLOW.md with detailed examples
- MIT License
- Package configuration for npm distribution

### Technical Details

- **Total Tools**: 35
- **TypeScript**: ES modules with full type safety
- **MCP SDK**: @modelcontextprotocol/sdk v0.5.0
- **Validation**: JSON Schema validation with Ajv
- **Storage**: File-based JSON contracts
- **Node.js**: Requires >= 18.0.0

### Architecture

- Thin wrapper around VibeOps contracts
- Reuses existing JSON schemas and validation
- Maintains single source of truth
- Atomic operations (succeed or fail completely)
- Auto-timestamp updates

---

## [1.0.5] - 2025-11-04

### Changed
- **Cleaner Structure**: All VibeOps files now contained in `.vibeops/` directory
- Contracts, schemas, templates, validators, and documentation all in one hidden folder
- No more sprawl across the codebase - everything is organized in `.vibeops/`

### Benefits
- Single directory to `.gitignore` if desired
- Cleaner project root
- Easy to find all VibeOps related files

## [1.0.4] - 2025-11-04

### Added
- **Documentation Files**: README, INSTALLATION, and QUICK_START are now copied to user's project root as PRODUCT_OS_*.md
- Users now have local access to setup instructions and usage guides

### Fixed
- Users can now reference documentation locally without checking npm or online docs

## [1.0.3] - 2025-11-04

### Added
- **Contract Files Included**: Package now includes schemas, templates, validators, and converters
- **Auto-Copy on Init**: Contract files are automatically copied to user's project on first run
- **Complete Setup**: Users get the full VibeOps contract system out of the box

### Fixed
- Fixed directory structure to use `contracts/modules/`, `contracts/features/`, `contracts/issues/` instead of `/test` directories
- Contract files are now properly deployed with the npm package
- Users receive all schemas and templates needed for validation

### Changed
- Package now includes `contracts/**/*` directory in published files
- Initialization now copies 6 schemas, 6 templates, validators, and converters to user project

## [1.0.2] - 2025-11-04

### Added
- **Auto-initialization**: MCP server now automatically creates contract directory structure on first run
- **Better UX**: No manual directory setup required - just install and start using
- **Startup messages**: Clear feedback when directories are being initialized

### Changed
- Directory structure is now created automatically when `getContractsDir()` is first called
- Enhanced startup logging with version number and status indicators

### Fixed
- Fixed "Contracts directory not found" error on first use
- Users no longer need to manually run `mkdir -p` commands

## [1.0.1] - 2025-11-04

### Changed
- **Documentation**: Updated INSTALLATION.md to clearly distinguish between Claude Desktop and Claude Code CLI
- **Documentation**: Enhanced README.md with platform-specific quick start instructions
- **Documentation**: Improved QUICK_START.md with separate sections for CLI vs Desktop users
- **Configuration**: Added `claude mcp add` CLI wizard instructions for easier setup
- **Clarity**: Made it explicit that Claude Code CLI uses `~/.claude.json` while Claude Desktop uses `claude_desktop_config.json`

### Fixed
- Clarified that Claude Code CLI doesn't require restart, only new terminal session
- Fixed confusion about config file locations for different platforms

## [1.2.5] - 2025-11-04

### Changed
- **Version Number Sync**: Updated MCP server version number to match package version
  - Server now reports version "1.2.5" instead of hardcoded "0.1.0"
  - Health check will now show the correct package version
  - Makes it easier to verify which version is running

---

## [1.2.4] - 2025-11-04

### Fixed
- **Documentation Generation Crash**: Fixed `generate_docs_site` error "Cannot read properties of undefined (reading 'map')"
  - Added null checks for `data.features` and `data.issues` arrays in markdown converter
  - Prevents crash when modules/features have undefined arrays instead of empty arrays
  - Now safely handles malformed or incomplete contract data

---

## [1.2.3] - 2025-11-04

### Fixed
- **Duplicate ID Prevention**: Added critical safety checks to prevent duplicate contract IDs
  - `createModule`, `createFeature`, and `createIssue` now verify the generated ID doesn't already exist before writing
  - Throws clear error if duplicate is detected: "Module/Feature/Issue {ID} already exists. This may indicate a race condition or duplicate creation."
  - Prevents the issue where multiple contracts end up with the same ID (e.g., multiple MOD-003 files)
  - Protects against race conditions and ensures data integrity

**IMPORTANT**: If you have existing duplicate IDs in your contracts (like multiple MOD-003 files), you should:
1. Back up your `.vibeops/` directory
2. Manually review and consolidate the duplicates
3. Keep the correct/most recent version and delete the others
4. Update this package to get the protection going forward

---

## [1.2.2] - 2025-11-04

### Changed
- **Complete Rebranding**: All references to "VibeOps" have been changed to "VibeOps"
  - Updated package description
  - Changed MCP server name from `vibeops` to `vibeops`
  - Updated all documentation and code comments
  - Generated documentation now shows "VibeOps Documentation"
  - Health check message now shows "VibeOps MCP server is running!"

---

## [1.2.1] - 2025-11-04

### Improved
- **Cross-Linking in Markdown Files**: Module and feature markdown files now have clickable links
  - Module pages: Feature IDs now link to `../features/{ID}.md`
  - Feature pages: Issue IDs now link to `../issues/{ID}.md`
  - Easy navigation between related contracts in GitHub
  - Creates a fully browsable documentation structure

---

## [1.2.0] - 2025-11-04

### Improved
- **Hierarchical README Organization**: The `generate_docs_site` tool now generates a beautifully organized hierarchy
  - **Modules** at the top level with their name, status, and description
  - **Features** grouped under their parent module with status and priority
  - **Issues** nested under their parent feature with type icons, status, and assignee
  - Summary section at top showing total counts and breakdown by type
  - Natural tree structure that mirrors your actual product organization
  - Makes it easy to see the full context of any issue within its feature and module

Example structure:
```
### 📦 MOD-0001 - User Management
**Status:** active
Core authentication and user profile system...

**Features (2):**
- 📋 FEAT-0001 - OAuth Integration
  - Status: in-progress | Priority: high
  - **Issues (3):**
    - 📝 STORY-0001 - Google OAuth (in-progress, @john)
    - 🐛 BUG-0001 - Login redirect issue (open, @sarah)
    - 🔧 DEBT-0001 - Refactor auth service (backlog, Unassigned)
```

---

## [1.1.1] - 2025-11-04

### Improved
- **Enhanced README Index**: The `generate_docs_site` tool now creates a much richer README.md index
  - Shows contract titles, not just IDs
  - Displays status, priority, assignee, and other metadata
  - Includes description previews for modules (first 100 chars)
  - Uses emojis to identify issue types (📝 stories, 🐛 bugs, 🔧 tech debt, 🔬 spikes)
  - Shows issue type breakdown with counts
  - Much more scannable and useful for GitHub browsing

---

## [1.1.0] - 2025-11-04

### Added
- **Markdown Conversion Tool**: New `convert_to_markdown` MCP tool to convert any contract to readable markdown
  - Returns markdown as text or writes to file
  - Supports all contract types (modules, features, issues)
- **Documentation Site Generator**: New `generate_docs_site` MCP tool to create GitHub-ready documentation
  - Generates organized `docs/` directory with modules/, features/, issues/ subdirectories
  - Auto-generates README.md index with navigation links
  - Perfect for publishing contracts to GitHub Pages

### Technical Details
- Added `markdown-converter.ts` library module
- Total Tools: **37** (was 35)
- New capabilities for documentation and sharing contracts

---

## [Unreleased]

### Planned Features

- Bulk operations (update multiple items at once)
- Contract templates for common patterns
- Export to other formats (CSV, JIRA, Linear)
- Web UI for browsing contracts
- Git commit hooks
- Advanced workflow automation

---

---

## [1.0.0] - 2025-11-04 (@anckr/vibeops package)

### Changed
- **Package Renamed**: `vibeops` is now `@anckr/vibeops`
- Install with `npm install -g @anckr/vibeops` instead
- Binary command is now `vibeops` instead of `vibeops`

### Note
This is version 1.0.0 of the `@anckr/vibeops` package. Previous versions were published as `vibeops`.

---

## Version History (vibeops - deprecated)

- **1.0.5** (2025-11-04) - Contained structure in .vibeops/ directory
- **1.0.4** (2025-11-04) - Copy documentation files to user's project
- **1.0.3** (2025-11-04) - Include and deploy contract schemas/templates/validators
- **1.0.2** (2025-11-04) - Auto-initialization of directory structure
- **1.0.1** (2025-11-04) - Documentation improvements for platform clarity
- **1.0.0** (2025-11-04) - Initial release with 35 tools across 8 phases
