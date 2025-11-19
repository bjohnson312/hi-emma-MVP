import { api } from "encore.dev/api";
import type { ConversationSendRequest, ConversationSendResponse } from "./types";
import db from "../db";
import { determineTimeOfDay } from "../../api_v2/business/routine";
import { detectIntentFromMessage } from "../../api_v2/business/insights";

async function loadUserProfile(userId: string) {
  const profile = await db.queryRow<{
    name: string;
    timezone: string | null;
  }>`SELECT name, timezone FROM user_profiles WHERE user_id = ${userId}`;

  return {
    name: profile?.name || "User",
    timezone: profile?.timezone || "America/New_York"
  };
}

export const conversationSend = api(
  { method: "POST", path: "/api/v2/conversations/send", expose: true },
  async (req: ConversationSendRequest): Promise<ConversationSendResponse> => {
    
    const userProfile = await loadUserProfile(req.userId);
    const timeOfDay = determineTimeOfDay(new Date(), userProfile.timezone);

    const intentResult = detectIntentFromMessage(req.message);

    const response = `I understand you said: "${req.message}". As Emma, I'm here to help with your wellness journey. [Intent detected: ${intentResult.intent} with ${(intentResult.confidence * 100).toFixed(0)}% confidence]`;

    await db.exec`
      INSERT INTO conversation_history (user_id, conversation_type, user_message, emma_response, context)
      VALUES (${req.userId}, ${req.sessionType}, ${req.message}, ${response}, ${JSON.stringify({
        sessionId: req.sessionId,
        timeOfDay,
        intent: intentResult.intent,
        confidence: intentResult.confidence,
        entities: intentResult.entities || {}
      })})
    `;

    await db.exec`
      UPDATE conversation_sessions
      SET last_activity_at = NOW()
      WHERE id = ${req.sessionId}
    `;

    const suggestedActions = [];
    
    if (intentResult.intent === 'start_morning_routine' || intentResult.intent === 'start_evening_routine') {
      const routineType = intentResult.intent === 'start_morning_routine' ? 'morning' : 'evening';
      suggestedActions.push({
        id: `start_${routineType}_routine`,
        label: `Start ${routineType.charAt(0).toUpperCase() + routineType.slice(1)} Routine`,
        action: 'start_routine',
        params: {
          routineType,
          estimatedDuration: '10 minutes'
        }
      });
    }

    return {
      response,
      sessionId: req.sessionId,
      timestamp: new Date().toISOString(),
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      context: {
        timeOfDay: timeOfDay as any,
        routineState: 'none',
        streak: 0,
        entities: intentResult.entities || {}
      }
    };
  }
);
