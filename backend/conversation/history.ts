import { api } from "encore.dev/api";
import db from "../db";
import type { ConversationSession, SessionType } from "./types";
import type { ConversationEntry } from "../profile/types";

export interface ConversationWithMessages {
  session: ConversationSession;
  messages: ConversationEntry[];
}

export interface GetPastConversationsRequest {
  user_id: string;
  session_type: SessionType;
  days?: number;
}

export interface GetPastConversationsResponse {
  conversations: ConversationWithMessages[];
}

export interface GetConversationByDateRequest {
  user_id: string;
  session_type: SessionType;
  date: string;
}

export interface GetConversationByDateResponse {
  conversation: ConversationWithMessages | null;
}

export const getPastConversations = api<GetPastConversationsRequest, GetPastConversationsResponse>(
  { expose: true, method: "POST", path: "/conversation/history" },
  async (req) => {
    const { user_id, session_type, days = 7 } = req;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const sessionsQuery = await db.query<ConversationSession>`
      SELECT id, user_id, session_type, current_step, context, started_at, last_activity_at, completed, conversation_date
      FROM conversation_sessions
      WHERE user_id = ${user_id}
        AND session_type = ${session_type}
        AND conversation_date >= ${cutoffDateStr}
      ORDER BY conversation_date DESC, started_at DESC
    `;
    const sessions = [];
    for await (const session of sessionsQuery) {
      sessions.push(session);
    }

    const results: ConversationWithMessages[] = [];

    for (const session of sessions) {
      const messagesQuery = await db.query<ConversationEntry>`
        SELECT user_message, emma_response, created_at
        FROM conversation_history
        WHERE user_id = ${user_id}
          AND conversation_type = ${session_type}
          AND DATE(created_at) = ${session.conversation_date}
        ORDER BY created_at ASC
      `;
      const messages = [];
      for await (const msg of messagesQuery) {
        messages.push(msg);
      }

      results.push({
        session,
        messages
      });
    }

    return { conversations: results };
  }
);

export const getConversationByDate = api<GetConversationByDateRequest, GetConversationByDateResponse>(
  { expose: true, method: "POST", path: "/conversation/by-date" },
  async (req) => {
    const { user_id, session_type, date } = req;

    const session = await db.queryRow<ConversationSession>`
      SELECT id, user_id, session_type, current_step, context, started_at, last_activity_at, completed, conversation_date
      FROM conversation_sessions
      WHERE user_id = ${user_id}
        AND session_type = ${session_type}
        AND conversation_date = ${date}
      ORDER BY started_at DESC
      LIMIT 1
    `;

    if (!session) {
      return { conversation: null };
    }

    const messagesQuery = await db.query<ConversationEntry>`
      SELECT user_message, emma_response, created_at
      FROM conversation_history
      WHERE user_id = ${user_id}
        AND conversation_type = ${session_type}
        AND DATE(created_at) = ${date}
      ORDER BY created_at ASC
    `;
    const messages = [];
    for await (const msg of messagesQuery) {
      messages.push(msg);
    }

    return {
      conversation: {
        session,
        messages
      }
    };
  }
);
