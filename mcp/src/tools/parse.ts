/**
 * PARSE Operations
 *
 * Tools for parsing text (e.g., from ChatGPT) and creating contracts
 */

import { createModule, CreateModuleInput } from './create.js';
import { createFeature, CreateFeatureInput } from './create.js';
import { createIssue, CreateIssueInput } from './create.js';

/**
 * Parsed contract data structure
 */
export interface ParsedModule {
  name: string;
  description: string;
  type: 'theme' | 'initiative';
  features: ParsedFeature[];
}

export interface ParsedFeature {
  name: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  prd?: {
    problemStatement: string;
    goals: string[];
    successMetrics: Array<{ metric: string; target: string }>;
    scope: {
      inScope: string[];
      outOfScope?: string[];
    };
  };
  issues: ParsedIssue[];
}

export interface ParsedIssue {
  type: 'user-story' | 'bug' | 'tech-debt' | 'spike';
  title: string;
  description: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  acceptanceCriteria?: string[];
}

export interface ParseResult {
  modules: ParsedModule[];
  orphanedFeatures: ParsedFeature[];
  orphanedIssues: ParsedIssue[];
}

/**
 * Parse text and extract product contracts
 */
export function parseText(text: string): ParseResult {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const result: ParseResult = {
    modules: [],
    orphanedFeatures: [],
    orphanedIssues: [],
  };

  let currentModule: ParsedModule | null = null;
  let currentFeature: ParsedFeature | null = null;
  let currentIssue: ParsedIssue | null = null;
  let inPRD = false;
  let inAcceptanceCriteria = false;
  let inScope = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Module detection
    if (isModuleHeader(line)) {
      // Save previous module
      if (currentModule) {
        if (currentFeature) {
          currentModule.features.push(currentFeature);
          currentFeature = null;
        }
        result.modules.push(currentModule);
      }

      currentModule = {
        name: extractName(line),
        description: '',
        type: inferModuleType(line),
        features: [],
      };
      continue;
    }

    // Feature detection
    if (isFeatureHeader(line)) {
      // Save previous feature
      if (currentFeature && currentModule) {
        currentModule.features.push(currentFeature);
      } else if (currentFeature) {
        result.orphanedFeatures.push(currentFeature);
      }

      currentFeature = {
        name: extractName(line),
        description: '',
        priority: 'medium',
        issues: [],
      };
      inPRD = false;
      continue;
    }

    // Issue detection
    if (isIssueHeader(line)) {
      // Save previous issue
      if (currentIssue && currentFeature) {
        currentFeature.issues.push(currentIssue);
      } else if (currentIssue) {
        result.orphanedIssues.push(currentIssue);
      }

      const issueType = inferIssueType(line);
      currentIssue = {
        type: issueType,
        title: extractName(line),
        description: '',
        priority: 'medium',
        acceptanceCriteria: [],
      };
      inAcceptanceCriteria = false;
      continue;
    }

    // PRD section detection
    if (line.toLowerCase().includes('prd:') || line.toLowerCase().includes('product requirements')) {
      inPRD = true;
      if (currentFeature && !currentFeature.prd) {
        currentFeature.prd = {
          problemStatement: '',
          goals: [],
          successMetrics: [],
          scope: { inScope: [] },
        };
      }
      continue;
    }

    // Acceptance Criteria detection
    if (line.toLowerCase().includes('acceptance criteria') || line.toLowerCase().includes('ac:')) {
      inAcceptanceCriteria = true;
      continue;
    }

    // Problem statement
    if (inPRD && (line.toLowerCase().startsWith('problem:') || line.toLowerCase().startsWith('problem statement:'))) {
      if (currentFeature?.prd) {
        currentFeature.prd.problemStatement = extractAfterColon(line);
      }
      continue;
    }

    // Goals
    if (inPRD && line.toLowerCase().startsWith('goal')) {
      if (currentFeature?.prd) {
        currentFeature.prd.goals.push(extractAfterColon(line) || extractBullet(line));
      }
      continue;
    }

    // Scope
    if (inPRD && (line.toLowerCase().includes('in scope') || line.toLowerCase().includes('scope:'))) {
      inScope = true;
      continue;
    }

    // Bullet points
    if (line.match(/^[-*•]\s+/)) {
      const text = line.replace(/^[-*•]\s+/, '');

      if (inAcceptanceCriteria && currentIssue) {
        currentIssue.acceptanceCriteria?.push(text);
      } else if (inPRD && currentFeature?.prd) {
        if (inScope) {
          currentFeature.prd.scope.inScope.push(text);
        } else {
          currentFeature.prd.goals.push(text);
        }
      } else if (currentIssue) {
        currentIssue.description += (currentIssue.description ? ' ' : '') + text;
      } else if (currentFeature) {
        currentFeature.description += (currentFeature.description ? ' ' : '') + text;
      } else if (currentModule) {
        currentModule.description += (currentModule.description ? ' ' : '') + text;
      }
      continue;
    }

    // Regular text - append to description
    if (currentIssue) {
      currentIssue.description += (currentIssue.description ? ' ' : '') + line;
    } else if (currentFeature) {
      currentFeature.description += (currentFeature.description ? ' ' : '') + line;
    } else if (currentModule) {
      currentModule.description += (currentModule.description ? ' ' : '') + line;
    }
  }

  // Save remaining items
  if (currentIssue && currentFeature) {
    currentFeature.issues.push(currentIssue);
  } else if (currentIssue) {
    result.orphanedIssues.push(currentIssue);
  }

  if (currentFeature && currentModule) {
    currentModule.features.push(currentFeature);
  } else if (currentFeature) {
    result.orphanedFeatures.push(currentFeature);
  }

  if (currentModule) {
    result.modules.push(currentModule);
  }

  return result;
}

/**
 * Helper: Detect module headers
 */
function isModuleHeader(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.startsWith('module:') ||
    lower.startsWith('# module:') ||
    lower.startsWith('## module:') ||
    lower.match(/^module\s+\d+:/i) !== null ||
    lower.includes('theme:') ||
    lower.includes('initiative:')
  );
}

/**
 * Helper: Detect feature headers
 */
function isFeatureHeader(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.startsWith('feature:') ||
    lower.startsWith('# feature:') ||
    lower.startsWith('## feature:') ||
    lower.startsWith('### feature:') ||
    lower.match(/^feature\s+\d+:/i) !== null
  );
}

/**
 * Helper: Detect issue headers
 */
function isIssueHeader(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.startsWith('story:') ||
    lower.startsWith('user story:') ||
    lower.startsWith('bug:') ||
    lower.startsWith('tech debt:') ||
    lower.startsWith('spike:') ||
    lower.match(/^(story|bug|debt|spike)\s+\d+:/i) !== null
  );
}

/**
 * Helper: Extract name from header
 */
function extractName(line: string): string {
  // Remove markdown headers
  let cleaned = line.replace(/^#+\s*/, '');

  // Remove prefixes like "Module:", "Feature:", etc.
  cleaned = cleaned.replace(/^(module|feature|story|user story|bug|tech debt|spike)\s*\d*:\s*/i, '');

  return cleaned.trim();
}

/**
 * Helper: Extract text after colon
 */
function extractAfterColon(line: string): string {
  const parts = line.split(':');
  if (parts.length > 1) {
    return parts.slice(1).join(':').trim();
  }
  return '';
}

/**
 * Helper: Extract bullet text
 */
function extractBullet(line: string): string {
  return line.replace(/^[-*•]\s+/, '').trim();
}

/**
 * Helper: Infer module type from text
 */
function inferModuleType(line: string): 'theme' | 'initiative' {
  const lower = line.toLowerCase();
  if (lower.includes('theme')) return 'theme';
  if (lower.includes('initiative')) return 'initiative';
  return 'theme'; // default
}

/**
 * Helper: Infer issue type from text
 */
function inferIssueType(line: string): 'user-story' | 'bug' | 'tech-debt' | 'spike' {
  const lower = line.toLowerCase();
  if (lower.includes('bug')) return 'bug';
  if (lower.includes('tech debt') || lower.includes('debt')) return 'tech-debt';
  if (lower.includes('spike')) return 'spike';
  return 'user-story'; // default
}

/**
 * Create contracts from parsed data
 */
export interface CreateFromParseOptions {
  dryRun?: boolean; // Preview only, don't create
}

export interface CreateFromParseResult {
  created: {
    modules: string[];
    features: string[];
    issues: string[];
  };
  preview?: ParseResult;
}

export function createFromParsed(
  parsed: ParseResult,
  options?: CreateFromParseOptions
): CreateFromParseResult {
  const result: CreateFromParseResult = {
    created: {
      modules: [],
      features: [],
      issues: [],
    },
  };

  if (options?.dryRun) {
    result.preview = parsed;
    return result;
  }

  // Create modules with features and issues
  for (const parsedModule of parsed.modules) {
    const moduleInput: CreateModuleInput = {
      name: parsedModule.name,
      description: parsedModule.description,
      type: parsedModule.type,
    };

    const module = createModule(moduleInput);
    result.created.modules.push(module.id);

    // Create features for this module
    for (const parsedFeature of parsedModule.features) {
      const featureInput: CreateFeatureInput = {
        name: parsedFeature.name,
        description: parsedFeature.description,
        moduleId: module.id,
        priority: parsedFeature.priority,
        prd: parsedFeature.prd || {
          problemStatement: parsedFeature.description,
          goals: [],
          successMetrics: [],
          scope: { inScope: [] },
        },
      };

      const feature = createFeature(featureInput);
      result.created.features.push(feature.id);

      // Create issues for this feature
      for (const parsedIssue of parsedFeature.issues) {
        const issueInput: CreateIssueInput = {
          type: parsedIssue.type,
          title: parsedIssue.title,
          featureId: feature.id,
          description: parsedIssue.description,
          priority: parsedIssue.priority,
          acceptanceCriteria: parsedIssue.acceptanceCriteria,
          ...(parsedIssue.type === 'spike' && {
            timebox: { duration: 3, unit: 'days' as const },
          }),
        };

        const issue = createIssue(issueInput);
        result.created.issues.push(issue.id);
      }
    }
  }

  return result;
}

/**
 * Main parse and import function
 */
export function parseAndImport(
  text: string,
  options?: CreateFromParseOptions
): CreateFromParseResult {
  const parsed = parseText(text);
  return createFromParsed(parsed, options);
}
