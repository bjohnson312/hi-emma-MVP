import { api } from "encore.dev/api";
import db from "../db";
import type { GetOrCreateSessionRequest, ConversationSession } from "./types";

export const getOrCreateSession = api<GetOrCreateSessionRequest, ConversationSession>(
  { expose: true, method: "POST", path: "/conversation/session" },
  async (req) => {
    const { user_id, session_type } = req;

    const existingSession = await db.queryRow<ConversationSession>`
      SELECT id, user_id, session_type, current_step, context, started_at, last_activity_at, completed
      FROM conversation_sessions
      WHERE user_id = ${user_id} 
        AND session_type = ${session_type}
        AND completed = false
        AND last_activity_at > NOW() - INTERVAL '4 hours'
      ORDER BY last_activity_at DESC
      LIMIT 1
    `;

    if (existingSession) {
      await db.exec`
        UPDATE conversation_sessions
        SET last_activity_at = NOW()
        WHERE id = ${existingSession.id}
      `;
      return existingSession;
    }

    const newSession = await db.queryRow<ConversationSession>`
      INSERT INTO conversation_sessions (user_id, session_type, context)
      VALUES (${user_id}, ${session_type}, ${JSON.stringify({})})
      RETURNING id, user_id, session_type, current_step, context, started_at, last_activity_at, completed
    `;

    await db.exec`
      INSERT INTO app_events (user_id, event_type)
      VALUES (${user_id}, 'conversation_start')
    `;

    return newSession!;
  }
);

export const updateSessionContext = api<{ session_id: number; context: Record<string, any>; current_step?: string }, { success: boolean }>(
  { expose: true, method: "PUT", path: "/conversation/session/:session_id/context" },
  async (req) => {
    const { session_id, context, current_step } = req;

    await db.exec`
      UPDATE conversation_sessions
      SET 
        context = ${JSON.stringify(context)},
        current_step = ${current_step || null},
        last_activity_at = NOW()
      WHERE id = ${session_id}
    `;

    return { success: true };
  }
);

export const completeSession = api<{ session_id: number }, { success: boolean }>(
  { expose: true, method: "PUT", path: "/conversation/session/:session_id/complete" },
  async (req) => {
    const { session_id } = req;

    await db.exec`
      UPDATE conversation_sessions
      SET completed = true, last_activity_at = NOW()
      WHERE id = ${session_id}
    `;

    return { success: true };
  }
);
