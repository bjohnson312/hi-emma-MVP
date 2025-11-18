/**
 * Core business logic for conversation session management.
 * 
 * This module contains PURE FUNCTIONS (no I/O) for:
 * - Session state validation
 * - Session completion detection
 * - Context building
 * - Session recovery logic
 * 
 * All logic is deterministic (no database calls).
 * Service layer will call these functions with data from DB.
 */

import type { SessionType, TimeOfDay } from './routine';

export interface SessionContext {
  timeOfDay: TimeOfDay;
  routineType?: string;
  completedSteps?: string[];
  userPreferences?: Record<string, any>;
  detectedTopics?: string[];
  lastActivity?: string;
}

export interface SessionState {
  id: string;
  userId: string;
  type: SessionType;
  startedAt: string;
  lastMessageAt: string;
  messageCount: number;
  completed: boolean;
  context: SessionContext;
}

/**
 * Determines if a session can be resumed.
 * 
 * RULES:
 * - Can resume if started today and not completed
 * - Can resume if last message was within 6 hours
 * - Cannot resume if completed
 * - Cannot resume if started on different day
 * 
 * @param session - Session to check
 * @param currentTime - Current server time
 * @returns Whether session can be resumed
 */
export function canResumeSession(
  session: SessionState,
  currentTime: Date
): {
  canResume: boolean;
  reason: string;
} {
  // Already completed?
  if (session.completed) {
    return {
      canResume: false,
      reason: 'Session already completed',
    };
  }
  
  const sessionDate = new Date(session.startedAt);
  const currentDate = currentTime;
  
  // Different day?
  const isSameDay = 
    sessionDate.getUTCFullYear() === currentDate.getUTCFullYear() &&
    sessionDate.getUTCMonth() === currentDate.getUTCMonth() &&
    sessionDate.getUTCDate() === currentDate.getUTCDate();
  
  if (!isSameDay) {
    return {
      canResume: false,
      reason: 'Session started on different day',
    };
  }
  
  // Too much time passed?
  const lastMessage = new Date(session.lastMessageAt);
  const hoursSinceLastMessage = 
    (currentTime.getTime() - lastMessage.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceLastMessage > 6) {
    return {
      canResume: false,
      reason: 'Session inactive for over 6 hours',
    };
  }
  
  // Can resume!
  return {
    canResume: true,
    reason: `Session active - last message ${Math.floor(hoursSinceLastMessage)}h ago`,
  };
}

/**
 * Determines if a session should be auto-completed.
 * 
 * RULES:
 * - Morning/evening routines: complete after 20+ messages
 * - Mood sessions: complete after 10+ messages
 * - General conversations: never auto-complete
 * 
 * @param session - Session to check
 * @returns Whether to auto-complete
 */
export function shouldAutoCompleteSession(session: SessionState): {
  shouldComplete: boolean;
  reason?: string;
} {
  const messageThresholds: Record<SessionType, number | null> = {
    morning: 20,
    evening: 20,
    mood: 10,
    nutrition: null, // Don't auto-complete
    diet: null,
    doctors_orders: null,
    general: null,
  };
  
  const threshold = messageThresholds[session.type];
  
  if (threshold === null) {
    return { shouldComplete: false };
  }
  
  if (session.messageCount >= threshold) {
    return {
      shouldComplete: true,
      reason: `Reached ${session.messageCount} messages (threshold: ${threshold})`,
    };
  }
  
  return { shouldComplete: false };
}

/**
 * Builds session context for conversation provider.
 * 
 * Combines session state with current time/preferences to provide
 * rich context for conversation generation.
 * 
 * @param session - Current session
 * @param timeOfDay - Current time of day
 * @param userPreferences - User's preferences
 * @returns Enriched context object
 */
export function buildSessionContext(
  session: SessionState,
  timeOfDay: TimeOfDay,
  userPreferences?: Record<string, any>
): SessionContext {
  return {
    timeOfDay,
    routineType: session.type === 'morning' || session.type === 'evening' 
      ? session.type 
      : undefined,
    completedSteps: session.context.completedSteps || [],
    userPreferences: userPreferences || {},
    detectedTopics: session.context.detectedTopics || [],
    lastActivity: session.context.lastActivity,
  };
}

/**
 * Determines which session type to use based on context.
 * 
 * LOGIC: If user hasn't specified, suggest based on time of day.
 * 
 * @param requestedType - User-requested type (or undefined)
 * @param timeOfDay - Current time of day
 * @returns Session type to use
 */
export function determineSessionType(
  requestedType: SessionType | undefined,
  timeOfDay: TimeOfDay
): SessionType {
  // User specified? Use that
  if (requestedType) {
    return requestedType;
  }
  
  // Auto-suggest based on time
  const timeSuggestions: Record<TimeOfDay, SessionType> = {
    morning: 'morning',
    afternoon: 'general',
    evening: 'evening',
    night: 'general',
  };
  
  return timeSuggestions[timeOfDay];
}

/**
 * Validates session state transitions.
 * 
 * Ensures session state changes are valid (e.g., can't un-complete)
 * 
 * @param currentState - Current session state
 * @param newState - Proposed new state
 * @returns Validation result
 */
export function validateSessionTransition(
  currentState: SessionState,
  newState: Partial<SessionState>
): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Can't un-complete a session
  if (currentState.completed && newState.completed === false) {
    errors.push('Cannot mark completed session as incomplete');
  }
  
  // Can't change session type
  if (newState.type && newState.type !== currentState.type) {
    errors.push('Cannot change session type after creation');
  }
  
  // Can't change user ID
  if (newState.userId && newState.userId !== currentState.userId) {
    errors.push('Cannot change session user');
  }
  
  // Message count must increase
  if (newState.messageCount !== undefined && newState.messageCount < currentState.messageCount) {
    errors.push('Message count cannot decrease');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates session summary text.
 * 
 * Creates human-readable summary of what happened in session.
 * 
 * @param session - Session to summarize
 * @returns Summary text
 */
export function generateSessionSummary(session: SessionState): string {
  const duration = calculateSessionDuration(session);
  const durationText = formatDuration(duration);
  
  const summaries: Record<SessionType, string> = {
    morning: `Morning routine completed in ${durationText}. You had ${session.messageCount} exchanges with Emma.`,
    evening: `Evening reflection completed in ${durationText}. You had ${session.messageCount} exchanges with Emma.`,
    mood: `Mood check-in completed in ${durationText}. You shared ${session.messageCount} messages.`,
    nutrition: `Nutrition discussion lasted ${durationText} with ${session.messageCount} messages.`,
    diet: `Diet tracking session lasted ${durationText} with ${session.messageCount} messages.`,
    doctors_orders: `Health check-in completed in ${durationText}.`,
    general: `Conversation lasted ${durationText} with ${session.messageCount} messages.`,
  };
  
  return summaries[session.type] || summaries.general;
}

/**
 * Calculates session duration in minutes.
 * 
 * @param session - Session to calculate
 * @returns Duration in minutes
 */
function calculateSessionDuration(session: SessionState): number {
  const start = new Date(session.startedAt);
  const end = new Date(session.lastMessageAt);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60));
}

/**
 * Formats duration for display.
 * 
 * @param minutes - Duration in minutes
 * @returns Formatted string
 */
function formatDuration(minutes: number): string {
  if (minutes < 1) return 'less than a minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return hours === 1 ? '1 hour' : `${hours} hours`;
  }
  
  return `${hours}h ${mins}m`;
}

/**
 * Checks if user should be warned about session state.
 * 
 * EDGE CASE: User has incomplete session from earlier, starts new one.
 * Should we warn them?
 * 
 * @param existingSessions - User's existing sessions for today
 * @param requestedType - Type of new session they want to start
 * @returns Warning if applicable
 */
export function checkSessionWarnings(
  existingSessions: SessionState[],
  requestedType: SessionType
): {
  hasWarning: boolean;
  warning?: string;
  conflictingSession?: SessionState;
} {
  // Find incomplete session of same type today
  const incompleteSession = existingSessions.find(
    s => s.type === requestedType && !s.completed
  );
  
  if (incompleteSession) {
    return {
      hasWarning: true,
      warning: `You have an incomplete ${requestedType} session from earlier. Would you like to resume it or start fresh?`,
      conflictingSession: incompleteSession,
    };
  }
  
  // Find completed session of same type today
  const completedSession = existingSessions.find(
    s => s.type === requestedType && s.completed
  );
  
  if (completedSession && (requestedType === 'morning' || requestedType === 'evening')) {
    return {
      hasWarning: true,
      warning: `You've already completed your ${requestedType} routine today! Starting another session.`,
      conflictingSession: completedSession,
    };
  }
  
  return { hasWarning: false };
}

/**
 * Extracts key topics from session context.
 * 
 * Used for session recovery to remind user what they were discussing.
 * 
 * @param context - Session context
 * @returns Array of topic strings
 */
export function extractSessionTopics(context: SessionContext): string[] {
  const topics: string[] = [];
  
  if (context.detectedTopics) {
    topics.push(...context.detectedTopics);
  }
  
  if (context.lastActivity) {
    topics.push(`Last discussed: ${context.lastActivity}`);
  }
  
  if (context.completedSteps && context.completedSteps.length > 0) {
    topics.push(`Completed ${context.completedSteps.length} steps`);
  }
  
  return topics;
}
