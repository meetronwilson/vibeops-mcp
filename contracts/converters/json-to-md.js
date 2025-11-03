import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, basename, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Convert MODULE JSON to minimal Markdown
 */
function moduleToMarkdown(data) {
  return `# ${data.name}

**ID:** ${data.id} | **Type:** ${data.type} | **Status:** ${data.status}

${data.description}

**Owner:** ${data.owner || 'Unassigned'}
**Timeline:** ${data.startDate} → ${data.targetDate}

## Features
${data.features.length > 0 ? data.features.map(id => `- ${id}`).join('\n') : '_No features yet_'}

---
_Created: ${data.metadata.createdAt}_
${data.metadata.tags?.length > 0 ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert FEATURE JSON to minimal Markdown
 */
function featureToMarkdown(data) {
  return `# ${data.name}

**ID:** ${data.id} | **Module:** ${data.moduleId} | **Status:** ${data.status} | **Priority:** ${data.priority}

${data.description}

**Owner:** ${data.owner || 'Unassigned'}

## PRD Summary

### Problem
${data.prd.problemStatement}

### Goals
${data.prd.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

### Success Metrics
${data.prd.successMetrics.map(m => `- **${m.metric}:** ${m.target}`).join('\n')}

### Scope
**In Scope:**
${data.prd.scope.inScope.map(s => `- ${s}`).join('\n')}

**Out of Scope:**
${data.prd.scope.outOfScope?.length > 0 ? data.prd.scope.outOfScope.map(s => `- ${s}`).join('\n') : '_None specified_'}

### Dependencies
${data.prd.dependencies?.length > 0 ? data.prd.dependencies.map(d => `- ${d}`).join('\n') : '_None_'}

## Issues
${data.issues.length > 0 ? data.issues.map(id => `- ${id}`).join('\n') : '_No issues yet_'}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length > 0 ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert USER STORY JSON to minimal Markdown
 */
function userStoryToMarkdown(data) {
  const progress = {
    ac: data.acceptanceCriteria.filter(c => c.verified).length,
    acTotal: data.acceptanceCriteria.length,
    dod: data.definitionOfDone.filter(d => d.completed).length,
    dodTotal: data.definitionOfDone.length,
    dor: data.definitionOfReady.filter(r => r.ready).length,
    dorTotal: data.definitionOfReady.length
  };

  return `# ${data.title}

**ID:** ${data.id} | **Feature:** ${data.featureId} | **Status:** ${data.status}
**Points:** ${data.storyPoints || 'Not estimated'} | **Priority:** ${data.priority} | **Assignee:** ${data.assignee || 'Unassigned'}

## Story
${data.description}

## Acceptance Criteria (${progress.ac}/${progress.acTotal} verified)
${data.acceptanceCriteria.map((c, i) => `${i + 1}. ${c.verified ? '✅' : '⬜'} ${c.criterion}`).join('\n')}

## Definition of Done (${progress.dod}/${progress.dodTotal} complete)
${data.definitionOfDone.map((d, i) => `${i + 1}. ${d.completed ? '✅' : '⬜'} ${d.item}`).join('\n')}

## Definition of Ready (${progress.dor}/${progress.dorTotal} ready)
${data.definitionOfReady.map((r, i) => `${i + 1}. ${r.ready ? '✅' : '⬜'} ${r.item}`).join('\n')}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length > 0 ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert BUG JSON to minimal Markdown
 */
function bugToMarkdown(data) {
  return `# 🐛 ${data.title}

**ID:** ${data.id} | **Feature:** ${data.featureId} | **Status:** ${data.status} | **Severity:** ${data.severity}
**Assignee:** ${data.assignee || 'Unassigned'}

${data.description}

## Reproduction Steps
${data.reproductionSteps.map((step, i) => `
### Step ${i + 1}: ${step.step}
- **Expected:** ${step.expectedResult}
- **Actual:** ${step.actualResult}
`).join('\n')}

## Environment
- **Platform:** ${data.environment.platform}
${data.environment.browser ? `- **Browser:** ${data.environment.browser}` : ''}
- **Version:** ${data.environment.version}

${data.rootCause ? `## Root Cause\n${data.rootCause}\n` : ''}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length > 0 ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert TECH DEBT JSON to minimal Markdown
 */
function techDebtToMarkdown(data) {
  return `# 🔧 ${data.title}

**ID:** ${data.id} | **Feature:** ${data.featureId} | **Status:** ${data.status} | **Priority:** ${data.priority}
**Assignee:** ${data.assignee || 'Unassigned'}

${data.description}

## Impact (${data.impact.severity})
**Affected Areas:** ${data.impact.areas.join(', ')}

${data.impact.description}

${data.impact.metrics ? `### Metrics
${data.impact.metrics.map(m => `- **${m.metric}:** ${m.currentValue} → ${m.targetValue}`).join('\n')}
` : ''}

## Effort
**Estimate:** ${data.effort.estimate} | **Complexity:** ${data.effort.complexity}
${data.effort.storyPoints ? `**Story Points:** ${data.effort.storyPoints}` : ''}

${data.effort.dependencies?.length > 0 ? `### Dependencies
${data.effort.dependencies.map(d => `- ${d}`).join('\n')}
` : ''}

${data.proposedSolution ? `## Proposed Solution
${data.proposedSolution}
` : ''}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length > 0 ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert SPIKE JSON to minimal Markdown
 */
function spikeToMarkdown(data) {
  const answered = data.questions.filter(q => q.answered).length;

  return `# 🔬 ${data.title}

**ID:** ${data.id} | **Feature:** ${data.featureId} | **Status:** ${data.status}
**Assignee:** ${data.assignee || 'Unassigned'}
**Timebox:** ${data.timebox.duration} ${data.timebox.unit}

${data.description}

## Research Questions (${answered}/${data.questions.length} answered)
${data.questions.map((q, i) => `
### ${i + 1}. ${q.answered ? '✅' : '❓'} ${q.question}
${q.answer ? `**Answer:** ${q.answer}` : '_Not answered yet_'}
`).join('\n')}

## Objectives
${data.objectives.map((o, i) => `${i + 1}. ${o}`).join('\n')}

${data.findings?.summary ? `## Findings

### Summary
${data.findings.summary}

${data.findings.recommendations?.length > 0 ? `### Recommendations
${data.findings.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}

${data.findings.risks?.length > 0 ? `### Risks
${data.findings.risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}

${data.findings.nextSteps?.length > 0 ? `### Next Steps
${data.findings.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
` : ''}
` : ''}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length > 0 ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Detect contract type and convert to markdown
 */
export function convertToMarkdown(jsonData) {
  const id = jsonData.id;

  if (id.startsWith('MOD-')) return moduleToMarkdown(jsonData);
  if (id.startsWith('FEAT-')) return featureToMarkdown(jsonData);
  if (id.startsWith('STORY-')) return userStoryToMarkdown(jsonData);
  if (id.startsWith('BUG-')) return bugToMarkdown(jsonData);
  if (id.startsWith('DEBT-')) return techDebtToMarkdown(jsonData);
  if (id.startsWith('SPIKE-')) return spikeToMarkdown(jsonData);

  throw new Error(`Unknown contract type for ID: ${id}`);
}

/**
 * Convert a JSON file to Markdown
 */
export function convertFile(inputPath, outputPath) {
  const jsonContent = readFileSync(inputPath, 'utf-8');
  const jsonData = JSON.parse(jsonContent);
  const markdown = convertToMarkdown(jsonData);

  // Create output directory if it doesn't exist
  mkdirSync(dirname(outputPath), { recursive: true });

  writeFileSync(outputPath, markdown, 'utf-8');
  return outputPath;
}

// CLI interface
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    console.error('Usage: node json-to-md.js <input.json> [output.md]');
    console.error('If output path is not provided, will use same name with .md extension');
    process.exit(1);
  }

  const inputPath = args[0];
  const outputPath = args[1] || inputPath.replace('.json', '.md');

  try {
    const result = convertFile(inputPath, outputPath);
    console.log(`✓ Converted: ${basename(inputPath)} → ${basename(result)}`);
  } catch (error) {
    console.error(`✗ Error: ${error.message}`);
    process.exit(1);
  }
}
