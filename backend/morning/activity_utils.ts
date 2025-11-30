import type { MorningRoutineActivity } from "./routine_types";

// Clarification timeout: 10 minutes
export const PENDING_CLARIFICATION_TIMEOUT_MS = 10 * 60 * 1000;

// Minimum score threshold for considering a match
const MIN_MATCH_SCORE = 40;

// Match confidence thresholds
const HIGH_CONFIDENCE_SCORE = 70;
const HIGH_CONFIDENCE_GAP = 20;
const MEDIUM_CONFIDENCE_SCORE = 50;
const AMBIGUOUS_GAP = 15;

type MatchType = 'exact' | 'startsWith' | 'contains' | 'tokenOverlap' | 'reverseContains';

export interface ActivityMatch {
  activity: MorningRoutineActivity;
  index: number;
  score: number;
  matchType: MatchType;
}

export type MatchConfidence = 'high' | 'medium' | 'low' | 'ambiguous';

export interface MatchResult {
  bestMatch: ActivityMatch | null;
  allCandidates: ActivityMatch[];
  confidence: MatchConfidence;
}

/**
 * Parse activities from JSONB data (handles both string and object formats)
 * 
 * The database sometimes returns JSONB as a parsed object, sometimes as a string.
 * This utility handles both cases consistently.
 * 
 * @param data - JSONB activities data from database
 * @returns Array of MorningRoutineActivity objects
 */
export function parseActivities(data: any): MorningRoutineActivity[] {
  if (Array.isArray(data)) {
    return data;
  }
  
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  
  return [];
}

/**
 * Calculate token overlap score between search term and activity name
 */
function calculateTokenOverlap(search: string, activityName: string): number {
  const searchTokens = search.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  const activityTokens = activityName.toLowerCase().split(/\s+/).filter(t => t.length > 0);
  
  if (searchTokens.length === 0 || activityTokens.length === 0) {
    return 0;
  }
  
  const matchingTokens = searchTokens.filter(st => 
    activityTokens.some(at => at.includes(st) || st.includes(at))
  );
  
  const overlapRatio = matchingTokens.length / Math.max(searchTokens.length, activityTokens.length);
  return 40 + (30 * overlapRatio);
}

/**
 * Score a single activity against a search term
 */
function scoreActivity(searchName: string, activity: MorningRoutineActivity, index: number): ActivityMatch | null {
  const search = searchName.toLowerCase().trim();
  const activityLower = activity.name.toLowerCase();
  
  // Exact match: 100 points
  if (activityLower === search) {
    return { activity, index, score: 100, matchType: 'exact' };
  }
  
  // Starts with: 80 points
  if (activityLower.startsWith(search)) {
    return { activity, index, score: 80, matchType: 'startsWith' };
  }
  
  // Contains: 60 points
  if (activityLower.includes(search)) {
    return { activity, index, score: 60, matchType: 'contains' };
  }
  
  // Reverse contains: 50 points
  if (search.includes(activityLower)) {
    return { activity, index, score: 50, matchType: 'reverseContains' };
  }
  
  // Token overlap: 40-70 points
  const tokenScore = calculateTokenOverlap(search, activity.name);
  if (tokenScore >= MIN_MATCH_SCORE) {
    return { activity, index, score: tokenScore, matchType: 'tokenOverlap' };
  }
  
  return null;
}

/**
 * Determine match confidence based on candidate scores
 */
function getMatchConfidence(matches: ActivityMatch[]): MatchResult {
  if (matches.length === 0) {
    return { bestMatch: null, allCandidates: [], confidence: 'low' };
  }
  
  const sorted = matches.sort((a, b) => b.score - a.score);
  const topScore = sorted[0].score;
  const secondScore = sorted[1]?.score ?? 0;
  
  // HIGH confidence: Exact match OR clear winner (70+ score with 20+ point gap)
  if (topScore === 100 || (topScore >= HIGH_CONFIDENCE_SCORE && topScore - secondScore >= HIGH_CONFIDENCE_GAP)) {
    return { 
      bestMatch: sorted[0], 
      allCandidates: sorted, 
      confidence: 'high' 
    };
  }
  
  // AMBIGUOUS: Multiple candidates within 15 points of each other
  const topTier = sorted.filter(m => topScore - m.score <= AMBIGUOUS_GAP);
  if (topTier.length > 1) {
    return { 
      bestMatch: null, 
      allCandidates: topTier, 
      confidence: 'ambiguous' 
    };
  }
  
  // MEDIUM: Single winner with score >= 50 (but not meeting "high" criteria)
  if (topScore >= MEDIUM_CONFIDENCE_SCORE) {
    return { 
      bestMatch: sorted[0], 
      allCandidates: sorted, 
      confidence: 'medium' 
    };
  }
  
  // LOW: Weak match (below 50)
  return { 
    bestMatch: null, 
    allCandidates: sorted, 
    confidence: 'low' 
  };
}

/**
 * Find all matching activities with confidence scoring
 * 
 * Scoring rules:
 * - Exact match: 100 points
 * - Starts with: 80 points
 * - Contains: 60 points
 * - Reverse contains: 50 points
 * - Token overlap: 40-70 points (based on % overlap)
 * - Minimum threshold: 40 points
 * 
 * Confidence levels:
 * - high: Exact match OR score ≥70 with 20+ point gap
 * - medium: Single winner with score ≥50
 * - ambiguous: Multiple candidates within 15 points
 * - low: No strong matches
 */
export function findActivityMatches(
  searchName: string,
  activities: MorningRoutineActivity[]
): MatchResult {
  const matches: ActivityMatch[] = [];
  
  for (let i = 0; i < activities.length; i++) {
    const match = scoreActivity(searchName, activities[i], i);
    if (match) {
      matches.push(match);
    }
  }
  
  return getMatchConfidence(matches);
}

/**
 * Find best matching activity by name (backward-compatible wrapper)
 * 
 * This is a wrapper around findActivityMatches() that returns the bestMatch
 * in the original format for backward compatibility with existing code.
 * 
 * @param searchName - Activity name to search for (from user input)
 * @param activities - Array of activities to search through
 * @returns Object with index and matched activity, or null if no match
 */
export function findBestMatch(
  searchName: string,
  activities: MorningRoutineActivity[]
): { index: number; match: MorningRoutineActivity } | null {
  const result = findActivityMatches(searchName, activities);
  
  if (result.bestMatch) {
    return { 
      index: result.bestMatch.index, 
      match: result.bestMatch.activity 
    };
  }
  
  return null;
}
