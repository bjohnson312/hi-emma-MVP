import { api } from "encore.dev/api";
import db from "../db";
import type { LogConversationRequest } from "./types";

export const logConversation = api<LogConversationRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/conversation/log" },
  async (req) => {
    const { user_id, conversation_type, user_message, emma_response, context } = req;

    await db.exec`
      INSERT INTO conversation_history 
        (user_id, conversation_type, user_message, emma_response, context)
      VALUES 
        (${user_id}, ${conversation_type}, ${user_message || null}, ${emma_response}, ${context ? JSON.stringify(context) : null})
    `;

    return { success: true };
  }
);
