import { api } from "encore.dev/api";
import type { ConversationStartRequest, ConversationStartResponse } from "./types";
import db from "../db";
import { determineTimeOfDay, shouldSuggestRoutine, generateContextualGreeting, type UserContext, type RoutineSuggestion } from "../../api_v2/business/routine";

async function loadUserContext(userId: string): Promise<UserContext> {
  try {
    console.log("loadUserContext: Starting for userId:", userId);
    
    const profile = await db.queryRow<{
      user_id: string;
      name: string;
      timezone: string | null;
    }>`
      SELECT user_id, name, timezone FROM user_profiles WHERE user_id = ${userId}
    `;
    console.log("loadUserContext: Profile result:", profile);

    const name = profile?.name || "User";
    const timezone = profile?.timezone || "America/New_York";
    
    const currentTime = new Date();
    console.log("loadUserContext: Determining time of day for timezone:", timezone);
    const timeOfDay = determineTimeOfDay(currentTime, timezone);
    console.log("loadUserContext: Time of day:", timeOfDay);

    console.log("loadUserContext: Fetching streak for userId:", userId);
    const streakResult = await db.queryRow<{ current_streak: number }>`
      SELECT COALESCE(
        (SELECT COUNT(DISTINCT DATE(created_at))
         FROM morning_routine_logs
         WHERE user_id = ${userId}
         AND created_at >= CURRENT_DATE - INTERVAL '7 days'), 0
      ) as current_streak
    `;
    console.log("loadUserContext: Streak result:", streakResult);
    
    const userContext = {
      userId,
      name,
      timezone,
      timeOfDay,
      streak: streakResult?.current_streak || 0
    };
    console.log("loadUserContext: Final context:", userContext);
    
    return userContext;
  } catch (error) {
    console.error("ERROR IN loadUserContext:", error);
    throw error;
  }
}

async function checkRoutineSuggestion(
  userId: string,
  sessionType: string,
  userContext: UserContext
): Promise<RoutineSuggestion> {
  try {
    console.log("checkRoutineSuggestion: Starting for userId:", userId, "sessionType:", sessionType);
    
    if (sessionType !== 'morning' && sessionType !== 'evening') {
      console.log("checkRoutineSuggestion: Session type not morning/evening, returning none");
      return { state: 'none', suggestion: null };
    }

    console.log("checkRoutineSuggestion: Checking if completed today");
    const completedToday = await db.queryRow<{ completed: boolean }>`
      SELECT EXISTS (
        SELECT 1 FROM morning_routine_logs
        WHERE user_id = ${userId}
        AND DATE(created_at) = CURRENT_DATE
        AND completed = true
      ) as completed
    `;
    console.log("checkRoutineSuggestion: Completed today result:", completedToday);

    console.log("checkRoutineSuggestion: Fetching preferences");
    const preferences = await db.queryRow<{
      wake_time: string | null;
    }>`
      SELECT wake_time FROM morning_routine_preferences WHERE user_id = ${userId}
    `;
    console.log("checkRoutineSuggestion: Preferences result:", preferences);

    console.log("checkRoutineSuggestion: Calling shouldSuggestRoutine");
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
    console.log("checkRoutineSuggestion: Suggestion result:", suggestionResult);

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
    console.error("ERROR IN checkRoutineSuggestion:", error);
    throw error;
  }
}

export const conversationStart = api(
  { method: "POST", path: "/api/v2/conversations/start", expose: true, auth: false },
  async (req: ConversationStartRequest): Promise<ConversationStartResponse> => {
    try {
      console.log("=== conversationStart: Request received ===");
      console.log("Request:", JSON.stringify(req, null, 2));
      
      console.log("conversationStart: Loading user context");
      const userContext = await loadUserContext(req.userId);
      console.log("conversationStart: User context loaded");
      
      console.log("conversationStart: Checking routine suggestion");
      const routineState = await checkRoutineSuggestion(
        req.userId,
        req.sessionType,
        userContext
      );
      console.log("conversationStart: Routine state:", routineState);
      
      console.log("conversationStart: Generating greeting");
      const greeting = await generateContextualGreeting(
        userContext,
        req.sessionType as any,
        req.isFirstCheckIn,
        routineState
      );
      console.log("conversationStart: Greeting generated:", greeting);
      
      console.log("conversationStart: Creating session in DB");
      const newSession = await db.queryRow<{ id: number }>`
        INSERT INTO conversation_sessions (user_id, session_type, started_at, last_activity_at, completed, conversation_date)
        VALUES (${req.userId}, ${req.sessionType}, NOW(), NOW(), false, CURRENT_DATE)
        RETURNING id
      `;
      console.log("conversationStart: Session created:", newSession);

      if (!newSession) {
        throw new Error("Failed to create session");
      }

      const sessionId = newSession.id.toString();

      console.log("conversationStart: Inserting conversation history");
      await db.exec`
        INSERT INTO conversation_history (user_id, conversation_type, emma_response, context)
        VALUES (${req.userId}, ${req.sessionType}, ${greeting}, ${JSON.stringify({ 
          sessionId, 
          timeOfDay: userContext.timeOfDay, 
          isGreeting: true,
          routineState: routineState.state
        })})
      `;
      console.log("conversationStart: Conversation history inserted");

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
      console.log("conversationStart: Response:", JSON.stringify(response, null, 2));
      console.log("=== conversationStart: Completed successfully ===");
      
      return response;
    } catch (error) {
      console.error("=== ERROR IN conversationStart ===");
      console.error("Error details:", error);
      console.error("Error stack:", (error as Error).stack);
      console.error("Request that failed:", JSON.stringify(req, null, 2));
      throw error;
    }
  }
);
