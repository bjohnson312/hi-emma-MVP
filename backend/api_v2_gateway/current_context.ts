import { api } from "encore.dev/api";
import type { CurrentContextRequest, CurrentContextResponse } from "./types";
import db from "../db";
import {
  determineTimeOfDay,
  generateGreeting,
  shouldSuggestRoutine,
} from "../../api_v2/business/routine";

export const currentContext = api(
  { method: "GET", path: "/api/v2/user/current-context", expose: true },
  async (req: CurrentContextRequest): Promise<CurrentContextResponse> => {
    const profileResult = await db.query<{
      user_id: string;
      name: string;
      timezone: string | null;
      wake_time: string | null;
    }>(
      `SELECT user_id, name, timezone, wake_time FROM user_profiles WHERE user_id = $1`,
      [req.userId]
    );

    let userName = "User";
    let timezone = "America/New_York";
    let wakeTime = "07:00";

    if (profileResult.length > 0) {
      userName = profileResult[0].name;
      timezone = profileResult[0].timezone || "America/New_York";
      wakeTime = profileResult[0].wake_time || "07:00";
    } else {
      await db.query(
        `INSERT INTO user_profiles (user_id, name, timezone) VALUES ($1, $2, $3)
         ON CONFLICT (user_id) DO NOTHING`,
        [req.userId, userName, timezone]
      );
    }

    const streakResult = await db.query<{ count: number }>(
      `SELECT COUNT(DISTINCT DATE(completed_at)) as count
       FROM morning_routine_completions
       WHERE user_id = $1
       ORDER BY completed_at DESC
       LIMIT 365`,
      [req.userId]
    );
    const currentStreak = streakResult[0]?.count || 0;

    const currentTime = new Date();
    const timeOfDay = determineTimeOfDay(currentTime, timezone);

    const greeting = generateGreeting({
      userName,
      timeOfDay,
      sessionType: "general",
      isFirstCheckIn: true,
      userContext: {
        currentStreak,
      },
    });

    const suggestions: CurrentContextResponse["suggestions"] = [];

    const completedTodayResult = await db.query<{ count: number }>(
      `SELECT COUNT(*) as count FROM morning_routine_completions
       WHERE user_id = $1 AND DATE(completed_at) = CURRENT_DATE`,
      [req.userId]
    );
    const completedToday = (completedTodayResult[0]?.count || 0) > 0;

    const morningCheck = shouldSuggestRoutine({
      routineType: "morning",
      currentTime,
      timezone,
      userPreferences: {
        morningRoutineTime: wakeTime,
      },
      completedToday,
    });

    if (morningCheck.shouldSuggest && morningCheck.priority !== "low") {
      suggestions.push({
        type: "start_morning_routine",
        priority: morningCheck.priority,
        reason: morningCheck.reason,
        action: {
          route: "/morning-routine",
          label: "Start Morning Routine",
          params: { type: "morning" },
        },
      });
    }

    const activeSessionResult = await db.query<{
      id: string;
      session_type: string;
      last_activity_at: Date;
      message_count: number;
    }>(
      `SELECT cs.id, cs.session_type, cs.last_activity_at,
              (SELECT COUNT(*) FROM conversation_history ch 
               WHERE ch.context->>'sessionId' = cs.id::text) as message_count
       FROM conversation_sessions cs
       WHERE cs.user_id = $1
         AND cs.completed = false
         AND cs.last_activity_at > NOW() - INTERVAL '6 hours'
       ORDER BY cs.last_activity_at DESC
       LIMIT 1`,
      [req.userId]
    );

    let activeSession = null;
    if (activeSessionResult.length > 0) {
      const session = activeSessionResult[0];
      activeSession = {
        id: session.id,
        type: session.session_type,
        canResume: true,
        lastMessageAt: session.last_activity_at.toISOString(),
        messageCount: Number(session.message_count) || 0,
      };
    }

    return {
      greeting,
      timeOfDay,
      suggestions,
      activeSession,
    };
  }
);
