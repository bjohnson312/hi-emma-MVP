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
  send_time: string;
  timezone: string;
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

    for await (const row of db.query<{
      challenge_id: number;
      challenge_name: string;
      enrollment_id: number;
      user_id: string;
      phone_number: string;
      day_number: number;
      total_days: number;
      scheduled_date: string;
      send_time: string;
      timezone: string;
      sent_at: Date;
      status: string;
      error: string | null;
      reply_body: string | null;
      replied_at: Date | null;
      message_body: string;
      external_id: string | null;
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
        (ce.start_date + ((cs.day_number - 1) * INTERVAL '1 day'))::date::text AS scheduled_date,
        c.send_time::text AS send_time,
        c.timezone,
        cs.sent_at,
        cs.status,
        cs.error,
        cs.reply_body,
        cs.replied_at,
        cs.message_body,
        cs.external_id
      FROM challenge_sends cs
      JOIN challenges c ON c.id = cs.challenge_id
      JOIN challenge_enrollments ce ON ce.id = cs.enrollment_id
      ORDER BY cs.sent_at DESC
      LIMIT 25
    `) {
      entries.push({
        kind: row.status === "failed" ? "missed" : "sent",
        challenge_id: row.challenge_id,
        challenge_name: row.challenge_name,
        enrollment_id: row.enrollment_id,
        user_id: row.user_id,
        phone_number: row.phone_number,
        day_number: row.day_number,
        total_days: row.total_days,
        scheduled_date: row.scheduled_date,
        send_time: row.send_time.slice(0, 5),
        timezone: row.timezone,
        sent_at: row.sent_at,
        status: row.status,
        error: row.error,
        reply_body: row.reply_body,
        replied_at: row.replied_at,
        message_body: row.message_body,
        external_id: row.external_id,
      });
    }

    for await (const row of db.query<{
      challenge_id: number;
      challenge_name: string;
      enrollment_id: number;
      user_id: string;
      phone_number: string;
      next_day: number;
      total_days: number;
      scheduled_date: string;
      send_time: string;
      timezone: string;
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
        (ce.start_date + (ce.current_day * INTERVAL '1 day'))::date::text AS scheduled_date,
        c.send_time::text AS send_time,
        c.timezone
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
      entries.push({
        kind: "upcoming",
        challenge_id: row.challenge_id,
        challenge_name: row.challenge_name,
        enrollment_id: row.enrollment_id,
        user_id: row.user_id,
        phone_number: row.phone_number,
        day_number: row.next_day,
        total_days: row.total_days,
        scheduled_date: row.scheduled_date,
        send_time: row.send_time.slice(0, 5),
        timezone: row.timezone,
        sent_at: null,
        status: null,
        error: null,
        reply_body: null,
        replied_at: null,
        message_body: null,
        external_id: null,
      });
    }

    return { entries };
  }
);
