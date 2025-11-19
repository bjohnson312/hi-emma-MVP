import { api } from "encore.dev/api";
import type { ConversationStartRequest, ConversationStartResponse } from "./types";
import db from "../db";
import { determineTimeOfDay, shouldSuggestRoutine, generateContextualGreeting, type UserContext, type RoutineSuggestion } from "../../api_v2/business/routine";

async function loadUserContext(userId: string): Promise<UserContext> {
  const profile = await db.queryRow<{
    user_id: string;
    name: string;
    timezone: string | null;
  }>`
    SELECT user_id, name, timezone FROM user_profiles WHERE user_id = ${userId}
  `;

  const name = profile?.name || "User";
  const timezone = profile?.timezone || "America/New_York";
  
  const currentTime = new Date();
  const timeOfDay = determineTimeOfDay(currentTime, timezone);

  const streakResult = await db.queryRow<{ current_streak: number }>`
    SELECT COALESCE(
      (SELECT COUNT(DISTINCT DATE(created_at))
       FROM morning_routine_logs
       WHERE user_id = ${userId}
       AND created_at >= CURRENT_DATE - INTERVAL '7 days'), 0
    ) as current_streak
  `;
  
  return {
    userId,
    name,
    timezone,
    timeOfDay,
    streak: streakResult?.current_streak || 0
  };
}

async function checkRoutineSuggestion(
  userId: string,
  sessionType: string,
  userContext: UserContext
): Promise<RoutineSuggestion> {
  if (sessionType !== 'morning' && sessionType !== 'evening') {
    return { state: 'none', suggestion: null };
  }

  const completedToday = await db.queryRow<{ completed: boolean }>`
    SELECT EXISTS (
      SELECT 1 FROM morning_routine_logs
      WHERE user_id = ${userId}
      AND DATE(created_at) = CURRENT_DATE
      AND completed = true
    ) as completed
  `;

  const preferences = await db.queryRow<{
    wake_time: string | null;
  }>`
    SELECT wake_time FROM morning_routine_preferences WHERE user_id = ${userId}
  `;

  const suggestionResult = shouldSuggestRoutine({
    routineType: sessionType as 'morning' | 'evening',
    currentTime: new Date(),
    timezone: userContext.timezone,
    userPreferences: {
      morningRoutineTime: preferences?.wake_time || '07:00',
      eveningRoutineTime: '20:00'
    },
    completedToday: completedToday?.completed || false
  });

  if (suggestionResult.shouldSuggest) {
    return {
      state: 'suggest',
      suggestion: {
        type: sessionType,
        estimatedDuration: '10 minutes',
        activities: sessionType === 'morning' 
          ? ['Stretch', 'Gratitude', 'Plan your day']
          : ['Reflect', 'Wind down', 'Prepare for tomorrow']
      }
    };
  }

  if (completedToday?.completed) {
    return { state: 'completed', suggestion: null };
  }

  return { state: 'none', suggestion: null };
}

export const conversationStart = api(
  { method: "POST", path: "/api/v2/conversations/start", expose: true },
  async (req: ConversationStartRequest): Promise<ConversationStartResponse> => {
    
    const userContext = await loadUserContext(req.userId);
    
    const routineState = await checkRoutineSuggestion(
      req.userId,
      req.sessionType,
      userContext
    );
    
    const greeting = await generateContextualGreeting(
      userContext,
      req.sessionType as any,
      req.isFirstCheckIn,
      routineState
    );
    
    const newSession = await db.queryRow<{ id: number }>`
      INSERT INTO conversation_sessions (user_id, session_type, started_at, last_activity_at, completed, conversation_date)
      VALUES (${req.userId}, ${req.sessionType}, NOW(), NOW(), false, CURRENT_DATE)
      RETURNING id
    `;

    if (!newSession) {
      throw new Error("Failed to create session");
    }

    const sessionId = newSession.id.toString();

    await db.exec`
      INSERT INTO conversation_history (user_id, conversation_type, emma_response, context)
      VALUES (${req.userId}, ${req.sessionType}, ${greeting}, ${JSON.stringify({ 
        sessionId, 
        timeOfDay: userContext.timeOfDay, 
        isGreeting: true,
        routineState: routineState.state
      })})
    `;

    return {
      sessionId,
      greeting,
      timeOfDay: userContext.timeOfDay,
      context: {
        routineState: routineState.state,
        streak: userContext.streak,
        suggestedRoutine: routineState.suggestion || undefined
      }
    };
  }
);
