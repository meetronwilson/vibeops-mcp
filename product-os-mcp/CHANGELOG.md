# Changelog

All notable changes to the Product OS MCP Server will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

- Thin wrapper around Product OS contracts
- Reuses existing JSON schemas and validation
- Maintains single source of truth
- Atomic operations (succeed or fail completely)
- Auto-timestamp updates

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

## Version History

- **1.0.0** (2025-11-04) - Initial release with 35 tools across 8 phases
