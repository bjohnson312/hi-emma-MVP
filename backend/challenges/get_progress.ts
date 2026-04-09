import { api } from "encore.dev/api";
import db from "../db";
import type {
  GetChallengeProgressRequest,
  GetChallengeProgressResponse,
  Challenge,
  UserProgress,
  DaySendStatus,
} from "./types";

export const getChallengeProgress = api(
  { expose: true, method: "GET", path: "/challenges/:id/progress", auth: false },
  async (req: GetChallengeProgressRequest): Promise<GetChallengeProgressResponse> => {
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
      SELECT id, created_at, updated_at, name, description,
        day_messages::text, send_time::text, timezone, is_active, created_by
      FROM challenges WHERE id = ${req.id}
    `;

    if (!rawChallenge) {
      throw new Error("Challenge not found");
    }

    const challenge: Challenge = {
      ...rawChallenge,
      day_messages: typeof rawChallenge.day_messages === "string"
        ? JSON.parse(rawChallenge.day_messages)
        : rawChallenge.day_messages,
    };

    const totalDays = challenge.day_messages.length;

    const enrollments: UserProgress[] = [];

    for await (const enrollment of db.query<{
      id: number;
      user_id: string;
      phone_number: string;
      current_day: number;
      start_date: string;
      is_active: boolean;
    }>`
      SELECT id, user_id, phone_number, current_day, start_date::text, is_active
      FROM challenge_enrollments
      WHERE challenge_id = ${req.id}
      ORDER BY created_at ASC
    `) {
      const sends: DaySendStatus[] = [];

      for await (const send of db.query<{
        day_number: number;
        status: string;
        sent_at: Date;
        replied_at: Date | null;
        reply_body: string | null;
      }>`
        SELECT day_number, status, sent_at, replied_at, reply_body
        FROM challenge_sends
        WHERE enrollment_id = ${enrollment.id}
        ORDER BY day_number ASC
      `) {
        sends.push({
          day_number: send.day_number,
          status: send.status as "sent" | "failed",
          sent_at: send.sent_at,
          replied_at: send.replied_at,
          reply_body: send.reply_body,
        });
      }

      const sentDayNumbers = new Set(sends.map(s => s.day_number));
      for (let d = 1; d <= totalDays; d++) {
        if (!sentDayNumbers.has(d)) {
          sends.push({
            day_number: d,
            status: "pending",
            sent_at: null,
            replied_at: null,
            reply_body: null,
          });
        }
      }

      sends.sort((a, b) => a.day_number - b.day_number);

      enrollments.push({
        user_id: enrollment.user_id,
        phone_number: enrollment.phone_number,
        enrollment_id: enrollment.id,
        current_day: enrollment.current_day,
        start_date: enrollment.start_date,
        is_active: enrollment.is_active,
        sends,
      });
    }

    return { challenge, total_days: totalDays, enrollments };
  }
);
