/**
 * Business Logic Module Index
 * 
 * Exports all business logic functions for use by services and routes.
 * 
 * ARCHITECTURE:
 * - All functions are PURE (no I/O, deterministic)
 * - Can be tested without mocking databases
 * - Shared between services for consistency
 * 
 * PHASE 1 MODULES:
 * - routine: Time-of-day, greeting, routine suggestion logic
 * - insights: Intent detection, entity extraction
 * - session: Session management, resumption logic
 * - milestones: Progress calculation (already existed)
 */

export * from './routine';
export * from './onboarding';
export * from './mood';
export * from './milestones';
export * from './insights'; // NEW in Phase 1
export * from './session'; // NEW in Phase 1

// Re-export commonly used types for convenience
export type {
  TimeOfDay,
  SessionType as RoutineSessionType,
  RoutineType,
} from './routine';

export type {
  IntentType,
  DetectedIntent,
} from './insights';

export type {
  SessionContext,
  SessionState,
} from './session';
