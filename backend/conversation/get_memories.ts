import { api } from "encore.dev/api";
import db from "../db";

export interface MemorySummary {
  category: string;
  details: Array<{
    key: string;
    value: string;
    lastMentioned: Date;
    mentionCount: number;
  }>;
}

export interface GetMemorySummaryResponse {
  memories: MemorySummary[];
  totalCount: number;
}

export interface GetMemorySummaryRequest {
  userId: string;
}

export const getMemorySummary = api(
  { method: "POST", path: "/conversation/memories", expose: true },
  async (req: GetMemorySummaryRequest): Promise<GetMemorySummaryResponse> => {
    const userId = req.userId;

    const rows: Array<{
      category: string;
      key: string;
      value: string;
      lastMentioned: Date;
      mentionCount: number;
    }> = [];

    for await (const row of db.query<{
      category: string;
      key: string;
      value: string;
      lastMentioned: Date;
      mentionCount: number;
    }>`
      SELECT
        category,
        key,
        value,
        last_mentioned as "lastMentioned",
        mention_count as "mentionCount"
      FROM conversation_memory
      WHERE user_id = ${userId}
      ORDER BY category, importance_score DESC, last_mentioned DESC
    `) {
      rows.push(row);
    }

    const groupedMemories: Record<string, MemorySummary> = {};

    for (const row of rows) {
      if (!groupedMemories[row.category]) {
        groupedMemories[row.category] = {
          category: row.category,
          details: [],
        };
      }

      groupedMemories[row.category].details.push({
        key: row.key,
        value: row.value,
        lastMentioned: row.lastMentioned,
        mentionCount: row.mentionCount,
      });
    }

    const memories = Object.values(groupedMemories);

    return {
      memories,
      totalCount: rows.length,
    };
  }
);
