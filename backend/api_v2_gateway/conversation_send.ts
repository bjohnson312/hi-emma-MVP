import { api } from "encore.dev/api";
import type { ConversationSendRequest, ConversationSendResponse } from "./types";
import db from "../db";

function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export const conversationSend = api(
  { method: "POST", path: "/api/v2/conversations/send", expose: true },
  async (req: ConversationSendRequest): Promise<ConversationSendResponse> => {
    const profileResult = await db.query<{
      name: string;
      timezone: string | null;
    }>(
      `SELECT name, timezone FROM user_profiles WHERE user_id = $1`,
      [req.userId]
    );

    let userName = "User";
    let timezone = "America/New_York";

    if (profileResult.length > 0) {
      userName = profileResult[0].name;
      timezone = profileResult[0].timezone || "America/New_York";
    }

    const timeOfDay = getTimeOfDay();

    const historyResult = await db.query<{
      user_message: string | null;
      emma_response: string;
    }>(
      `SELECT user_message, emma_response
       FROM conversation_history
       WHERE user_id = $1 AND context->>'sessionId' = $2
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.userId, req.sessionId]
    );

    const response = `I understand you said: "${req.message}". As Emma, I'm here to help with your wellness journey. This is a simplified response - full AI integration will be added next.`;

    await db.query(
      `INSERT INTO conversation_history (user_id, conversation_type, user_message, emma_response, context)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.userId,
        req.sessionType,
        req.message,
        response,
        JSON.stringify({
          sessionId: req.sessionId,
          timeOfDay,
        }),
      ]
    );

    await db.query(
      `UPDATE conversation_sessions
       SET last_activity_at = NOW()
       WHERE id = $1`,
      [req.sessionId]
    );

    return {
      response,
      emotionalTone: "supportive",
      context: { timeOfDay },
      sessionId: req.sessionId,
    };
  }
);
