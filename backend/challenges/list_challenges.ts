import { api } from "encore.dev/api";
import db from "../db";
import type { ListChallengesResponse, Challenge } from "./types";

export const listChallenges = api(
  { expose: true, method: "GET", path: "/challenges", auth: false },
  async (): Promise<ListChallengesResponse> => {
    const challenges: Challenge[] = [];

    for await (const row of db.query<{
      id: number;
      created_at: Date;
      updated_at: Date;
      name: string;
      description: string | null;
      day_messages: string;
      send_time: string;
      timezone: string;
      is_active: boolean;
      created_by: string | null;
    }>`
      SELECT id, created_at, updated_at, name, description,
        day_messages::text, send_time::text, timezone, is_active, created_by
      FROM challenges
      ORDER BY created_at DESC
    `) {
      challenges.push({
        ...row,
        day_messages: typeof row.day_messages === "string"
          ? JSON.parse(row.day_messages)
          : row.day_messages,
      });
    }

    return { challenges, total: challenges.length };
  }
);
