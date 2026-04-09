import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateChallengeRequest, UpdateChallengeResponse, Challenge } from "./types";

export const updateChallenge = api(
  { expose: true, method: "POST", path: "/challenges/update", auth: false },
  async (req: UpdateChallengeRequest): Promise<UpdateChallengeResponse> => {
    const { id, name, description, day_messages, send_time, timezone, is_active } = req;

    try {
      if (name !== undefined) {
        await db.exec`UPDATE challenges SET name = ${name}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (description !== undefined) {
        await db.exec`UPDATE challenges SET description = ${description}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (day_messages !== undefined) {
        await db.exec`UPDATE challenges SET day_messages = ${JSON.stringify(day_messages)}::jsonb, updated_at = NOW() WHERE id = ${id}`;
      }
      if (send_time !== undefined) {
        const sendTimeFull = send_time.length === 5 ? `${send_time}:00` : send_time;
        await db.exec`UPDATE challenges SET send_time = ${sendTimeFull}::TIME, updated_at = NOW() WHERE id = ${id}`;
      }
      if (timezone !== undefined) {
        await db.exec`UPDATE challenges SET timezone = ${timezone}, updated_at = NOW() WHERE id = ${id}`;
      }
      if (is_active !== undefined) {
        await db.exec`UPDATE challenges SET is_active = ${is_active}, updated_at = NOW() WHERE id = ${id}`;
      }

      const raw = await db.queryRow<{
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
        FROM challenges WHERE id = ${id}
      `;

      if (!raw) return { success: false, error: "Challenge not found" };

      const challenge: Challenge = {
        ...raw,
        day_messages: typeof raw.day_messages === "string"
          ? JSON.parse(raw.day_messages)
          : raw.day_messages,
      };

      return { success: true, challenge };
    } catch (error: any) {
      return { success: false, error: error?.message || "Unknown error" };
    }
  }
);
