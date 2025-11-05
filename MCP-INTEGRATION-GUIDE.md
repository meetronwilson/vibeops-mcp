# MCP Server Integration Guide - Overlap Detection

This guide shows how to integrate the overlap detection tools into your existing VibeOps MCP server.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Adding MCP Tool Definitions](#adding-mcp-tool-definitions)
3. [Integrating with Existing Tools](#integrating-with-existing-tools)
4. [Testing](#testing)
5. [Deployment](#deployment)

---

## Quick Start

### Prerequisites

- Existing VibeOps MCP server running
- TypeScript 5.3+
- Node.js 18+

### Installation Steps

1. **Copy tool implementations** to your MCP server:
```bash
cp mcp/src/tools/check-overlap.ts your-mcp/src/tools/
cp mcp/src/tools/validate-graph.ts your-mcp/src/tools/
cp mcp/src/tools/search-similar.ts your-mcp/src/tools/
```

2. **Update schemas** (backup originals first):
```bash
# Backup
cp contracts/schemas/feature.schema.json contracts/schemas/feature.schema.backup.json
cp contracts/schemas/module.schema.json contracts/schemas/module.schema.backup.json

# Replace with enhanced versions
cp contracts/schemas/feature.schema.enhanced.json contracts/schemas/feature.schema.json
cp contracts/schemas/module.schema.enhanced.json contracts/schemas/module.schema.json
```

3. **Update feature template**:
```bash
cp contracts/templates/feature.template.enhanced.json contracts/templates/feature.template.json
```

4. **Install any new dependencies** (if needed):
```bash
npm install
```

---

## Adding MCP Tool Definitions

### 1. Register New Tools in MCP Server

In your main MCP server file (e.g., `src/index.ts`):

```typescript
import { checkFeatureOverlap, formatOverlapResults } from './tools/check-overlap.js';
import { validateFeatureGraph, formatValidationResults } from './tools/validate-graph.js';
import { searchSimilarFeatures, formatSimilarityResults } from './tools/search-similar.js';

// Add to your tool list
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      // ... existing tools ...

      {
        name: "check_feature_overlap",
        description: "Detect potential overlaps before creating or updating features. Analyzes capability tags, problem statements, scope, and target users to find conflicts with existing features.",
        inputSchema: {
          type: "object",
          properties: {
            featureId: {
              type: "string",
              description: "Optional: Existing feature ID when updating (will skip self in comparison)"
            },
            name: {
              type: "string",
              description: "Feature name"
            },
            problemStatement: {
              type: "string",
              description: "The problem this feature solves"
            },
            capabilityTags: {
              type: "array",
              items: { type: "string" },
              description: "Capability tags for this feature"
            },
            targetUsers: {
              type: "array",
              items: { type: "string" },
              description: "Primary users of this feature"
            },
            inScope: {
              type: "array",
              items: { type: "string" },
              description: "What's included in this feature"
            },
            outOfScope: {
              type: "array",
              items: { type: "string" },
              description: "What's explicitly not included"
            },
            moduleId: {
              type: "string",
              description: "Parent module ID"
            }
          },
          required: ["problemStatement", "capabilityTags", "targetUsers", "inScope"]
        }
      },

      {
        name: "validate_feature_graph",
        description: "Validate the entire feature dependency graph for circular dependencies, missing references, orphaned features, and data contract consistency. Run this regularly to maintain graph health.",
        inputSchema: {
          type: "object",
          properties: {},
          required: []
        }
      },

      {
        name: "search_similar_features",
        description: "Find features with similar problem statements or scope using semantic analysis. Useful during ideation and before writing PRDs.",
        inputSchema: {
          type: "object",
          properties: {
            problemStatement: {
              type: "string",
              description: "Problem statement to search for"
            },
            scopeItems: {
              type: "array",
              items: { type: "string" },
              description: "Scope items to match against"
            },
            capabilityTags: {
              type: "array",
              items: { type: "string" },
              description: "Capability tags to match"
            },
            goals: {
              type: "array",
              items: { type: "string" },
              description: "Goals to match"
            },
            threshold: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Similarity threshold (0-1), default 0.3"
            }
          }
        }
      }
    ]
  };
});
```

### 2. Implement Tool Handlers

```typescript
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      // ... existing tools ...

      case "check_feature_overlap": {
        const results = await checkFeatureOverlap(
          {
            featureId: args.featureId,
            name: args.name,
            problemStatement: args.problemStatement,
            capabilityTags: args.capabilityTags || [],
            targetUsers: args.targetUsers || [],
            inScope: args.inScope || [],
            outOfScope: args.outOfScope || [],
            moduleId: args.moduleId
          },
          path.join(process.cwd(), 'features')
        );

        return {
          content: [{
            type: "text",
            text: formatOverlapResults(results)
          }]
        };
      }

      case "validate_feature_graph": {
        const result = await validateFeatureGraph(
          path.join(process.cwd(), 'features'),
          path.join(process.cwd(), 'modules')
        );

        return {
          content: [{
            type: "text",
            text: formatValidationResults(result)
          }]
        };
      }

      case "search_similar_features": {
        const results = await searchSimilarFeatures(
          {
            problemStatement: args.problemStatement,
            scopeItems: args.scopeItems,
            capabilityTags: args.capabilityTags,
            goals: args.goals,
            threshold: args.threshold || 0.3
          },
          path.join(process.cwd(), 'features')
        );

        return {
          content: [{
            type: "text",
            text: formatSimilarityResults(results, true)
          }]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error.message}`
      }],
      isError: true
    };
  }
});
```

---

## Integrating with Existing Tools

### Update `create_feature` Tool

Add automatic overlap checking:

```typescript
case "create_feature": {
  // 1. VALIDATE INPUT (existing code)
  const validation = validateContract(args, 'feature');
  if (!validation.valid) {
    return {
      content: [{ type: "text", text: `Validation failed: ${validation.errors.join(', ')}` }],
      isError: true
    };
  }

  // 2. NEW: CHECK FOR OVERLAPS BEFORE CREATION
  const overlapResults = await checkFeatureOverlap(
    {
      name: args.name,
      problemStatement: args.prd.problemStatement,
      capabilityTags: args.capabilityTags || [],
      targetUsers: args.targetUsers || [],
      inScope: args.prd.scope.inScope,
      outOfScope: args.prd.scope.outOfScope || [],
      moduleId: args.moduleId
    },
    path.join(process.cwd(), 'features')
  );

  // 3. HANDLE HIGH OVERLAPS
  const highOverlaps = overlapResults.filter(r => r.severity === 'high');
  if (highOverlaps.length > 0) {
    const overlapMsg = formatOverlapResults(overlapResults);
    return {
      content: [{
        type: "text",
        text: `⚠️ HIGH OVERLAP DETECTED\n\n${overlapMsg}\n\n` +
              `This feature appears to significantly overlap with existing features. ` +
              `Consider:\n` +
              `1. Enhancing an existing feature instead\n` +
              `2. Defining clear differentiation in outOfScope\n` +
              `3. Adding explicit relatedFeatures relationships\n\n` +
              `To proceed anyway, user must explicitly confirm.`
      }]
    };
  }

  // 4. WARN ABOUT MEDIUM OVERLAPS
  const mediumOverlaps = overlapResults.filter(r => r.severity === 'medium');
  if (mediumOverlaps.length > 0 && (!args.relatedFeatures || args.relatedFeatures.length === 0)) {
    return {
      content: [{
        type: "text",
        text: `⚠️ MEDIUM OVERLAP DETECTED\n\n${formatOverlapResults(overlapResults)}\n\n` +
              `Please add relatedFeatures entries to document how this feature relates ` +
              `to the overlapping features.`
      }]
    };
  }

  // 5. INFO ABOUT LOW OVERLAPS (non-blocking)
  if (overlapResults.length > 0) {
    console.log(`ℹ️ Low overlap detected: ${overlapResults.length} related features found`);
  }

  // 6. PROCEED WITH CREATION (existing code)
  const featureId = generateId('FEAT');
  const now = new Date().toISOString();

  const feature = {
    ...args,
    id: featureId,
    metadata: {
      ...args.metadata,
      createdAt: now,
      updatedAt: now,
      overlapCheckLastRun: now,
      overlapWarnings: overlapResults.map(r => ({
        featureId: r.featureId,
        severity: r.severity,
        reason: r.reasons.join('; '),
        detectedAt: now
      }))
    }
  };

  await fs.writeFile(
    path.join(process.cwd(), 'features', `${featureId}.json`),
    JSON.stringify(feature, null, 2)
  );

  return {
    content: [{
      type: "text",
      text: `✅ Feature created: ${featureId}\n\n` +
            `${overlapResults.length > 0 ? `Note: ${overlapResults.length} related features found and documented in metadata.\n` : ''}`
    }]
  };
}
```

### Update `update_feature` Tool

Add overlap checking for updates:

```typescript
case "update_feature": {
  // 1. LOAD EXISTING FEATURE
  const existingPath = path.join(process.cwd(), 'features', `${args.featureId}.json`);
  const existingFeature = JSON.parse(await fs.readFile(existingPath, 'utf-8'));

  // 2. CHECK IF UPDATE CHANGES CAPABILITIES OR SCOPE
  const capabilityChanged = args.capabilityTags &&
    JSON.stringify(args.capabilityTags) !== JSON.stringify(existingFeature.capabilityTags);

  const scopeChanged = args.prd?.scope &&
    JSON.stringify(args.prd.scope) !== JSON.stringify(existingFeature.prd.scope);

  // 3. IF SIGNIFICANT CHANGES, RUN OVERLAP CHECK
  if (capabilityChanged || scopeChanged) {
    const overlapResults = await checkFeatureOverlap(
      {
        featureId: args.featureId,  // Skip self
        name: args.name || existingFeature.name,
        problemStatement: args.prd?.problemStatement || existingFeature.prd.problemStatement,
        capabilityTags: args.capabilityTags || existingFeature.capabilityTags || [],
        targetUsers: args.targetUsers || existingFeature.targetUsers || [],
        inScope: args.prd?.scope?.inScope || existingFeature.prd.scope.inScope,
        outOfScope: args.prd?.scope?.outOfScope || existingFeature.prd.scope.outOfScope || [],
        moduleId: args.moduleId || existingFeature.moduleId
      },
      path.join(process.cwd(), 'features')
    );

    const highOverlaps = overlapResults.filter(r => r.severity === 'high');
    if (highOverlaps.length > 0) {
      return {
        content: [{
          type: "text",
          text: `⚠️ UPDATE CREATES HIGH OVERLAP\n\n${formatOverlapResults(overlapResults)}\n\n` +
                `This update would create significant overlap with existing features. ` +
                `Consider reviewing the scope changes.`
        }]
      };
    }

    // Store overlap warnings in metadata
    existingFeature.metadata.overlapWarnings = overlapResults.map(r => ({
      featureId: r.featureId,
      severity: r.severity,
      reason: r.reasons.join('; '),
      detectedAt: new Date().toISOString()
    }));
    existingFeature.metadata.overlapCheckLastRun = new Date().toISOString();
  }

  // 4. PROCEED WITH UPDATE (existing code)
  const updatedFeature = {
    ...existingFeature,
    ...args,
    metadata: {
      ...existingFeature.metadata,
      ...args.metadata,
      updatedAt: new Date().toISOString()
    }
  };

  await fs.writeFile(existingPath, JSON.stringify(updatedFeature, null, 2));

  return {
    content: [{
      type: "text",
      text: `✅ Feature updated: ${args.featureId}`
    }]
  };
}
```

---

## Testing

### Manual Testing

Test each new tool:

```bash
# 1. Test overlap detection
echo 'Use check_feature_overlap with:
- problemStatement: "Help superintendents create schedules"
- capabilityTags: ["ai-scheduling", "worker-assignment"]
- targetUsers: ["Superintendents"]
- inScope: ["Generate schedules", "Assign workers"]
' | npx vibeops

# 2. Test graph validation
echo 'Use validate_feature_graph' | npx vibeops

# 3. Test similarity search
echo 'Use search_similar_features with:
- problemStatement: "Optimize crew assignments"
- capabilityTags: ["scheduling"]
- threshold: 0.3
' | npx vibeops
```

### Automated Testing

Create test file `test/overlap-detection.test.ts`:

```typescript
import { checkFeatureOverlap } from '../src/tools/check-overlap';
import { validateFeatureGraph } from '../src/tools/validate-graph';
import { searchSimilarFeatures } from '../src/tools/search-similar';

describe('Overlap Detection', () => {
  test('detects high overlap with same capabilities', async () => {
    const results = await checkFeatureOverlap({
      problemStatement: "Help superintendents create optimal schedules",
      capabilityTags: ["ai-scheduling", "worker-assignment", "optimization"],
      targetUsers: ["Superintendents"],
      inScope: ["Generate AI schedules", "Assign crews"],
      moduleId: "MOD-001"
    }, './test/fixtures/features');

    expect(results).toHaveLength(1);
    expect(results[0].featureId).toBe('FEAT-002');
    expect(results[0].severity).toBe('high');
  });

  test('detects scope conflicts', async () => {
    const results = await checkFeatureOverlap({
      problemStatement: "Manual schedule entry",
      capabilityTags: ["manual-scheduling"],
      targetUsers: ["Superintendents"],
      inScope: ["AI-powered scheduling"],  // Conflicts with FEAT-0055's outOfScope
      outOfScope: [],
      moduleId: "MOD-003"
    }, './test/fixtures/features');

    const hasConflict = results.some(r =>
      r.details.scopeConflicts && r.details.scopeConflicts.length > 0
    );
    expect(hasConflict).toBe(true);
  });

  test('validates feature graph without errors', async () => {
    const result = await validateFeatureGraph(
      './test/fixtures/features',
      './test/fixtures/modules'
    );

    expect(result.valid).toBe(true);
    expect(result.issues.filter(i => i.type === 'error')).toHaveLength(0);
  });
});
```

Run tests:
```bash
npm test
```

---

## Deployment

### 1. Schema Migration

Update your validation to use the new schema:

```typescript
// src/validation.ts
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import featureSchema from '../contracts/schemas/feature.schema.json';
import moduleSchema from '../contracts/schemas/module.schema.json';

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const validateFeature = ajv.compile(featureSchema);
export const validateModule = ajv.compile(moduleSchema);
```

### 2. Update Documentation

Add to your README.md:

```markdown
## New Feature Creation Workflow

When creating a new feature:

1. Claude Code automatically runs `check_feature_overlap`
2. If HIGH overlap is detected, user must confirm or modify scope
3. If MEDIUM overlap, related features must be documented
4. Feature is created with overlap warnings in metadata

See OVERLAP-DETECTION-GUIDE.md for full details.
```

### 3. CI/CD Integration

Add graph validation to your CI pipeline:

`.github/workflows/validate.yml`:
```yaml
name: Validate Feature Graph

on:
  pull_request:
    paths:
      - 'features/**'
      - 'modules/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Validate feature graph
        run: |
          node -e "
          import { validateFeatureGraph } from './build/tools/validate-graph.js';
          const result = await validateFeatureGraph('./features', './modules');
          if (!result.valid) {
            console.error('❌ Feature graph validation failed');
            console.error(result.issues.filter(i => i.type === 'error'));
            process.exit(1);
          }
          console.log('✅ Feature graph validation passed');
          "

      - name: Comment PR with results
        if: always()
        uses: actions/github-script@v6
        with:
          script: |
            const result = require('./validation-result.json');
            const body = `## Feature Graph Validation

            ${result.valid ? '✅ Passed' : '❌ Failed'}

            - Features: ${result.statistics.totalFeatures}
            - With Relationships: ${result.statistics.featuresWithRelationships}
            - Orphaned: ${result.statistics.orphanedFeatures}
            - Errors: ${result.issues.filter(i => i.type === 'error').length}
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body
            });
```

### 4. Scheduled Validation

Set up weekly validation job:

`.github/workflows/weekly-validation.yml`:
```yaml
name: Weekly Feature Graph Validation

on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9am
  workflow_dispatch:

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3

      - name: Run full validation
        run: npm run validate:graph

      - name: Create issue if errors found
        if: failure()
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Feature Graph Validation Errors',
              body: 'Weekly validation found errors. Please review.',
              labels: ['technical-debt', 'validation']
            });
```

---

## Configuration

### Environment Variables

Add to your `.env`:

```bash
# Overlap detection settings
OVERLAP_CHECK_ENABLED=true
OVERLAP_HIGH_BLOCK_CREATION=true
OVERLAP_REQUIRE_RELATIONSHIPS=true

# Validation settings
VALIDATE_ON_CREATE=true
VALIDATE_ON_UPDATE=true

# Paths
FEATURES_DIR=./features
MODULES_DIR=./modules
```

### Loading Config

```typescript
// src/config.ts
export const config = {
  overlapCheck: {
    enabled: process.env.OVERLAP_CHECK_ENABLED !== 'false',
    blockOnHigh: process.env.OVERLAP_HIGH_BLOCK_CREATION !== 'false',
    requireRelationships: process.env.OVERLAP_REQUIRE_RELATIONSHIPS !== 'false'
  },
  validation: {
    onCreate: process.env.VALIDATE_ON_CREATE !== 'false',
    onUpdate: process.env.VALIDATE_ON_UPDATE !== 'false'
  },
  paths: {
    features: process.env.FEATURES_DIR || './features',
    modules: process.env.MODULES_DIR || './modules'
  }
};
```

---

## Monitoring & Metrics

### Track Overlap Detection

Add telemetry:

```typescript
// src/telemetry.ts
interface OverlapMetrics {
  totalChecks: number;
  highOverlapsBlocked: number;
  mediumOverlapsWarned: number;
  averageCheckTime: number;
}

export const metrics: OverlapMetrics = {
  totalChecks: 0,
  highOverlapsBlocked: 0,
  mediumOverlapsWarned: 0,
  averageCheckTime: 0
};

export function recordOverlapCheck(result: OverlapResult[], duration: number) {
  metrics.totalChecks++;
  metrics.averageCheckTime = (metrics.averageCheckTime * (metrics.totalChecks - 1) + duration) / metrics.totalChecks;

  const highCount = result.filter(r => r.severity === 'high').length;
  const mediumCount = result.filter(r => r.severity === 'medium').length;

  if (highCount > 0) metrics.highOverlapsBlocked++;
  if (mediumCount > 0) metrics.mediumOverlapsWarned++;
}
```

### Dashboard

Track key metrics:
- Overlap checks per week
- High overlaps blocked
- Features created with relationships
- Graph validation pass rate
- Average similarity scores

---

## Troubleshooting

### Issue: "Too many false positive overlaps"

**Solution:** Adjust similarity threshold or refine capability tags

```typescript
// Increase threshold for stricter matching
const results = await checkFeatureOverlap(input, featuresDir, { threshold: 0.5 });
```

### Issue: "Circular dependency detected but can't fix"

**Solution:** Change one relationship from `depends-on` to `integrates-with` or `complements`

### Issue: "Graph validation taking too long"

**Solution:** Add caching or run validation async

```typescript
// Cache validation results
const validationCache = new Map<string, ValidationResult>();
```

---

## Next Steps

1. ✅ Complete integration
2. ✅ Test with existing features
3. ✅ Migrate high-priority features first
4. ✅ Train team on new workflow
5. ✅ Monitor metrics
6. ✅ Iterate based on feedback

---

## Support

For questions:
- GitHub Issues: https://github.com/vibeops/vibeops-mcp/issues
- Main Guide: /OVERLAP-DETECTION-GUIDE.md
- Schema Docs: /contracts/schemas/

---

**Last Updated:** 2025-01-20
