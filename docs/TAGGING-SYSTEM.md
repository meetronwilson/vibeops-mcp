# Tagging and Grouping System

## Overview

The VibeOps contract system uses a **flexible tagging system** to enable cross-cutting organization beyond the hierarchical MODULE → FEATURE → ISSUE structure. This allows you to group related work items by themes, technologies, teams, or any other dimension that's useful for your organization.

## Tag Locations

Every contract type includes a `metadata.tags` array that accepts arbitrary string values:

```json
{
  "metadata": {
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2025-01-01T00:00:00Z",
    "createdBy": "system",
    "tags": ["crm", "companies", "b2b", "high-priority"]
  }
}
```

## Tag Categories and Examples

### 1. **Technology/Stack Tags**
Group work by technology:
- `react`, `typescript`, `nodejs`, `postgresql`
- `graphql`, `rest-api`, `websockets`
- `aws`, `azure`, `kubernetes`

**Example:**
```json
"tags": ["react", "typescript", "graphql"]
```

### 2. **Domain/Feature Area Tags**
Group by business domain:
- `crm`, `billing`, `auth`, `reporting`
- `companies`, `contacts`, `deals`, `tasks`
- `analytics`, `notifications`, `search`

**Example:**
```json
"tags": ["crm", "companies", "data-management"]
```

### 3. **Team/Ownership Tags**
Identify team ownership:
- `team:backend`, `team:frontend`, `team:platform`
- `team:mobile`, `team:data`, `team:infra`

**Example:**
```json
"tags": ["team:backend", "team:platform"]
```

### 4. **Priority/Impact Tags**
Mark business priority:
- `high-priority`, `critical`, `quick-win`
- `revenue-impact`, `customer-facing`
- `technical-debt`, `performance`

**Example:**
```json
"tags": ["high-priority", "customer-facing", "revenue-impact"]
```

### 5. **Release/Milestone Tags**
Associate with releases:
- `v2.0`, `q1-2025`, `mvp`
- `beta`, `ga`, `experimental`

**Example:**
```json
"tags": ["v2.1", "q1-2025", "customer-requested"]
```

### 6. **Integration/Dependency Tags**
Show external integrations:
- `salesforce-integration`, `stripe-integration`
- `third-party-api`, `legacy-system`

**Example:**
```json
"tags": ["salesforce-integration", "third-party-api"]
```

## Naming Conventions

### Recommended Tag Formats

1. **Lowercase with hyphens**: `high-priority`, `team-backend`
2. **Namespaced tags** (for categories): `team:backend`, `release:v2.0`, `tech:react`
3. **Short and descriptive**: Prefer `crm` over `customer-relationship-management`

### Anti-Patterns to Avoid

❌ **Don't**: Use spaces (`high priority`)
❌ **Don't**: Use inconsistent casing (`HighPriority`, `High-Priority`, `high-priority`)
❌ **Don't**: Create overly specific tags (`company-profile-edit-form-validation`)
❌ **Don't**: Duplicate hierarchical info (`MOD-001`, `FEAT-001-related`)

✅ **Do**: Use consistent, lowercase, hyphenated tags
✅ **Do**: Keep tags reusable across multiple work items
✅ **Do**: Use namespaces for clarity when needed

## Querying by Tags

### Command Line Examples

```bash
# Find all contracts with a specific tag
grep -r '"crm"' test/ --include="*.json"

# Find all high-priority items
grep -r '"high-priority"' test/ --include="*.json"

# Find all backend team work
grep -r '"team:backend"' test/ --include="*.json"

# Combine with jq for better output
find test/ -name "*.json" -exec jq -r 'select(.metadata.tags[]? == "crm") | .id + ": " + .name' {} \;
```

### Example Queries

**Find all CRM-related work across modules:**
```bash
find test/ -name "*.json" -exec jq -r \
  'select(.metadata.tags[]? == "crm") |
   {id, name, type: (if .prd then "feature" elif .acceptanceCriteria then "story" else "other" end)}' \
  {} \;
```

**Find all high-priority items for Q1 2025:**
```bash
find test/ -name "*.json" -exec jq -r \
  'select((.metadata.tags[]? == "high-priority") and (.metadata.tags[]? == "q1-2025")) |
   .id + ": " + .name' \
  {} \;
```

## Cross-Module Themes

Tags are especially useful for tracking **themes** that span multiple modules:

### Example: Mobile Optimization Theme

If you have a "mobile optimization" initiative affecting multiple modules:

**MOD-001 (Company Management):**
```json
"tags": ["crm", "companies", "mobile-optimization"]
```

**MOD-002 (Contacts):**
```json
"tags": ["crm", "contacts", "mobile-optimization"]
```

**MOD-005 (Notifications):**
```json
"tags": ["notifications", "mobile-optimization", "performance"]
```

Now you can query all work related to mobile optimization:
```bash
grep -r '"mobile-optimization"' test/ --include="*.json"
```

## Tag Governance

### Recommended Practices

1. **Maintain a tag glossary**: Document commonly used tags and their meanings
2. **Review tags periodically**: Remove obsolete tags, consolidate duplicates
3. **Establish tag namespaces**: Use prefixes like `team:`, `tech:`, `release:` for organization
4. **Keep it simple**: Don't over-tag; 3-7 tags per item is usually sufficient

### Sample Tag Glossary

Create a `docs/TAG-GLOSSARY.md` file:

```markdown
# Tag Glossary

## Technology Tags
- `react` - React UI components
- `typescript` - TypeScript code
- `nodejs` - Node.js backend services
- `postgresql` - PostgreSQL database work

## Domain Tags
- `crm` - Customer Relationship Management features
- `billing` - Payment and invoicing features
- `auth` - Authentication and authorization

## Team Tags
- `team:backend` - Backend team ownership
- `team:frontend` - Frontend team ownership
- `team:platform` - Platform/infra team ownership

## Priority Tags
- `high-priority` - High business priority
- `critical` - Production-critical issues
- `quick-win` - Easy, high-impact work
```

## Advanced: Capability Tags

For enhanced feature contracts, you can use `capabilityTags` (a dedicated field) to describe **what the feature does**, separate from organizational tags:

```json
{
  "id": "MOD-001-FEAT-001",
  "capabilityTags": [
    "data-entry",
    "reporting",
    "crud-operations"
  ],
  "metadata": {
    "tags": [
      "crm",
      "companies",
      "high-priority",
      "team:backend"
    ]
  }
}
```

**Difference:**
- `capabilityTags` = **What functionality does this provide?**
- `metadata.tags` = **How do we organize/categorize this work?**

## Integration with Tools

### Future Enhancements

Consider building tools to:
1. **Tag visualization**: Generate graphs showing tag relationships
2. **Tag reports**: "Show all work tagged with `high-priority` and `q1-2025`"
3. **Tag validation**: Enforce tag glossary compliance
4. **Tag-based filtering in UIs**: Allow filtering kanban boards by tags

### Sample Reporting Script

```bash
#!/bin/bash
# report-by-tag.sh - Generate a report of all work items by tag

TAG=$1

echo "Work items tagged with: $TAG"
echo "================================"

find test/ -name "*.json" -exec jq -r \
  --arg tag "$TAG" \
  'select(.metadata.tags[]? == $tag) |
   "\(.id): \(.name // .title)"' \
  {} \; | sort
```

Usage:
```bash
./report-by-tag.sh "crm"
./report-by-tag.sh "high-priority"
```

## Summary

The tagging system provides:
- ✅ **Flexibility**: Tag items by any dimension (tech, team, priority, theme)
- ✅ **Cross-cutting views**: Find related work across the hierarchy
- ✅ **Simple queries**: Use standard tools like `grep` and `jq`
- ✅ **No schema changes**: Tags are already part of every contract
- ✅ **Scalability**: Add new tag categories as needs evolve

**Start simple**, add tags that make sense for your team, and evolve your tagging strategy over time!
