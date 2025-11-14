import { api } from "encore.dev/api";
import db from "../db";

export interface GetProviderHistoryRequest {
  provider_id: string;
  session_id: number;
}

export interface GetProviderHistoryResponse {
  messages: Array<{
    sender: "user" | "emma";
    text: string;
    timestamp: Date;
  }>;
}

export const getHistory = api<GetProviderHistoryRequest, GetProviderHistoryResponse>(
  { expose: true, method: "POST", path: "/provider-chat/history" },
  async (req) => {
    const { provider_id, session_id } = req;

    const historyQuery = await db.query<{
      user_message: string;
      emma_response: string;
      created_at: Date;
    }>`
      SELECT user_message, emma_response, created_at
      FROM provider_chat_history
      WHERE provider_id = ${provider_id}
        AND session_id = ${session_id}
      ORDER BY created_at ASC
    `;

    const messages: Array<{
      sender: "user" | "emma";
      text: string;
      timestamp: Date;
    }> = [];

    for await (const entry of historyQuery) {
      messages.push({
        sender: "user",
        text: entry.user_message,
        timestamp: entry.created_at
      });
      messages.push({
        sender: "emma",
        text: entry.emma_response,
        timestamp: entry.created_at
      });
    }

    return { messages };
  }
);
