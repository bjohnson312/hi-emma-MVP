import { api } from "encore.dev/api";
import db from "../db";
import type { CreateChallengeRequest, CreateChallengeResponse, Challenge } from "./types";

export const createChallenge = api(
  { expose: true, method: "POST", path: "/challenges/create", auth: false },
  async (req: CreateChallengeRequest): Promise<CreateChallengeResponse> => {
    const { name, description, day_messages, send_time, timezone, enrolled_users } = req;

    if (!name || !name.trim()) {
      return { success: false, error: "Challenge name is required" };
    }
    if (!day_messages || day_messages.length === 0) {
      return { success: false, error: "At least one day message is required" };
    }
    if (!enrolled_users || enrolled_users.length === 0) {
      return { success: false, error: "At least one user must be enrolled" };
    }

    const tz = timezone || "America/Chicago";
    const sendTimeFull = send_time.length === 5 ? `${send_time}:00` : send_time;

    try {
      const rawChallenge = await db.queryRow<{
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
        INSERT INTO challenges (name, description, day_messages, send_time, timezone)
        VALUES (
          ${name.trim()},
          ${description || null},
          ${JSON.stringify(day_messages)}::jsonb,
          ${sendTimeFull}::TIME,
          ${tz}
        )
        RETURNING id, created_at, updated_at, name, description,
          day_messages::text, send_time::text, timezone, is_active, created_by
      `;

      if (!rawChallenge) {
        return { success: false, error: "Failed to create challenge" };
      }

      const challenge: Challenge = {
        ...rawChallenge,
        day_messages: typeof rawChallenge.day_messages === "string"
          ? JSON.parse(rawChallenge.day_messages)
          : rawChallenge.day_messages,
      };

      let enrolledCount = 0;
      for (const user of enrolled_users) {
        if (!user.user_id || !user.phone_number) continue;
        try {
          await db.exec`
            INSERT INTO challenge_enrollments (challenge_id, user_id, phone_number, start_date, current_day)
            VALUES (${challenge.id}, ${user.user_id}, ${user.phone_number}, CURRENT_DATE, 0)
            ON CONFLICT (challenge_id, user_id) DO NOTHING
          `;
          enrolledCount++;
        } catch {
          // skip individual enrollment failures
        }
      }

      return { success: true, challenge, enrolled_count: enrolledCount };
    } catch (error: any) {
      return { success: false, error: error?.message || "Unknown error" };
    }
  }
);
