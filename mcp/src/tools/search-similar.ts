/**
 * Semantic Feature Search Tool
 *
 * Finds features with similar problem statements or scope using:
 * - Text similarity analysis
 * - Keyword matching
 * - Scope overlap detection
 * - Capability tag matching
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface FeatureContract {
  id: string;
  name: string;
  description: string;
  moduleId: string;
  capabilityTags?: string[];
  targetUsers?: string[];
  prd: {
    problemStatement: string;
    goals: string[];
    scope: {
      inScope: string[];
      outOfScope: string[];
    };
  };
}

interface SimilarityResult {
  featureId: string;
  featureName: string;
  moduleId: string;
  similarityScore: number;
  matchReasons: string[];
  matchDetails: {
    problemStatementScore?: number;
    scopeOverlap?: string[];
    tagOverlap?: string[];
    goalSimilarity?: string[];
  };
}

interface SearchInput {
  problemStatement?: string;
  scopeItems?: string[];
  capabilityTags?: string[];
  goals?: string[];
  threshold?: number;  // 0-1 similarity threshold
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): Set<string> {
  // Remove common stop words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
    'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
    'these', 'those', 'it', 'its', 'they', 'their', 'them', 'we', 'our',
    'us', 'you', 'your', 'i', 'my', 'me'
  ]);

  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w));

  return new Set(words);
}

/**
 * Calculate Jaccard similarity between two sets
 */
function jaccardSimilarity<T>(set1: Set<T>, set2: Set<T>): number {
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Calculate TF-IDF weighted similarity
 */
function calculateTextSimilarity(text1: string, text2: string, allTexts: string[]): number {
  const keywords1 = extractKeywords(text1);
  const keywords2 = extractKeywords(text2);

  // Simple word overlap for now
  const overlap = jaccardSimilarity(keywords1, keywords2);

  // Boost score if there are significant multi-word phrases in common
  const phrases1 = text1.toLowerCase().match(/\b\w+\s+\w+\s+\w+\b/g) || [];
  const phrases2 = text2.toLowerCase().match(/\b\w+\s+\w+\s+\w+\b/g) || [];

  let phraseBoost = 0;
  for (const phrase1 of phrases1) {
    if (phrases2.some(phrase2 => phrase2.includes(phrase1) || phrase1.includes(phrase2))) {
      phraseBoost += 0.1;
    }
  }

  return Math.min(overlap + phraseBoost, 1.0);
}

/**
 * Find scope overlap
 */
function findScopeOverlap(scopeItems1: string[], scopeItems2: string[]): string[] {
  const overlap: string[] = [];

  for (const item1 of scopeItems1) {
    for (const item2 of scopeItems2) {
      const similarity = jaccardSimilarity(
        extractKeywords(item1),
        extractKeywords(item2)
      );

      if (similarity > 0.5) {
        overlap.push(`"${item1}" ≈ "${item2}"`);
      }
    }
  }

  return overlap;
}

/**
 * Find similar goals
 */
function findSimilarGoals(goals1: string[], goals2: string[]): string[] {
  const similar: string[] = [];

  for (const goal1 of goals1) {
    for (const goal2 of goals2) {
      const similarity = jaccardSimilarity(
        extractKeywords(goal1),
        extractKeywords(goal2)
      );

      if (similarity > 0.4) {
        similar.push(`"${goal1}" ≈ "${goal2}"`);
      }
    }
  }

  return similar;
}

/**
 * Main similarity search function
 */
export async function searchSimilarFeatures(
  input: SearchInput,
  featuresDir: string
): Promise<SimilarityResult[]> {
  const results: SimilarityResult[] = [];
  const threshold = input.threshold || 0.3;

  // Read all existing features
  const files = await fs.readdir(featuresDir);
  const featureFiles = files.filter(f => f.endsWith('.json') && f.startsWith('FEAT-'));

  const allFeatures: FeatureContract[] = [];
  for (const file of featureFiles) {
    const filePath = path.join(featuresDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    allFeatures.push(JSON.parse(content));
  }

  // Extract all problem statements for TF-IDF context
  const allProblemStatements = allFeatures.map(f => f.prd.problemStatement);

  for (const feature of allFeatures) {
    const matchReasons: string[] = [];
    const matchDetails: SimilarityResult['matchDetails'] = {};
    let totalScore = 0;
    let scoreComponents = 0;

    // 1. Problem statement similarity
    if (input.problemStatement) {
      const problemScore = calculateTextSimilarity(
        input.problemStatement,
        feature.prd.problemStatement,
        allProblemStatements
      );

      if (problemScore > 0.2) {
        matchDetails.problemStatementScore = Math.round(problemScore * 100);
        matchReasons.push(`${Math.round(problemScore * 100)}% problem statement match`);
        totalScore += problemScore;
        scoreComponents++;
      }
    }

    // 2. Scope overlap
    if (input.scopeItems && input.scopeItems.length > 0) {
      const scopeOverlap = findScopeOverlap(
        input.scopeItems,
        feature.prd.scope.inScope
      );

      if (scopeOverlap.length > 0) {
        matchDetails.scopeOverlap = scopeOverlap;
        matchReasons.push(`${scopeOverlap.length} scope item(s) overlap`);
        const scopeScore = Math.min(scopeOverlap.length / input.scopeItems.length, 1.0);
        totalScore += scopeScore;
        scoreComponents++;
      }
    }

    // 3. Capability tag overlap
    if (input.capabilityTags && input.capabilityTags.length > 0 && feature.capabilityTags) {
      const tagOverlap = input.capabilityTags.filter(tag =>
        feature.capabilityTags!.includes(tag)
      );

      if (tagOverlap.length > 0) {
        matchDetails.tagOverlap = tagOverlap;
        matchReasons.push(`${tagOverlap.length} capability tag(s) match: ${tagOverlap.join(', ')}`);
        const tagScore = tagOverlap.length / input.capabilityTags.length;
        totalScore += tagScore;
        scoreComponents++;
      }
    }

    // 4. Goal similarity
    if (input.goals && input.goals.length > 0) {
      const similarGoals = findSimilarGoals(input.goals, feature.prd.goals);

      if (similarGoals.length > 0) {
        matchDetails.goalSimilarity = similarGoals;
        matchReasons.push(`${similarGoals.length} similar goal(s)`);
        const goalScore = Math.min(similarGoals.length / input.goals.length, 1.0);
        totalScore += goalScore;
        scoreComponents++;
      }
    }

    // Calculate average similarity score
    const similarityScore = scoreComponents > 0 ? totalScore / scoreComponents : 0;

    // Only include if above threshold and has matches
    if (similarityScore >= threshold && matchReasons.length > 0) {
      results.push({
        featureId: feature.id,
        featureName: feature.name,
        moduleId: feature.moduleId,
        similarityScore: Math.round(similarityScore * 100) / 100,
        matchReasons,
        matchDetails
      });
    }
  }

  // Sort by similarity score (highest first)
  results.sort((a, b) => b.similarityScore - a.similarityScore);

  return results;
}

/**
 * Quick keyword search across all features
 */
export async function quickKeywordSearch(
  keywords: string[],
  featuresDir: string
): Promise<Array<{ featureId: string; featureName: string; matches: string[] }>> {
  const results: Array<{ featureId: string; featureName: string; matches: string[] }> = [];

  const files = await fs.readdir(featuresDir);
  const featureFiles = files.filter(f => f.endsWith('.json') && f.startsWith('FEAT-'));

  for (const file of featureFiles) {
    const filePath = path.join(featuresDir, file);
    const content = await fs.readFile(filePath, 'utf-8');
    const feature: FeatureContract = JSON.parse(content);

    const matches: string[] = [];
    const searchText = `
      ${feature.name}
      ${feature.description}
      ${feature.prd.problemStatement}
      ${feature.prd.goals.join(' ')}
      ${feature.prd.scope.inScope.join(' ')}
    `.toLowerCase();

    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        matches.push(keyword);
      }
    }

    if (matches.length > 0) {
      results.push({
        featureId: feature.id,
        featureName: feature.name,
        matches
      });
    }
  }

  return results;
}

/**
 * Format similarity search results
 */
export function formatSimilarityResults(
  results: SimilarityResult[],
  showDetails: boolean = true
): string {
  if (results.length === 0) {
    return '✅ No similar features found. This appears to be a unique capability.';
  }

  let output = `Found ${results.length} similar feature(s):\n\n`;

  for (const result of results) {
    const scoreBar = '█'.repeat(Math.round(result.similarityScore * 10));
    output += `${result.featureId} - ${result.featureName}\n`;
    output += `Module: ${result.moduleId}\n`;
    output += `Similarity: ${scoreBar} ${Math.round(result.similarityScore * 100)}%\n`;
    output += '\nMatch Reasons:\n';
    output += result.matchReasons.map(r => `  • ${r}`).join('\n');

    if (showDetails) {
      output += '\n\nDetails:\n';

      if (result.matchDetails.problemStatementScore !== undefined) {
        output += `  Problem Statement: ${result.matchDetails.problemStatementScore}% match\n`;
      }

      if (result.matchDetails.scopeOverlap && result.matchDetails.scopeOverlap.length > 0) {
        output += `  Scope Overlap:\n`;
        output += result.matchDetails.scopeOverlap.map(s => `    - ${s}`).join('\n') + '\n';
      }

      if (result.matchDetails.tagOverlap && result.matchDetails.tagOverlap.length > 0) {
        output += `  Tags: ${result.matchDetails.tagOverlap.join(', ')}\n`;
      }

      if (result.matchDetails.goalSimilarity && result.matchDetails.goalSimilarity.length > 0) {
        output += `  Similar Goals:\n`;
        output += result.matchDetails.goalSimilarity.map(g => `    - ${g}`).join('\n') + '\n';
      }
    }

    output += '\n' + '-'.repeat(60) + '\n\n';
  }

  output += '\n💡 Recommendation: Review these features to determine if:\n';
  output += '  1. Your feature should extend one of these instead\n';
  output += '  2. You need to define clear differentiation in scope\n';
  output += '  3. A relatedFeatures relationship should be established\n';

  return output;
}
