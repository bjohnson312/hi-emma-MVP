import { api, APIError } from "encore.dev/api";
import { getAuthData } from "~encore/auth";
import type { ConversationSendRequest, ConversationSendResponse } from "./types";
import db from "../db";
import { determineTimeOfDay } from "../../api_v2/business/routine";
import { detectIntentFromMessage } from "../../api_v2/business/insights";
import { addDevLog } from "../../api_v2/utils/devLogs";

async function loadUserProfile(userId: string) {
  try {
    addDevLog({ event: "loadUserProfile_start", userId });
    
    const profile = await db.queryRow<{
      name: string;
      timezone: string | null;
    }>`SELECT name, timezone FROM user_profiles WHERE user_id = ${userId}`;
    
    addDevLog({ event: "loadUserProfile_profile", profile });

    const result = {
      name: profile?.name || "User",
      timezone: profile?.timezone || "America/New_York"
    };
    
    addDevLog({ event: "loadUserProfile_result", result });
    return result;
  } catch (error) {
    addDevLog({ event: "loadUserProfile_error", error: error instanceof Error ? error.toString() : String(error), stack: error instanceof Error ? error.stack : undefined });
    throw error;
  }
}

export const conversationSend = api(
  { method: "POST", path: "/api/v2/conversations/send", expose: true },
  async (req: ConversationSendRequest): Promise<ConversationSendResponse> => {
    try {
      console.log('[conversation_send] ==================== REQUEST START ====================');
      console.log('[conversation_send] 📥 Incoming request body:', JSON.stringify(req, null, 2));
      console.log('[conversation_send] 👤 Request userId:', req.userId);
      console.log('[conversation_send] 💬 Message:', req.message);
      addDevLog({ event: "conversation_send_request", req });
      
      console.log('[conversation_send] 🔐 Calling getAuthData()...');
      const auth = getAuthData();
      console.log('[conversation_send] 🔐 getAuthData() returned:', JSON.stringify(auth, null, 2));
      console.log('[conversation_send] 👤 auth.userID:', auth?.userID);
      console.log('[conversation_send] 👤 auth exists?', !!auth);
      console.log('[conversation_send] 👤 auth.userID exists?', !!auth?.userID);
      
      console.log('[conversation_send] 🔍 Comparing auth and request:');
      console.log('[conversation_send]    - req.userId:', req.userId);
      console.log('[conversation_send]    - auth?.userID:', auth?.userID);
      console.log('[conversation_send]    - Match?', auth?.userID === req.userId);
      console.log('[conversation_send]    - auth exists?', !!auth);
      console.log('[conversation_send]    - Both exist and match?', !!auth && auth.userID === req.userId);
      
      addDevLog({ event: "conversation_send_auth_check", authUserID: auth?.userID, requestUserId: req.userId, match: auth?.userID === req.userId, authExists: !!auth });
      
      if (!auth || auth.userID !== req.userId) {
        console.log('[conversation_send] ❌ Authorization failed!');
        console.log('[conversation_send] ❌ Reason:', !auth ? 'auth is null/undefined' : 'userID mismatch');
        console.log('[conversation_send] ❌ Expected userId:', req.userId);
        console.log('[conversation_send] ❌ Got auth.userID:', auth?.userID);
        throw APIError.permissionDenied("Cannot access or modify another user's data");
      }
      
      console.log('[conversation_send] ✅ Authorization successful! Proceeding with request...');
      
      addDevLog({ event: "conversation_send_load_user_profile" });
      const userProfile = await loadUserProfile(req.userId);
      addDevLog({ event: "conversation_send_user_profile_loaded" });
      
      addDevLog({ event: "conversation_send_determine_time_of_day" });
      const timeOfDay = determineTimeOfDay(new Date(), userProfile.timezone);
      addDevLog({ event: "conversation_send_time_of_day", timeOfDay });

      addDevLog({ event: "conversation_send_detect_intent" });
      const intentResult = detectIntentFromMessage(req.message);
      addDevLog({ event: "conversation_send_intent_result", intentResult });

      const response = `I understand you said: "${req.message}". As Emma, I'm here to help with your wellness journey. [Intent detected: ${intentResult.intent} with ${(intentResult.confidence * 100).toFixed(0)}% confidence]`;
      addDevLog({ event: "conversation_send_generated_response", response });

      addDevLog({ event: "conversation_send_insert_history" });
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
      addDevLog({ event: "conversation_send_history_inserted" });

      addDevLog({ event: "conversation_send_update_session" });
      await db.exec`
        UPDATE conversation_sessions
        SET last_activity_at = NOW()
        WHERE id = ${req.sessionId}
      `;
      addDevLog({ event: "conversation_send_session_updated" });

      const suggestedActions = [];
      
      if (intentResult.intent === 'start_morning_routine' || intentResult.intent === 'start_evening_routine') {
        const routineType = intentResult.intent === 'start_morning_routine' ? 'morning' : 'evening';
        addDevLog({ event: "conversation_send_add_suggested_action", routineType });
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
      
      addDevLog({ event: "conversation_send_response", result });
      addDevLog({ event: "conversation_send_completed_successfully" });
      
      return result;
    } catch (error) {
      addDevLog({ event: "conversation_send_error", error: error instanceof Error ? error.toString() : String(error), stack: error instanceof Error ? error.stack : undefined, req });
      throw error;
    }
  }
);
