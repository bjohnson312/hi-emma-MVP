import { api } from "encore.dev/api";
import type { ConversationStartRequest, ConversationStartResponse } from "./types";
import db from "../db";

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

function createGreeting(userName: string, timeOfDay: string, sessionType: string): string {
  const timeGreetings: Record<string, string> = {
    morning: "Good morning",
    afternoon: "Good afternoon",
    evening: "Good evening",
    night: "Good evening",
  };
  
  const greeting = timeGreetings[timeOfDay] || "Hello";
  
  if (sessionType === "morning") {
    return `${greeting}, ${userName}! How did you sleep? Let's get your day started right.`;
  }
  
  return `${greeting}, ${userName}! What's on your mind?`;
}

export const conversationStart = api(
  { method: "POST", path: "/api/v2/conversations/start", expose: true },
  async (req: ConversationStartRequest): Promise<ConversationStartResponse> => {
    let userName = "User";
    let timezone = "America/New_York";

    const profile = await db.queryRow<{
      user_id: string;
      name: string;
      timezone: string | null;
    }>`
      SELECT user_id, name, timezone FROM user_profiles WHERE user_id = ${req.userId}
    `;

    if (profile) {
      userName = profile.name;
      timezone = profile.timezone || "America/New_York";
    } else {
      await db.exec`
        INSERT INTO user_profiles (user_id, name, timezone) VALUES (${req.userId}, ${userName}, ${timezone})
        ON CONFLICT (user_id) DO NOTHING
      `;
    }

    const timeOfDay = getTimeOfDay();

    const newSession = await db.queryRow<{ id: number }>`
      INSERT INTO conversation_sessions (user_id, session_type, started_at, last_activity_at, completed, conversation_date)
      VALUES (${req.userId}, ${req.sessionType}, NOW(), NOW(), false, CURRENT_DATE)
      RETURNING id
    `;

    if (!newSession) {
      throw new Error("Failed to create session");
    }

    const sessionId = newSession.id.toString();

    const greeting = createGreeting(userName, timeOfDay, req.sessionType);

    await db.exec`
      INSERT INTO conversation_history (user_id, conversation_type, emma_response, context)
      VALUES (${req.userId}, ${req.sessionType}, ${greeting}, ${JSON.stringify({ sessionId, timeOfDay, isGreeting: true })})
    `;

    return {
      sessionId,
      greeting,
      timeOfDay,
    };
  }
);
