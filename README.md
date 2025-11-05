# VibeOps MCP

A contract-based product organization system that enforces structured planning and validation for product development.

## Overview

VibeOps MCP organizes product development work into a clear hierarchy with enforced contracts at each level:

```
📦 MODULE (Theme/Initiative)
   └─ 📋 FEATURE (with PRD contract)
       └─ 📝 ISSUES (with type-specific contracts)
           ├─ User Story (acceptance criteria, DoD, DoR)
           ├─ Bug (repro steps, environment)
           ├─ Tech Debt (impact, effort)
           └─ Spike (questions, timebox)
```

## Getting Started

### Installation

```bash
npm install
```

### Using Templates

Templates are provided for each work item type in `contracts/templates/`:

```bash
# Copy a template
cp contracts/templates/module.template.json modules/my-module.json

# Edit with your details
# ...

# Validate the contract
npm run validate:module modules/my-module.json
```

## Contract Validation

Every work item must pass validation against its JSON schema before being considered valid.

### Validation Commands

```bash
# Validate individual contract types
npm run validate:module path/to/module.json
npm run validate:feature path/to/feature.json
npm run validate:story path/to/user-story.json
npm run validate:bug path/to/bug.json
npm run validate:debt path/to/tech-debt.json
npm run validate:spike path/to/spike.json
```

### Working with Claude Code

When using Claude Code with this repository:

1. Ask Claude to create work items: "Create a module for user authentication"
2. Claude will use the templates and validate contracts automatically
3. You'll receive validated JSON contracts that conform to the schemas

See [CLAUDE.md](./CLAUDE.md) for detailed guidance on how Claude Code works with this system.

## Directory Structure

```
vibeops-mcp/
├── contracts/
│   ├── schemas/           # JSON Schema definitions
│   ├── templates/         # Template files for each type
│   └── validators/        # Contract validation logic
├── mcp/                   # MCP server implementation
├── CLAUDE.md              # Guidance for Claude Code
├── README.md              # This file
└── package.json           # Project dependencies and scripts
```

## Contract Requirements Summary

- **MODULE**: Must have unique ID (MOD-####), name, description, type, status
- **FEATURE**: Must have PRD contract with problem statement, goals, success metrics, scope
- **USER STORY**: Must have acceptance criteria, Definition of Done, Definition of Ready
- **BUG**: Must have reproduction steps with expected/actual results, environment details
- **TECH DEBT**: Must have impact assessment and effort estimation
- **SPIKE**: Must have research questions and timebox

See [CLAUDE.md](./CLAUDE.md) for complete contract specifications.
