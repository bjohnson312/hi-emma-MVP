import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { ConversationStartRequest, ConversationStartResponse } from "./types";
import db from "../db";
import { determineTimeOfDay, shouldSuggestRoutine, generateContextualGreeting, type UserContext, type RoutineSuggestion } from "../../api_v2/business/routine";
import { addDevLog } from "../../api_v2/utils/devLogs";

async function loadUserContext(userId: string): Promise<UserContext> {
  try {
    addDevLog({ event: "loadUserContext_start", userId });
    
    const profile = await db.queryRow<{
      user_id: string;
      name: string;
      timezone: string | null;
    }>`
      SELECT user_id, name, timezone FROM user_profiles WHERE user_id = ${userId}
    `;
    addDevLog({ event: "loadUserContext_profile", profile });

    const name = profile?.name || "User";
    const timezone = profile?.timezone || "America/New_York";
    
    const currentTime = new Date();
    addDevLog({ event: "loadUserContext_determine_time_of_day", timezone });
    const timeOfDay = determineTimeOfDay(currentTime, timezone);
    addDevLog({ event: "loadUserContext_time_of_day", timeOfDay });

    addDevLog({ event: "loadUserContext_fetch_streak", userId });
    const streakResult = await db.queryRow<{ current_streak: number }>`
      SELECT COALESCE(
        (SELECT COUNT(DISTINCT completion_date)
         FROM morning_routine_completions
         WHERE user_id = ${userId}
         AND all_completed = true
         AND completion_date >= CURRENT_DATE - INTERVAL '7 days'), 0
      ) as current_streak
    `;
    addDevLog({ event: "loadUserContext_streak", streakResult });
    
    const userContext = {
      userId,
      name,
      timezone,
      timeOfDay,
      streak: streakResult?.current_streak || 0
    };
    addDevLog({ event: "loadUserContext_complete", userContext });
    
    return userContext;
  } catch (error) {
    addDevLog({ event: "loadUserContext_error", error: error instanceof Error ? error.toString() : String(error), stack: error instanceof Error ? error.stack : undefined });
    throw error;
  }
}

async function checkRoutineSuggestion(
  userId: string,
  sessionType: string,
  userContext: UserContext
): Promise<RoutineSuggestion> {
  try {
    addDevLog({ event: "checkRoutineSuggestion_start", userId, sessionType });
    
    if (sessionType !== 'morning' && sessionType !== 'evening') {
      addDevLog({ event: "checkRoutineSuggestion_not_routine_type" });
      return { state: 'none', suggestion: null };
    }

    addDevLog({ event: "checkRoutineSuggestion_check_completed_today" });
    const completedToday = await db.queryRow<{ completed: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM morning_routine_completions
        WHERE user_id = ${userId}
        AND completion_date = CURRENT_DATE
        AND all_completed = true
      ) as completed
    `;
    addDevLog({ event: "checkRoutineSuggestion_completed_today", completedToday });

    addDevLog({ event: "checkRoutineSuggestion_fetch_preferences" });
    const preferences = await db.queryRow<{
      wake_time: string | null;
    }>`
      SELECT wake_time FROM morning_routine_preferences WHERE user_id = ${userId}
    `;
    addDevLog({ event: "checkRoutineSuggestion_preferences", preferences });

    addDevLog({ event: "checkRoutineSuggestion_call_shouldSuggestRoutine" });
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
    addDevLog({ event: "checkRoutineSuggestion_suggestion_result", suggestionResult });

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
  } catch (error) {
    addDevLog({ event: "checkRoutineSuggestion_error", error: error instanceof Error ? error.toString() : String(error), stack: error instanceof Error ? error.stack : undefined });
    throw error;
  }
}

export const conversationStart = api(
  { method: "POST", path: "/api/v2/conversations/start", expose: true },
  async (req: ConversationStartRequest): Promise<ConversationStartResponse> => {
    try {
      addDevLog({ event: "conversation_start_request", req });
      
      const auth = getAuthData();
      if (!auth || auth.userID !== req.userId) {
        throw APIError.permissionDenied("Cannot access or modify another user's data");
      }
      
      addDevLog({ event: "conversation_start_load_user_context" });
      const userContext = await loadUserContext(req.userId);
      addDevLog({ event: "conversation_start_user_context_loaded" });
      
      addDevLog({ event: "conversation_start_check_routine_suggestion" });
      const routineState = await checkRoutineSuggestion(
        req.userId,
        req.sessionType,
        userContext
      );
      addDevLog({ event: "conversation_start_routine_state", routineState });
      
      addDevLog({ event: "conversation_start_generate_greeting" });
      const greeting = await generateContextualGreeting(
        userContext,
        req.sessionType as any,
        req.isFirstCheckIn,
        routineState
      );
      addDevLog({ event: "conversation_start_greeting_generated", greeting });
      
      addDevLog({ event: "conversation_start_create_session" });
      const newSession = await db.queryRow<{ id: number }>`
        INSERT INTO conversation_sessions (user_id, session_type, started_at, last_activity_at, completed, conversation_date)
        VALUES (${req.userId}, ${req.sessionType}, NOW(), NOW(), false, CURRENT_DATE)
        RETURNING id
      `;
      addDevLog({ event: "conversation_start_session_created", newSession });

      if (!newSession) {
        throw new Error("Failed to create session");
      }

      const sessionId = newSession.id.toString();

      addDevLog({ event: "conversation_start_insert_history" });
      await db.exec`
        INSERT INTO conversation_history (user_id, conversation_type, emma_response, context)
        VALUES (${req.userId}, ${req.sessionType}, ${greeting}, ${JSON.stringify({ 
          sessionId, 
          timeOfDay: userContext.timeOfDay, 
          isGreeting: true,
          routineState: routineState.state
        })})
      `;
      addDevLog({ event: "conversation_start_history_inserted" });

      const response = {
        sessionId,
        greeting,
        timeOfDay: userContext.timeOfDay,
        context: {
          routineState: routineState.state,
          streak: userContext.streak,
          suggestedRoutine: routineState.suggestion || undefined
        }
      };
      addDevLog({ event: "conversation_start_response", response });
      addDevLog({ event: "conversation_start_completed_successfully" });
      
      return response;
    } catch (error) {
      addDevLog({ event: "conversation_start_error", error: error instanceof Error ? error.toString() : String(error), stack: error instanceof Error ? error.stack : undefined, req });
      throw error;
    }
  }
);
