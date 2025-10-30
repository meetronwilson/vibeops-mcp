# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Product Organization Framework

This repository follows a hierarchical structure for organizing product development work:

```
📦 MODULE (Theme/Initiative)
   └─ 📋 FEATURE (with PRD contract)
       └─ 📝 ISSUES (with type-specific contracts)
           ├─ User Story (acceptance criteria, DoD, DoR)
           ├─ Bug (repro steps, environment)
           ├─ Tech Debt (impact, effort)
           └─ Spike (questions, timebox)
```

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
└── validators/        # Validation implementation
    └── validate.js
```

### Validation Commands

Install dependencies first:
```bash
npm install
```

Validate contracts using the following commands:

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

### Creating New Work Items

When Claude is asked to create a MODULE, FEATURE, or ISSUE:

1. **Start with the template**: Copy the appropriate template from `contracts/templates/`
2. **Fill in the details**: Replace placeholder content with actual data
3. **Validate the contract**: Run the validator to ensure the contract is valid
4. **Output the JSON**: Return the validated JSON contract to the user

Example workflow:
```bash
# Create a new module based on template
cp contracts/templates/module.template.json my-new-module.json
# Edit the file with actual data
# Validate it
npm run validate:module my-new-module.json
```

### Contract Requirements by Type

**MODULE Contract Requirements:**
- Unique ID matching pattern `MOD-####`
- Name (3-100 characters)
- Description (10-1000 characters)
- Type: "theme" or "initiative"
- Status: planning, active, on-hold, completed, archived
- Array of feature IDs
- Metadata with timestamps

**FEATURE Contract Requirements:**
- Unique ID matching pattern `FEAT-####`
- Parent module ID
- Complete PRD contract including:
  - Problem statement (minimum 20 characters)
  - Goals (at least 1)
  - Success metrics with targets (at least 1)
  - In-scope and out-of-scope items
- Array of issue IDs
- Metadata with timestamps

**USER STORY Contract Requirements:**
- Unique ID matching pattern `STORY-####`
- Parent feature ID
- User story format: "As a [user], I want [goal], so that [benefit]"
- Acceptance criteria (at least 1) in Given/When/Then format
- Definition of Done checklist (at least 1 item)
- Definition of Ready checklist (at least 1 item)
- Metadata with timestamps

**BUG Contract Requirements:**
- Unique ID matching pattern `BUG-####`
- Parent feature ID
- Severity: critical, high, medium, low
- Reproduction steps (at least 1) with expected vs actual results
- Environment details including platform
- Metadata with timestamps

**TECH DEBT Contract Requirements:**
- Unique ID matching pattern `DEBT-####`
- Parent feature ID
- Impact assessment including:
  - Severity level
  - Affected areas (performance, maintainability, etc.)
  - Description (minimum 20 characters)
- Effort estimation including:
  - Size estimate (xs, small, medium, large, xl)
  - Complexity level
- Metadata with timestamps

**SPIKE Contract Requirements:**
- Unique ID matching pattern `SPIKE-####`
- Parent feature ID
- Research questions (at least 1)
- Timebox with duration and unit (hours, days, weeks)
- Objectives (at least 1)
- Metadata with timestamps

### Working with This Framework

When creating new work items:
- Always identify which MODULE the work belongs to
- Ensure FEATUREs have complete PRD contracts before creating issues
- Select the appropriate issue type and complete its required contract fields
- Link issues to their parent feature and module for traceability
- **ALWAYS validate the contract** using the validation commands before finalizing
- Use templates as starting points to ensure all required fields are included
