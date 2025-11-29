import type { MorningRoutineActivity } from "./routine_types";

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
 * Find best matching activity by name using fuzzy matching
 * 
 * Priority order:
 * 1. Exact match (case-insensitive)
 * 2. Activity name starts with search term
 * 3. Activity name contains search term
 * 4. Search term contains activity name (user says more than activity name)
 * 
 * @param searchName - Activity name to search for (from user input)
 * @param activities - Array of activities to search through
 * @returns Object with index and matched activity, or null if no match
 * 
 * @example
 * findBestMatch("walk", [{name: "Morning walk"}, {name: "Coffee"}])
 * // Returns: { index: 0, match: {name: "Morning walk"} }
 */
export function findBestMatch(
  searchName: string,
  activities: MorningRoutineActivity[]
): { index: number; match: MorningRoutineActivity } | null {
  const search = searchName.toLowerCase().trim();
  
  // Priority 1: Exact match (case-insensitive)
  for (let i = 0; i < activities.length; i++) {
    if (activities[i].name.toLowerCase() === search) {
      return { index: i, match: activities[i] };
    }
  }
  
  // Priority 2: Activity name starts with search
  for (let i = 0; i < activities.length; i++) {
    if (activities[i].name.toLowerCase().startsWith(search)) {
      return { index: i, match: activities[i] };
    }
  }
  
  // Priority 3: Activity name contains search
  for (let i = 0; i < activities.length; i++) {
    if (activities[i].name.toLowerCase().includes(search)) {
      return { index: i, match: activities[i] };
    }
  }
  
  // Priority 4: Search contains activity name (reverse match)
  // User might say "change my morning walk" when activity is just "walk"
  for (let i = 0; i < activities.length; i++) {
    if (search.includes(activities[i].name.toLowerCase())) {
      return { index: i, match: activities[i] };
    }
  }
  
  return null;
}
