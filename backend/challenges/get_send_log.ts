import { api } from "encore.dev/api";
import db from "../db";

export interface SendLogEntry {
  kind: "sent" | "upcoming" | "missed";
  challenge_id: number;
  challenge_name: string;
  enrollment_id: number;
  user_id: string;
  phone_number: string;
  day_number: number;
  total_days: number;
  scheduled_date: string;
  sent_at: Date | null;
  status: string | null;
  error: string | null;
  reply_body: string | null;
  replied_at: Date | null;
  message_body: string | null;
  external_id: string | null;
}

export interface GetSendLogResponse {
  entries: SendLogEntry[];
}

export const getSendLog = api(
  { expose: true, method: "GET", path: "/challenges/send-log", auth: false },
  async (): Promise<GetSendLogResponse> => {
    const entries: SendLogEntry[] = [];

    const sent: SendLogEntry[] = [];
    for await (const row of db.query<{
      challenge_id: number;
      challenge_name: string;
      enrollment_id: number;
      user_id: string;
      phone_number: string;
      day_number: number;
      total_days: number;
      sent_at: Date;
      status: string;
      error: string | null;
      reply_body: string | null;
      replied_at: Date | null;
      message_body: string;
      external_id: string | null;
      start_date: string;
    }>`
      SELECT
        cs.challenge_id,
        c.name AS challenge_name,
        cs.enrollment_id,
        cs.user_id,
        cs.phone_number,
        cs.day_number,
        jsonb_array_length(
          CASE
            WHEN jsonb_typeof(c.day_messages) = 'array' THEN c.day_messages
            ELSE (c.day_messages #>> '{}')::jsonb
          END
        ) AS total_days,
        cs.sent_at,
        cs.status,
        cs.error,
        cs.reply_body,
        cs.replied_at,
        cs.message_body,
        cs.external_id,
        ce.start_date::text AS start_date
      FROM challenge_sends cs
      JOIN challenges c ON c.id = cs.challenge_id
      JOIN challenge_enrollments ce ON ce.id = cs.enrollment_id
      ORDER BY cs.sent_at DESC
      LIMIT 25
    `) {
      const scheduledDate = new Date(row.start_date);
      scheduledDate.setDate(scheduledDate.getDate() + row.day_number - 1);

      sent.push({
        kind: row.status === "failed" ? "missed" : "sent",
        challenge_id: row.challenge_id,
        challenge_name: row.challenge_name,
        enrollment_id: row.enrollment_id,
        user_id: row.user_id,
        phone_number: row.phone_number,
        day_number: row.day_number,
        total_days: row.total_days,
        scheduled_date: scheduledDate.toISOString().slice(0, 10),
        sent_at: row.sent_at,
        status: row.status,
        error: row.error,
        reply_body: row.reply_body,
        replied_at: row.replied_at,
        message_body: row.message_body,
        external_id: row.external_id,
      });
    }

    entries.push(...sent);

    const upcoming: SendLogEntry[] = [];
    for await (const row of db.query<{
      challenge_id: number;
      challenge_name: string;
      enrollment_id: number;
      user_id: string;
      phone_number: string;
      next_day: number;
      total_days: number;
      send_time: string;
      timezone: string;
      start_date: string;
    }>`
      SELECT
        c.id AS challenge_id,
        c.name AS challenge_name,
        ce.id AS enrollment_id,
        ce.user_id,
        ce.phone_number,
        ce.current_day + 1 AS next_day,
        jsonb_array_length(
          CASE
            WHEN jsonb_typeof(c.day_messages) = 'array' THEN c.day_messages
            ELSE (c.day_messages #>> '{}')::jsonb
          END
        ) AS total_days,
        c.send_time::text AS send_time,
        c.timezone,
        ce.start_date::text AS start_date
      FROM challenge_enrollments ce
      JOIN challenges c ON c.id = ce.challenge_id
      WHERE ce.is_active = true
        AND c.is_active = true
        AND ce.current_day < jsonb_array_length(
          CASE
            WHEN jsonb_typeof(c.day_messages) = 'array' THEN c.day_messages
            ELSE (c.day_messages #>> '{}')::jsonb
          END
        )
      ORDER BY ce.current_day ASC, ce.id ASC
      LIMIT 25
    `) {
      const scheduledDate = new Date(row.start_date);
      scheduledDate.setDate(scheduledDate.getDate() + row.next_day - 1);

      upcoming.push({
        kind: "upcoming",
        challenge_id: row.challenge_id,
        challenge_name: row.challenge_name,
        enrollment_id: row.enrollment_id,
        user_id: row.user_id,
        phone_number: row.phone_number,
        day_number: row.next_day,
        total_days: row.total_days,
        scheduled_date: scheduledDate.toISOString().slice(0, 10),
        sent_at: null,
        status: null,
        error: null,
        reply_body: null,
        replied_at: null,
        message_body: null,
        external_id: null,
      });
    }

    entries.push(...upcoming);

    return { entries };
  }
);
