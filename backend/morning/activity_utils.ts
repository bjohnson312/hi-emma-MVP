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
