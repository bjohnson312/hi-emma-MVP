import { api } from "encore.dev/api";
import type { ConversationSendRequest, ConversationSendResponse } from "./types";
import db from "../db";
import { determineTimeOfDay } from "../../api_v2/business/routine";
import { detectIntentFromMessage } from "../../api_v2/business/insights";

async function loadUserProfile(userId: string) {
  try {
    console.log("loadUserProfile: Starting for userId:", userId);
    
    const profile = await db.queryRow<{
      name: string;
      timezone: string | null;
    }>`SELECT name, timezone FROM user_profiles WHERE user_id = ${userId}`;
    
    console.log("loadUserProfile: Profile result:", profile);

    const result = {
      name: profile?.name || "User",
      timezone: profile?.timezone || "America/New_York"
    };
    
    console.log("loadUserProfile: Returning:", result);
    return result;
  } catch (error) {
    console.error("ERROR IN loadUserProfile:", error);
    throw error;
  }
}

export const conversationSend = api(
  { method: "POST", path: "/api/v2/conversations/send", expose: true, auth: false },
  async (req: ConversationSendRequest): Promise<ConversationSendResponse> => {
    try {
      console.log("=== conversationSend: Request received ===");
      console.log("Request:", JSON.stringify(req, null, 2));
      
      console.log("conversationSend: Loading user profile");
      const userProfile = await loadUserProfile(req.userId);
      console.log("conversationSend: User profile loaded");
      
      console.log("conversationSend: Determining time of day");
      const timeOfDay = determineTimeOfDay(new Date(), userProfile.timezone);
      console.log("conversationSend: Time of day:", timeOfDay);

      console.log("conversationSend: Detecting intent from message");
      const intentResult = detectIntentFromMessage(req.message);
      console.log("conversationSend: Intent result:", intentResult);

      const response = `I understand you said: "${req.message}". As Emma, I'm here to help with your wellness journey. [Intent detected: ${intentResult.intent} with ${(intentResult.confidence * 100).toFixed(0)}% confidence]`;
      console.log("conversationSend: Generated response:", response);

      console.log("conversationSend: Inserting conversation history");
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
      console.log("conversationSend: Conversation history inserted");

      console.log("conversationSend: Updating session last_activity_at");
      await db.exec`
        UPDATE conversation_sessions
        SET last_activity_at = NOW()
        WHERE id = ${req.sessionId}
      `;
      console.log("conversationSend: Session updated");

      const suggestedActions = [];
      
      if (intentResult.intent === 'start_morning_routine' || intentResult.intent === 'start_evening_routine') {
        const routineType = intentResult.intent === 'start_morning_routine' ? 'morning' : 'evening';
        console.log("conversationSend: Adding suggested action for routine type:", routineType);
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

      const result = {
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
      
      console.log("conversationSend: Response:", JSON.stringify(result, null, 2));
      console.log("=== conversationSend: Completed successfully ===");
      
      return result;
    } catch (error) {
      console.error("=== ERROR IN conversationSend ===");
      console.error("Error details:", error);
      console.error("Error stack:", (error as Error).stack);
      console.error("Request that failed:", JSON.stringify(req, null, 2));
      throw error;
    }
  }
);
