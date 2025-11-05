# CRM Test Data Summary

This test folder contains a complete example of a CRM system organized using the VibeOps contract framework.

## Overview

**Total Contracts Created: 23**
- 3 Modules
- 6 Features
- 8 User Stories
- 3 Bugs
- 2 Tech Debt items
- 2 Spikes

All contracts have been validated against their respective JSON schemas.

---

## Module Hierarchy

### MOD-0001: Company Management
**Type:** Theme | **Status:** Active
**Features:**
- FEAT-0001: Company Profile Management
- FEAT-0002: Company Hierarchy Visualization

**Issues:**
- STORY-0001: Create new company profile
- STORY-0002: Edit existing company profile
- STORY-0003: View company hierarchy tree
- BUG-0001: Company save error with special characters
- DEBT-0001: Refactor hierarchy data model

---

### MOD-0002: Contact Management
**Type:** Theme | **Status:** Active
**Features:**
- FEAT-0003: Contact Profile Management
- FEAT-0004: Contact Activity Timeline

**Issues:**
- STORY-0004: Create contact profile and associate with company
- STORY-0005: Assign roles and decision authority to contacts
- BUG-0002: Duplicate contact emails across companies
- SPIKE-0001: Research timeline visualization libraries (3 days)

---

### MOD-0003: Deal Pipeline
**Type:** Initiative | **Status:** Active
**Features:**
- FEAT-0005: Visual Deal Pipeline
- FEAT-0006: Revenue Forecasting Dashboard

**Issues:**
- STORY-0006: Drag and drop deals between stages
- STORY-0007: Filter pipeline by owner, value, date
- STORY-0008: Display weighted revenue forecast dashboard
- BUG-0003: Pipeline performance issues with 200+ deals
- DEBT-0002: Refactor pipeline state management
- SPIKE-0002: Investigate ML models for deal forecasting (2 weeks)

---

## Contract Details

### Modules (3)
All modules include:
- Unique MOD-#### identifiers
- Clear descriptions and ownership
- Lists of associated feature IDs
- Start/target dates
- Complete metadata

### Features (6)
All features include:
- Complete PRD contracts with:
  - Problem statements
  - Goals and success metrics
  - Scope (in/out)
  - Dependencies
- Lists of associated issue IDs
- Priority levels
- Owner assignments

### User Stories (8)
All user stories include:
- Acceptance criteria in Given/When/Then format
- Definition of Done checklists
- Definition of Ready checklists
- Story points and priority
- Current status and assignee

### Bugs (3)
All bugs include:
- Detailed reproduction steps with expected vs actual results
- Environment details (platform, browser, version)
- Severity levels
- Root cause analysis (where identified)

### Tech Debt (2)
All tech debt items include:
- Impact assessment with severity and affected areas
- Measurable metrics (current vs target)
- Effort estimation (size, complexity, story points)
- Proposed solutions

### Spikes (2)
All spikes include:
- Research questions to answer
- Timeboxes with specific durations
- Clear objectives
- Placeholder for findings and recommendations

---

## Validation Results

All 23 contracts pass validation against their respective JSON schemas:

```bash
✅ All modules validated successfully
✅ All features validated successfully
✅ All user stories validated successfully
✅ All bugs validated successfully
✅ All tech debt validated successfully
✅ All spikes validated successfully
```

---

## Key Insights

This test demonstrates:

1. **Complete hierarchy**: Modules → Features → Issues properly linked via IDs
2. **Diverse issue types**: Examples of all 4 issue types (Story, Bug, Debt, Spike)
3. **Realistic content**: Real-world CRM scenarios with detailed requirements
4. **Contract compliance**: All required fields populated and validated
5. **Traceability**: Clear parent-child relationships throughout the hierarchy

---

## Testing the Validator

You can test the validator with any of these files:

```bash
# Validate a module
npm run validate:module test/modules/MOD-0001-companies.json

# Validate a feature
npm run validate:feature test/features/FEAT-0005-deal-pipeline.json

# Validate a user story
npm run validate:story test/issues/STORY-0006-drag-drop-deals.json

# Validate a bug
npm run validate:bug test/issues/BUG-0003-pipeline-performance.json

# Validate tech debt
npm run validate:debt test/issues/DEBT-0002-pipeline-state-management.json

# Validate a spike
npm run validate:spike test/issues/SPIKE-0002-ml-forecasting.json
```
