# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Organization Framework

This repository follows a hierarchical structure for organizing product development work with **hierarchical IDs** that show parent-child relationships:

```
📦 MOD-001 (Module: Theme/Initiative)
   ├─ 📋 MOD-001-FEAT-001 (Feature with PRD contract)
   │   ├─ 📝 MOD-001-FEAT-001-STORY-001 (User Story)
   │   ├─ 🐛 MOD-001-FEAT-001-BUG-001 (Bug)
   │   ├─ 🔧 MOD-001-FEAT-001-DEBT-001 (Tech Debt)
   │   └─ 🔬 MOD-001-FEAT-001-SPIKE-001 (Spike)
   └─ 📋 MOD-001-FEAT-002 (Another Feature)
       └─ 📝 MOD-001-FEAT-002-STORY-001 (User Story)
```

### Hierarchical ID System

All IDs follow a **parent-child naming convention** that provides instant traceability:
- **Module IDs**: `MOD-###` (e.g., MOD-001, MOD-002)
- **Feature IDs**: `MOD-###-FEAT-###` (e.g., MOD-001-FEAT-001)
- **Issue IDs**: `MOD-###-FEAT-###-TYPE-###` (e.g., MOD-001-FEAT-001-STORY-001)

**Key Benefits:**
- **Instant traceability**: Looking at an ID tells you exactly where it belongs
- **Sequential tracking**: Numbering starts at 001 for each parent, showing order of creation
- **No conflicts**: Each hierarchical path is unique

### Hierarchy Levels

**MODULE (📦)**: Top-level themes or initiatives that group related features
- Represents a significant area of product functionality or strategic initiative
- Contains multiple related features

**FEATURE (📋)**: Discrete product capabilities with PRD contracts
- Each feature must have a Product Requirements Document (PRD) contract
- Defines the scope, requirements, and success criteria for the feature
- Contains multiple issues that implement the feature

**ISSUES (📝)**: Individual units of work with type-specific contracts

#### Issue Types

1. **User Story**
   - Must include: Acceptance criteria, Definition of Done (DoD), Definition of Ready (DoR)
   - Describes functionality from the user's perspective

2. **Bug**
   - Must include: Reproduction steps, Environment details
   - Documents defects and their context

3. **Tech Debt**
   - Must include: Impact assessment, Effort estimation
   - Tracks technical improvements and refactoring needs

4. **Spike**
   - Must include: Research questions, Timebox duration
   - Time-boxed investigation or proof-of-concept work

## Contract System

Every level of the hierarchy has a JSON contract schema that defines its required structure. All work items MUST be validated against their respective schemas before being considered valid.

### Directory Structure

```
contracts/
├── schemas/           # JSON Schema definitions
│   ├── module.schema.json
│   ├── feature.schema.json
│   ├── user-story.schema.json
│   ├── bug.schema.json
│   ├── tech-debt.schema.json
│   └── spike.schema.json
├── templates/         # Template JSON files for each type
│   ├── module.template.json
│   ├── feature.template.json
│   ├── user-story.template.json
│   ├── bug.template.json
│   ├── tech-debt.template.json
│   └── spike.template.json
├── validators/        # Validation implementation
│   └── validate.js
└── converters/        # Format converters
    └── json-to-md.js
```

### Commands

Install dependencies first:
```bash
npm install
```

**Validation:**
```bash
# Validate a specific contract file
npm run validate:module path/to/module.json
npm run validate:feature path/to/feature.json
npm run validate:story path/to/user-story.json
npm run validate:bug path/to/bug.json
npm run validate:debt path/to/tech-debt.json
npm run validate:spike path/to/spike.json

# Or validate from stdin
cat module.json | npm run validate:module
```

**Convert to Markdown:**
```bash
# Convert any JSON contract to readable Markdown
npm run convert path/to/contract.json path/to/output.md

# If output path is omitted, uses same name with .md extension
npm run convert test/modules/MOD-001-companies.json
# Creates: test/modules/MOD-001-companies.md
```

The converter automatically detects the contract type (module, feature, story, bug, debt, spike) and formats it appropriately with:
- Progress indicators (✅/⬜) for checklists
- Emojis for visual scanning (🐛 bugs, 🔧 tech debt, 🔬 spikes)
- Minimal, scannable layout
- All key information preserved

### Creating New Work Items

When Claude is asked to create a MODULE, FEATURE, or ISSUE:

1. **Start with the template**: Copy the appropriate template from `contracts/templates/`
2. **Fill in the details**: Replace placeholder content with actual data
3. **Validate the contract**: Run the validator to ensure the contract is valid
4. **Convert to Markdown** (optional): Generate readable markdown version
5. **Output the JSON**: Return the validated JSON contract to the user

Example workflow:
```bash
# Create a new module based on template
cp contracts/templates/module.template.json my-new-module.json
# Edit the file with actual data
# Validate it
npm run validate:module my-new-module.json
# Optionally convert to markdown for easy reading
npm run convert my-new-module.json
```

### Contract Requirements by Type

**MODULE Contract Requirements:**
- **Unique ID**: `MOD-###` (e.g., MOD-001, MOD-002)
- Name (3-100 characters)
- Description (10-1000 characters)
- Type: "theme" or "initiative"
- Status: planning, active, on-hold, completed, archived
- Array of feature IDs (format: `MOD-###-FEAT-###`)
- Metadata with timestamps

**FEATURE Contract Requirements:**
- **Unique ID**: `MOD-###-FEAT-###` (e.g., MOD-001-FEAT-001)
- **Parent module ID**: `MOD-###` (must match the module prefix in the feature ID)
- Complete PRD contract including:
  - Problem statement (minimum 20 characters)
  - Goals (at least 1)
  - Success metrics with targets (at least 1)
  - In-scope and out-of-scope items
- Array of issue IDs (format: `MOD-###-FEAT-###-TYPE-###`)
- Metadata with timestamps

**USER STORY Contract Requirements:**
- **Unique ID**: `MOD-###-FEAT-###-STORY-###` (e.g., MOD-001-FEAT-001-STORY-001)
- **Parent feature ID**: `MOD-###-FEAT-###` (must match the module and feature prefix)
- User story format: "As a [user], I want [goal], so that [benefit]"
- Acceptance criteria (at least 1) in Given/When/Then format
- Definition of Done checklist (at least 1 item)
- Definition of Ready checklist (at least 1 item)
- Metadata with timestamps

**BUG Contract Requirements:**
- **Unique ID**: `MOD-###-FEAT-###-BUG-###` (e.g., MOD-001-FEAT-001-BUG-001)
- **Parent feature ID**: `MOD-###-FEAT-###` (must match the module and feature prefix)
- Severity: critical, high, medium, low
- Reproduction steps (at least 1) with expected vs actual results
- Environment details including platform
- Metadata with timestamps

**TECH DEBT Contract Requirements:**
- **Unique ID**: `MOD-###-FEAT-###-DEBT-###` (e.g., MOD-001-FEAT-001-DEBT-001)
- **Parent feature ID**: `MOD-###-FEAT-###` (must match the module and feature prefix)
- Impact assessment including:
  - Severity level
  - Affected areas (performance, maintainability, etc.)
  - Description (minimum 20 characters)
- Effort estimation including:
  - Size estimate (xs, small, medium, large, xl)
  - Complexity level
- Metadata with timestamps

**SPIKE Contract Requirements:**
- **Unique ID**: `MOD-###-FEAT-###-SPIKE-###` (e.g., MOD-001-FEAT-001-SPIKE-001)
- **Parent feature ID**: `MOD-###-FEAT-###` (must match the module and feature prefix)
- Research questions (at least 1)
- Timebox with duration and unit (hours, days, weeks)
- Objectives (at least 1)
- Metadata with timestamps

### Working with This Framework

When creating new work items:
- Always identify which MODULE the work belongs to
- **Use hierarchical IDs** that include the parent IDs (e.g., MOD-001-FEAT-001-STORY-001)
- **Start numbering at 001** for each new child level (first feature is FEAT-001, first story is STORY-001)
- Ensure FEATUREs have complete PRD contracts before creating issues
- Select the appropriate issue type and complete its required contract fields
- Link issues to their parent feature and module for traceability through the ID structure
- **ALWAYS validate the contract** using the validation commands before finalizing
- Use templates as starting points to ensure all required fields are included

**ID Examples:**
```
Module: MOD-001
  First feature: MOD-001-FEAT-001
    First story: MOD-001-FEAT-001-STORY-001
    Second story: MOD-001-FEAT-001-STORY-002
    First bug: MOD-001-FEAT-001-BUG-001
  Second feature: MOD-001-FEAT-002
    First story: MOD-001-FEAT-002-STORY-001
```
