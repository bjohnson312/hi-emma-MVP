import { api } from "encore.dev/api";
import db from "../db";
import type { GetConversationHistoryRequest, ConversationEntry } from "./types";

interface GetConversationHistoryResponse {
  history: ConversationEntry[];
}

export const getConversationHistory = api<GetConversationHistoryRequest, GetConversationHistoryResponse>(
  { expose: true, method: "GET", path: "/conversation/history/:user_id" },
  async (req) => {
    const { user_id, conversation_type, limit = 50 } = req;

    if (conversation_type) {
      const historyQuery = await db.query<ConversationEntry>`
        SELECT id, user_id, conversation_type, user_message, emma_response, context, created_at
        FROM conversation_history
        WHERE user_id = ${user_id} AND conversation_type = ${conversation_type}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;
      const history = [];
      for await (const entry of historyQuery) {
        history.push(entry);
      }
      return { history };
    }

    const historyQuery2 = await db.query<ConversationEntry>`
      SELECT id, user_id, conversation_type, user_message, emma_response, context, created_at
      FROM conversation_history
      WHERE user_id = ${user_id}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    const history = [];
    for await (const entry of historyQuery2) {
      history.push(entry);
    }

    return { history };
  }
);
