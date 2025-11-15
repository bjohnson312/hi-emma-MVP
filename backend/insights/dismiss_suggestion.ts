import { api } from "encore.dev/api";
import db from "../db";
import type { DismissSuggestionRequest, DismissSuggestionResponse } from "./types";

export const dismissSuggestion = api<DismissSuggestionRequest, DismissSuggestionResponse>(
  { expose: true, method: "POST", path: "/insights/dismiss" },
  async (req) => {
    const { suggestionId, userId } = req;

    const suggestion = await db.queryRow<{ id: string; user_id: string; status: string }>`
      SELECT id, user_id, status
      FROM conversation_detected_insights
      WHERE id = ${suggestionId} AND user_id = ${userId}
    `;

    if (!suggestion) {
      return { success: false };
    }

    if (suggestion.status !== "pending") {
      return { success: false };
    }

    await db.exec`
      UPDATE conversation_detected_insights
      SET status = 'dismissed', dismissed_at = NOW()
      WHERE id = ${suggestionId}
    `;

    return { success: true };
  }
);
