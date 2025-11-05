/**
 * Markdown Converter
 *
 * Converts VibeOps contracts (modules, features, issues) to readable Markdown format
 */

import type {
  Module,
  Feature,
  UserStory,
  Bug,
  TechDebt,
  Spike,
  Contract
} from '../types/contracts.js';

/**
 * Convert MODULE JSON to minimal Markdown
 */
function moduleToMarkdown(data: Module): string {
  return `# ${data.name}

**ID:** ${data.id} | **Type:** ${data.type} | **Status:** ${data.status}

${data.description}

**Owner:** ${data.owner || 'Unassigned'}
**Timeline:** ${data.startDate} → ${data.targetDate}

## Features
${(data.features && data.features.length > 0) ? data.features.map(id => `- [${id}](../features/${id}.md)`).join('\n') : '_No features yet_'}

---
_Created: ${data.metadata.createdAt}_
${data.metadata.tags?.length ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert FEATURE JSON to minimal Markdown
 */
function featureToMarkdown(data: Feature): string {
  return `# ${data.name}

**ID:** ${data.id} | **Module:** ${data.moduleId} | **Status:** ${data.status} | **Priority:** ${data.priority}

${data.description}

**Owner:** ${data.owner || 'Unassigned'}

## PRD Summary

### Problem
${data.prd.problemStatement}

### Goals
${(data.prd.goals && data.prd.goals.length > 0) ? data.prd.goals.map((g, i) => `${i + 1}. ${g}`).join('\n') : '_No goals specified_'}

### Success Metrics
${(data.prd.successMetrics && data.prd.successMetrics.length > 0) ? data.prd.successMetrics.map(m => `- **${m.metric}:** ${m.target}`).join('\n') : '_No success metrics specified_'}

### Scope
**In Scope:**
${(data.prd.scope.inScope && data.prd.scope.inScope.length > 0) ? data.prd.scope.inScope.map(s => `- ${s}`).join('\n') : '_Not specified_'}

**Out of Scope:**
${data.prd.scope.outOfScope?.length ? data.prd.scope.outOfScope.map(s => `- ${s}`).join('\n') : '_None specified_'}

### Dependencies
${data.prd.dependencies?.length ? data.prd.dependencies.map(d => `- ${d}`).join('\n') : '_None_'}

## Issues
${(data.issues && data.issues.length > 0) ? data.issues.map(id => `- [${id}](../issues/${id}.md)`).join('\n') : '_No issues yet_'}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert USER STORY JSON to minimal Markdown
 */
function userStoryToMarkdown(data: UserStory): string {
  const ac = data.acceptanceCriteria || [];
  const dod = data.definitionOfDone || [];
  const dor = data.definitionOfReady || [];

  const progress = {
    ac: ac.filter(c => c.verified).length,
    acTotal: ac.length,
    dod: dod.filter(d => d.completed).length,
    dodTotal: dod.length,
    dor: dor.filter(r => r.ready).length,
    dorTotal: dor.length
  };

  return `# ${data.title}

**ID:** ${data.id} | **Feature:** ${data.featureId} | **Status:** ${data.status}
**Points:** ${data.storyPoints || 'Not estimated'} | **Priority:** ${data.priority} | **Assignee:** ${data.assignee || 'Unassigned'}

## Story
${data.description}

## Acceptance Criteria (${progress.ac}/${progress.acTotal} verified)
${ac.length > 0 ? ac.map((c, i) => `${i + 1}. ${c.verified ? '✅' : '⬜'} ${c.criterion}`).join('\n') : '_No acceptance criteria_'}

## Definition of Done (${progress.dod}/${progress.dodTotal} complete)
${dod.length > 0 ? dod.map((d, i) => `${i + 1}. ${d.completed ? '✅' : '⬜'} ${d.item}`).join('\n') : '_No DoD items_'}

## Definition of Ready (${progress.dor}/${progress.dorTotal} ready)
${dor.length > 0 ? dor.map((r, i) => `${i + 1}. ${r.ready ? '✅' : '⬜'} ${r.item}`).join('\n') : '_No DoR items_'}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert BUG JSON to minimal Markdown
 */
function bugToMarkdown(data: Bug): string {
  const repro = data.reproductionSteps || [];

  return `# 🐛 ${data.title}

**ID:** ${data.id} | **Feature:** ${data.featureId} | **Status:** ${data.status} | **Severity:** ${data.severity}
**Assignee:** ${data.assignee || 'Unassigned'}

${data.description}

## Reproduction Steps
${repro.length > 0 ? repro.map((step, i) => `
### Step ${i + 1}: ${step.step}
- **Expected:** ${step.expectedResult}
- **Actual:** ${step.actualResult}
`).join('\n') : '_No reproduction steps documented_'}

## Environment
- **Platform:** ${data.environment.platform}
${data.environment.browser ? `- **Browser:** ${data.environment.browser}` : ''}
- **Version:** ${data.environment.version}

${data.rootCause ? `## Root Cause\n${data.rootCause}\n` : ''}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert TECH DEBT JSON to minimal Markdown
 */
function techDebtToMarkdown(data: TechDebt): string {
  return `# 🔧 ${data.title}

**ID:** ${data.id} | **Feature:** ${data.featureId} | **Status:** ${data.status} | **Priority:** ${data.priority}
**Assignee:** ${data.assignee || 'Unassigned'}

${data.description}

## Impact (${data.impact.severity})
**Affected Areas:** ${(data.impact.areas && data.impact.areas.length > 0) ? data.impact.areas.join(', ') : 'Not specified'}

${data.impact.description}

${(data.impact.metrics && data.impact.metrics.length > 0) ? `### Metrics
${data.impact.metrics.map(m => `- **${m.metric}:** ${m.currentValue} → ${m.targetValue}`).join('\n')}
` : ''}

## Effort
**Estimate:** ${data.effort.estimate} | **Complexity:** ${data.effort.complexity}
${data.effort.storyPoints ? `**Story Points:** ${data.effort.storyPoints}` : ''}

${data.effort.dependencies?.length ? `### Dependencies
${data.effort.dependencies.map(d => `- ${d}`).join('\n')}
` : ''}

${data.proposedSolution ? `## Proposed Solution
${data.proposedSolution}
` : ''}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Convert SPIKE JSON to minimal Markdown
 */
function spikeToMarkdown(data: Spike): string {
  const questions = data.questions || [];
  const objectives = data.objectives || [];
  const answered = questions.filter(q => q.answered).length;

  return `# 🔬 ${data.title}

**ID:** ${data.id} | **Feature:** ${data.featureId} | **Status:** ${data.status}
**Assignee:** ${data.assignee || 'Unassigned'}
**Timebox:** ${data.timebox.duration} ${data.timebox.unit}

${data.description}

## Research Questions (${answered}/${questions.length} answered)
${questions.length > 0 ? questions.map((q, i) => `
### ${i + 1}. ${q.answered ? '✅' : '❓'} ${q.question}
${q.answer ? `**Answer:** ${q.answer}` : '_Not answered yet_'}
`).join('\n') : '_No questions defined_'}

## Objectives
${objectives.length > 0 ? objectives.map((o, i) => `${i + 1}. ${o}`).join('\n') : '_No objectives defined_'}

${data.findings?.summary ? `## Findings

### Summary
${data.findings.summary}

${data.findings.recommendations?.length ? `### Recommendations
${data.findings.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}

${data.findings.risks?.length ? `### Risks
${data.findings.risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}
` : ''}

${data.findings.nextSteps?.length ? `### Next Steps
${data.findings.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}
` : ''}
` : ''}

---
_Created: ${data.metadata.createdAt} | Updated: ${data.metadata.updatedAt}_
${data.metadata.tags?.length ? `_Tags: ${data.metadata.tags.join(', ')}_` : ''}
`;
}

/**
 * Detect contract type and convert to markdown
 */
export function convertToMarkdown(contract: Contract): string {
  const id = contract.id;

  if (id.startsWith('MOD-')) return moduleToMarkdown(contract as Module);
  if (id.startsWith('FEAT-')) return featureToMarkdown(contract as Feature);
  if (id.startsWith('STORY-')) return userStoryToMarkdown(contract as UserStory);
  if (id.startsWith('BUG-')) return bugToMarkdown(contract as Bug);
  if (id.startsWith('DEBT-')) return techDebtToMarkdown(contract as TechDebt);
  if (id.startsWith('SPIKE-')) return spikeToMarkdown(contract as Spike);

  throw new Error(`Unknown contract type for ID: ${id}`);
}
