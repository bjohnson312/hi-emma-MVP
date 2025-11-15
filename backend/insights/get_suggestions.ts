import { api } from "encore.dev/api";
import db from "../db";
import type { GetSuggestionsRequest, GetSuggestionsResponse, DetectedInsight } from "./types";

export const getSuggestions = api<GetSuggestionsRequest, GetSuggestionsResponse>(
  { expose: true, method: "POST", path: "/insights/suggestions" },
  async (req) => {
    const { sessionId, userId, status } = req;

    const suggestions: DetectedInsight[] = [];
    
    if (sessionId && status) {
      const query = db.query<DetectedInsight>`
        SELECT 
          id, session_id as "sessionId", user_id as "userId", 
          intent_type as "intentType", extracted_data as "extractedData", 
          confidence, emma_suggestion_text as "emmaSuggestionText", 
          status, created_at as "createdAt", applied_at as "appliedAt", 
          dismissed_at as "dismissedAt"
        FROM conversation_detected_insights
        WHERE session_id = ${sessionId}
          AND user_id = ${userId}
          AND status = ${status}
        ORDER BY created_at DESC
      `;
      for await (const suggestion of query) {
        suggestions.push(suggestion);
      }
    } else if (sessionId) {
      const query = db.query<DetectedInsight>`
        SELECT 
          id, session_id as "sessionId", user_id as "userId", 
          intent_type as "intentType", extracted_data as "extractedData", 
          confidence, emma_suggestion_text as "emmaSuggestionText", 
          status, created_at as "createdAt", applied_at as "appliedAt", 
          dismissed_at as "dismissedAt"
        FROM conversation_detected_insights
        WHERE session_id = ${sessionId}
          AND user_id = ${userId}
        ORDER BY created_at DESC
      `;
      for await (const suggestion of query) {
        suggestions.push(suggestion);
      }
    } else if (status) {
      const query = db.query<DetectedInsight>`
        SELECT 
          id, session_id as "sessionId", user_id as "userId", 
          intent_type as "intentType", extracted_data as "extractedData", 
          confidence, emma_suggestion_text as "emmaSuggestionText", 
          status, created_at as "createdAt", applied_at as "appliedAt", 
          dismissed_at as "dismissedAt"
        FROM conversation_detected_insights
        WHERE user_id = ${userId}
          AND status = ${status}
        ORDER BY created_at DESC
        LIMIT 50
      `;
      for await (const suggestion of query) {
        suggestions.push(suggestion);
      }
    } else {
      const query = db.query<DetectedInsight>`
        SELECT 
          id, session_id as "sessionId", user_id as "userId", 
          intent_type as "intentType", extracted_data as "extractedData", 
          confidence, emma_suggestion_text as "emmaSuggestionText", 
          status, created_at as "createdAt", applied_at as "appliedAt", 
          dismissed_at as "dismissedAt"
        FROM conversation_detected_insights
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      `;
      for await (const suggestion of query) {
        suggestions.push(suggestion);
      }
    }

    return { suggestions };
  }
);
