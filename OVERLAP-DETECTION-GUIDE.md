# Feature Overlap Detection System - Complete Guide

## Overview

This guide documents the complete feature overlap detection system for VibeOps MCP. This system prevents duplicate functionality, ensures clear feature boundaries, and maintains a healthy dependency graph across your product architecture.

## Table of Contents

1. [Why Overlap Detection Matters](#why-overlap-detection-matters)
2. [New Schema Fields](#new-schema-fields)
3. [MCP Tools](#mcp-tools)
4. [Usage Workflows](#usage-workflows)
5. [Claude Code Agent Integration](#claude-code-agent-integration)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Why Overlap Detection Matters

### The Problem

In complex product architectures, it's easy to accidentally create features that overlap:

- **FEAT-002 (Proactive Scheduling)**: AI-powered crew assignments with confirm-to-execute
- **FEAT-0055 (Course Area Task Management)**: Initial scope included "AI-powered scheduling"
- **FEAT-014 (Assignment Engine)**: Also handles intelligent work assignments

Without overlap detection, this leads to:
- Duplicate development work
- Confused users about which feature to use
- Conflicting implementations
- Maintenance burden

### The Solution

This system catches overlaps **before** they're implemented through:
1. **Structured relationships** between features
2. **Capability tagging** for automatic detection
3. **Data contract tracking** for integration clarity
4. **Automated validation** tools

---

## New Schema Fields

### Feature Schema Enhancements

#### 1. `capabilityTags` (Required)

Tags that describe what the feature **does**, used for overlap detection.

```json
{
  "capabilityTags": [
    "ai-scheduling",
    "worker-assignment",
    "approval-workflow",
    "confirmation-pattern"
  ]
}
```

**Available Tags:**
- Scheduling: `ai-scheduling`, `manual-scheduling`, `maintenance-scheduling`
- Task Management: `task-definition`, `task-execution`, `task-management`
- Assignment: `worker-assignment`, `resource-management`
- Workflows: `approval-workflow`, `confirmation-pattern`
- Communication: `notification`, `communication`, `chat-interface`
- Data: `data-entry`, `data-export`, `data-import`, `reporting`, `analytics`
- Integration: `calendar-integration`, `weather-integration`, `geolocation`, `mapping`
- And 40+ more (see `feature.schema.enhanced.json`)

**Usage Rule:** Every feature MUST have at least 1 capability tag.

#### 2. `targetUsers` (Required)

Who will actually use this feature.

```json
{
  "targetUsers": [
    "Superintendents",
    "Project Managers",
    "Crew Workers"
  ]
}
```

**Why it matters:** Features with same capabilities targeting same users = high overlap risk.

#### 3. `relatedFeatures` (Optional but Recommended)

Explicit relationships with other features.

```json
{
  "relatedFeatures": [
    {
      "featureId": "FEAT-0055",
      "relationship": "consumes-data-from",
      "description": "Gets task definitions from task library"
    },
    {
      "featureId": "FEAT-005",
      "relationship": "integrates-with",
      "description": "Uses confirm-to-execute pattern for all AI schedules"
    }
  ]
}
```

**Relationship Types:**
- `depends-on` - Cannot function without the other feature
- `provides-data-to` - Generates data consumed by other feature
- `consumes-data-from` - Uses data from other feature
- `overlaps-with` - Shares some functionality (requires clear differentiation)
- `complements` - Works alongside, enhances the other feature
- `supersedes` - Replaces the other feature
- `blocks` - Prevents the other feature from proceeding
- `integrates-with` - Technical integration point
- `extends` - Adds functionality to base feature
- `replaced-by` - This feature is being retired in favor of another

#### 4. `dataContract` (Optional but Highly Recommended)

Explicit inputs and outputs for integration clarity.

```json
{
  "dataContract": {
    "consumes": [
      {
        "sourceFeature": "FEAT-0055",
        "dataType": "TaskDefinition",
        "description": "Task library with requirements and estimates",
        "required": true,
        "format": "JSON"
      }
    ],
    "produces": [
      {
        "dataType": "ProposedSchedule",
        "description": "AI-generated crew assignments awaiting confirmation",
        "consumers": ["FEAT-005", "FEAT-0062"],
        "format": "JSON",
        "updateFrequency": "real-time"
      }
    ]
  }
}
```

**Benefits:**
- Makes dependencies explicit
- Validates data flow consistency
- Documents integration requirements
- Helps detect missing producers/consumers

### Module Schema Enhancements

#### `relatedModules` (Optional)

Cross-module relationships and integration points.

```json
{
  "relatedModules": [
    {
      "moduleId": "MOD-003",
      "relationship": "integrates-with",
      "description": "AI Assistant orchestrates Labor & Scheduling features",
      "sharedCapabilities": ["ai-scheduling", "worker-assignment"],
      "integrationPoints": [
        {
          "fromFeature": "FEAT-002",
          "toFeature": "FEAT-014",
          "description": "AI proposals feed optimization engine",
          "dataFlow": "one-way-to"
        }
      ]
    }
  ]
}
```

---

## MCP Tools

### 1. `check_feature_overlap`

**Purpose:** Detect overlaps before creating/updating features

**When to use:**
- Before creating a new feature
- Before adding major scope to existing feature
- During feature reviews

**Input:**
```typescript
{
  featureId?: "FEAT-0055",  // Optional, for updates
  name: "AI Scheduling Assistant",
  problemStatement: "Superintendents need help creating optimal crew schedules...",
  capabilityTags: ["ai-scheduling", "worker-assignment"],
  targetUsers: ["Superintendents"],
  inScope: ["Generate schedule proposals", "Optimize assignments"],
  outOfScope: ["Manual schedule entry"],
  moduleId: "MOD-001"
}
```

**Output:**
```
⚠️ Potential overlaps detected with 2 feature(s):

🔴 HIGH PRIORITY OVERLAPS:

FEAT-002 (Proactive Scheduling)
  • Shares 2 capability tags: ai-scheduling, worker-assignment
  • 78% problem statement similarity
  • Targets same users: Superintendents
  • Both in module MOD-001

Recommendations:
  ⚠️ CRITICAL: High capability overlap suggests these features may be too similar.
  → Options: 1) Merge into FEAT-002, 2) Define clear differentiation, 3) Create as sub-feature
  → If solving same problem: Enhance FEAT-002 instead of creating new feature.
```

**Detection Logic:**
1. **Capability Tag Overlap** - 3+ shared tags = HIGH, 2+ = MEDIUM
2. **Semantic Similarity** - Text analysis of problem statements
3. **Target User Overlap** - Same users with similar problems
4. **Scope Conflicts** - inScope items that conflict with outOfScope elsewhere
5. **Module Proximity** - Same module increases severity

### 2. `validate_feature_graph`

**Purpose:** Validate entire dependency graph for consistency

**When to use:**
- Before major releases
- After significant feature additions
- Monthly/quarterly audits
- CI/CD pipeline checks

**Input:**
```typescript
{
  featuresDir: "/path/to/features",
  modulesDir: "/path/to/modules"
}
```

**Output:**
```markdown
# Feature Graph Validation Report

## Statistics
- Total Features: 47
- Total Modules: 8
- Features with Relationships: 38 (81%)
- Features with Data Contracts: 24 (51%)
- Orphaned Features: 3
- Circular Dependencies: 0

✅ VALIDATION PASSED - No critical errors found.

## 🟡 Warnings (5)

### FEAT-0055 - data-contract
**Issue:** FEAT-0002 doesn't explicitly produce "TaskDefinition"
**Recommendation:** Update FEAT-0002's data contract to list "TaskDefinition" in produces

### FEAT-0087 - orphaned-feature
**Issue:** Feature has no relationships with other features
**Recommendation:** Consider if this feature depends on or relates to any existing features
```

**Validation Checks:**
- ✅ Missing feature references
- ✅ Circular dependency detection
- ✅ Orphaned features (no relationships)
- ✅ Data contract consistency
- ✅ Module boundary violations
- ✅ Asymmetric relationships
- ✅ Relationship type mismatches

### 3. `search_similar_features`

**Purpose:** Find features with similar problem statements or scope

**When to use:**
- During ideation ("has this been done?")
- Before writing PRDs
- During feature discovery

**Input:**
```typescript
{
  problemStatement: "Users struggle to create optimal crew schedules",
  scopeItems: ["Generate schedules", "Assign workers"],
  capabilityTags: ["scheduling", "assignment"],
  goals: ["Reduce scheduling time"],
  threshold: 0.3  // 0-1 similarity threshold
}
```

**Output:**
```
Found 2 similar feature(s):

FEAT-002 - Proactive Scheduling
Module: MOD-001
Similarity: ████████░░ 82%

Match Reasons:
  • 82% problem statement match
  • 2 capability tags match: ai-scheduling, worker-assignment
  • 1 scope items overlap

Details:
  Problem Statement: 82% match
  Scope Overlap:
    - "Generate schedule proposals" ≈ "AI-powered schedule generation"
  Tags: ai-scheduling, worker-assignment

💡 Recommendation: Review these features to determine if:
  1. Your feature should extend one of these instead
  2. You need to define clear differentiation in scope
  3. A relatedFeatures relationship should be established
```

---

## Usage Workflows

### Workflow 1: Creating a New Feature

```
User: "I want to create a feature for AI-powered crew scheduling"

Claude Agent:
1. Extract key info:
   - problemStatement: "superintendents need help..."
   - capabilityTags: ["ai-scheduling", "worker-assignment"]
   - targetUsers: ["Superintendents"]

2. Run check_feature_overlap()

3. If HIGH overlap detected:
   → Present options:
     A) Enhance existing FEAT-002 instead
     B) Create with clear differentiation
     C) Cancel and reconsider

4. If MEDIUM overlap:
   → Require explicit relatedFeatures entries
   → Require differentiation in outOfScope

5. If LOW or no overlap:
   → Proceed with creation
   → Suggest optional relatedFeatures if relevant
```

### Workflow 2: Updating Existing Feature

```
User: "Add AI-powered scheduling to FEAT-0055"

Claude Agent:
1. Load existing FEAT-0055

2. Run check_feature_overlap() with:
   - featureId: "FEAT-0055"
   - proposed new capabilityTags
   - proposed new inScope items

3. Detect HIGH overlap with FEAT-002

4. Response:
   ⚠️ Adding "ai-scheduling" to FEAT-0055 creates high overlap with FEAT-002

   Current state:
   - FEAT-0055: Task definition and library management
   - FEAT-002: AI-powered scheduling using task library

   Recommendation: Keep FEAT-0055 focused on task definition.
   Establish data relationship instead:
   - FEAT-0055 provides data to FEAT-002
   - FEAT-002 consumes task library for scheduling

   Proceed? [y/N]
```

### Workflow 3: Monthly Validation

```
Scheduled Job or Manual Command:

1. Run validate_feature_graph() on entire codebase

2. Generate report

3. If errors found:
   → Block deployment
   → Notify feature owners
   → Create issues for fixes

4. If warnings found:
   → Log for review
   → Suggest improvements

5. Generate metrics:
   - Relationship coverage
   - Orphaned feature count
   - Data contract completeness
```

---

## Claude Code Agent Integration

### Pre-Creation Check (Automatic)

Add to your MCP server's `create_feature` tool:

```typescript
async function create_feature(input) {
  // 1. ALWAYS run overlap check first
  const overlapResults = await checkFeatureOverlap({
    name: input.name,
    problemStatement: input.prd.problemStatement,
    capabilityTags: input.capabilityTags || [],
    targetUsers: input.targetUsers || [],
    inScope: input.prd.scope.inScope,
    outOfScope: input.prd.scope.outOfScope,
    moduleId: input.moduleId
  }, featuresDir);

  // 2. If HIGH severity overlaps, require explicit confirmation
  const highOverlaps = overlapResults.filter(r => r.severity === 'high');

  if (highOverlaps.length > 0) {
    return {
      error: "HIGH_OVERLAP_DETECTED",
      message: formatOverlapResults(overlapResults),
      requiresConfirmation: true,
      suggestedAction: "Consider enhancing existing feature instead"
    };
  }

  // 3. If MEDIUM overlaps, require relatedFeatures
  const mediumOverlaps = overlapResults.filter(r => r.severity === 'medium');

  if (mediumOverlaps.length > 0 && !input.relatedFeatures?.length) {
    return {
      error: "MISSING_RELATIONSHIPS",
      message: "Medium overlap detected but no relatedFeatures specified",
      suggestedRelationships: mediumOverlaps.map(o => ({
        featureId: o.featureId,
        suggestedRelationship: "integrates-with"
      }))
    };
  }

  // 4. Proceed with creation
  return createFeature(input);
}
```

### Suggested Prompt for Claude Code

```markdown
When user requests feature creation, I will:

1. Extract requirements
2. **AUTOMATICALLY run check_feature_overlap**
3. Present findings to user
4. If HIGH overlap:
   - Explain the conflict
   - Show existing feature(s)
   - Suggest alternatives
   - Require explicit user decision
5. If MEDIUM overlap:
   - Suggest relatedFeatures entries
   - Require clear differentiation
6. If LOW/no overlap:
   - Proceed with creation
   - Populate capabilityTags
   - Add relevant relatedFeatures if applicable
```

---

## Best Practices

### 1. Always Tag Capabilities

❌ **Bad:**
```json
{
  "name": "Schedule Manager",
  "capabilityTags": []  // Empty!
}
```

✅ **Good:**
```json
{
  "name": "Schedule Manager",
  "capabilityTags": ["manual-scheduling", "calendar-integration", "notification"]
}
```

### 2. Be Specific with Relationships

❌ **Bad:**
```json
{
  "relatedFeatures": [
    {
      "featureId": "FEAT-002",
      "relationship": "related",  // Too vague!
      "description": "Works with scheduling"
    }
  ]
}
```

✅ **Good:**
```json
{
  "relatedFeatures": [
    {
      "featureId": "FEAT-002",
      "relationship": "consumes-data-from",
      "description": "Consumes AI-generated schedule proposals to display on worker mobile interface"
    }
  ]
}
```

### 3. Use Data Contracts for Integration

❌ **Bad:**
```json
{
  "prd": {
    "dependencies": [
      "Needs schedule data from somewhere"
    ]
  }
}
```

✅ **Good:**
```json
{
  "dataContract": {
    "consumes": [
      {
        "sourceFeature": "FEAT-002",
        "dataType": "ProposedSchedule",
        "description": "Daily crew assignments with timestamps and locations",
        "required": true,
        "format": "JSON"
      }
    ]
  }
}
```

### 4. Document Why Features DON'T Overlap

Use `outOfScope` to clearly differentiate:

```json
{
  "id": "FEAT-0055",
  "name": "Course Area Task Management",
  "capabilityTags": ["task-definition"],
  "prd": {
    "scope": {
      "inScope": [
        "Task creation and editing",
        "Task library management"
      ],
      "outOfScope": [
        "Automated schedule generation (handled by FEAT-002)",
        "AI-powered scheduling (handled by FEAT-002)",
        "Worker assignments (handled by FEAT-014)"
      ]
    }
  }
}
```

### 5. Run Validation Regularly

```bash
# In your CI/CD pipeline
npm run validate:graph

# Exit with error if validation fails
if [ $? -ne 0 ]; then
  echo "Feature graph validation failed!"
  exit 1
fi
```

---

## Examples

### Example 1: Proper Separation

**FEAT-0055: Course Area Task Management**
- **Capability Tags:** `task-definition`, `data-entry`
- **Scope:** Define WHAT needs to be done
- **Produces:** TaskDefinition library

**FEAT-002: Proactive Scheduling**
- **Capability Tags:** `ai-scheduling`, `worker-assignment`
- **Scope:** Decide WHEN and WHO does the work
- **Consumes:** TaskDefinition from FEAT-0055
- **Relationship:** `consumes-data-from` FEAT-0055

**Why this works:**
- Clear separation of concerns
- Explicit data flow
- No capability overlap
- Complementary, not competing

### Example 2: Avoiding Overlap

**Initial Idea:** "Add AI scheduling to FEAT-0055"

**Overlap Check Results:**
```
🔴 HIGH OVERLAP with FEAT-002
- Both would have "ai-scheduling" tag
- Both target Superintendents
- 85% problem statement similarity
```

**Resolution:**
- Keep FEAT-0055 focused on task definition
- Let FEAT-002 handle scheduling
- Add relatedFeatures link
- Update FEAT-0055 outOfScope to explicitly exclude AI scheduling

### Example 3: Circular Dependency Detection

**Problem:**
- FEAT-A depends-on FEAT-B
- FEAT-B depends-on FEAT-C
- FEAT-C depends-on FEAT-A

**Validation Output:**
```
🔴 Circular dependency detected: FEAT-A → FEAT-B → FEAT-C → FEAT-A

Recommendation: Break cycle by changing one dependency to "integrates-with"
```

**Resolution:**
Change FEAT-C relationship from `depends-on` to `integrates-with` FEAT-A

---

## Migration Guide

### For Existing Features

1. **Add Capability Tags**
   ```bash
   # Review each feature and add appropriate tags
   # Minimum 1 tag, average 3-5 tags
   ```

2. **Add Target Users**
   ```bash
   # Who actually uses this feature?
   ```

3. **Document Relationships**
   ```bash
   # For each feature, ask:
   # - What features does this depend on?
   # - What features depend on this?
   # - What data does this consume/produce?
   ```

4. **Add Data Contracts** (High-Value Features First)
   ```bash
   # Start with core features like FEAT-002, FEAT-0055
   # Document inputs and outputs
   ```

5. **Run Validation**
   ```bash
   npm run validate:graph
   # Fix any errors
   # Address warnings
   ```

---

## FAQ

### Q: Do I need to add ALL relationships?

**A:** Start with the most important ones:
- Direct dependencies (`depends-on`, `blocks`)
- Data flows (`consumes-data-from`, `provides-data-to`)
- Major integrations (`integrates-with`)

You can add others incrementally.

### Q: What if I have 10+ capability tags?

**A:** Your feature might be too broad. Consider:
- Breaking into multiple features
- Creating a module to group related features
- Focusing on core capabilities only

### Q: How do I know which relationship type to use?

**A:** Ask these questions:
- "Can Feature A work without Feature B?" → `depends-on`
- "Does Feature A send data to Feature B?" → `provides-data-to`
- "Do they work together but independently?" → `integrates-with`
- "Do they enhance each other?" → `complements`

### Q: What's the difference between `depends-on` and `consumes-data-from`?

**A:**
- `depends-on`: Cannot function at all without it (hard dependency)
- `consumes-data-from`: Uses data from it (data dependency)

Example:
- FEAT-002 `depends-on` authentication (can't work without it)
- FEAT-002 `consumes-data-from` FEAT-0055 (needs task data)

---

## Implementation Checklist

- [ ] Update feature.schema.json with enhanced fields
- [ ] Update module.schema.json with relatedModules
- [ ] Implement check_feature_overlap in MCP server
- [ ] Implement validate_feature_graph in MCP server
- [ ] Implement search_similar_features in MCP server
- [ ] Add overlap check to create_feature workflow
- [ ] Add validation to CI/CD pipeline
- [ ] Document capability tag vocabulary
- [ ] Create feature template with new fields
- [ ] Migrate existing features (high-priority first)
- [ ] Train team on new fields
- [ ] Schedule regular validation runs

---

## Support

For questions or issues:
- GitHub Issues: https://github.com/vibeops/vibeops-mcp/issues
- Documentation: /OVERLAP-DETECTION-GUIDE.md
- Schema Reference: /contracts/schemas/

---

**Last Updated:** 2025-01-20
**Version:** 1.0.0
