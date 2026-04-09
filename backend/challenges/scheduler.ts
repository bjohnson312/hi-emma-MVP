import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import db from "../db";
import { sendSMS } from "../notifications/sms";

export const sendChallengeDaysHandler = api(
  { expose: true, method: "POST", path: "/internal/send-challenge-days", auth: false },
  async (): Promise<{ sent: number; skipped: number; errors: number; reason?: string }> => {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for await (const challenge of db.query<{
      id: number;
      name: string;
      day_messages: string;
      send_time: string;
      timezone: string;
    }>`
      SELECT id, name, day_messages::text, send_time::text, timezone
      FROM challenges
      WHERE is_active = true
    `) {
      const dayMessages: { day: number; message: string }[] =
        typeof challenge.day_messages === "string"
          ? JSON.parse(challenge.day_messages)
          : challenge.day_messages;

      if (!dayMessages || dayMessages.length === 0) continue;
      const totalDays = dayMessages.length;

      const sendTimeFull = `${challenge.send_time}:00`.slice(0, 8);

      const windowCheck = await db.queryRow<{ in_window: boolean }>`
        SELECT (
          (CURRENT_DATE + ${sendTimeFull}::TIME) AT TIME ZONE ${challenge.timezone}
          BETWEEN ${tenMinutesAgo} AND ${now}
        ) AS in_window
      `;

      if (!windowCheck?.in_window) {
        skipped++;
        continue;
      }

      for await (const enrollment of db.query<{
        id: number;
        user_id: string;
        phone_number: string;
        current_day: number;
        start_date: string;
      }>`
        SELECT id, user_id, phone_number, current_day, start_date::text
        FROM challenge_enrollments
        WHERE challenge_id = ${challenge.id} AND is_active = true
      `) {
        const nextDay = enrollment.current_day + 1;

        if (nextDay > totalDays) {
          skipped++;
          continue;
        }

        const alreadySent = await db.queryRow<{ count: number }>`
          SELECT COUNT(*) as count
          FROM challenge_sends
          WHERE enrollment_id = ${enrollment.id} AND day_number = ${nextDay}
        `;

        if (alreadySent && alreadySent.count > 0) {
          skipped++;
          continue;
        }

        const dayEntry = dayMessages.find(d => d.day === nextDay);
        if (!dayEntry) {
          skipped++;
          continue;
        }

        let messageId: number | undefined;
        let externalId: string | undefined;
        let sendStatus: "sent" | "failed" = "sent";
        let sendError: string | undefined;

        try {
          const result = await sendSMS(enrollment.phone_number, dayEntry.message);
          externalId = result.sid;

          const msgRow = await db.queryRow<{ id: number }>`
            INSERT INTO messages (channel, direction, "to", "from", body, status, external_id, user_id, metadata)
            VALUES (
              'sms', 'outbound', ${enrollment.phone_number}, 'emma',
              ${dayEntry.message}, 'sent', ${externalId}, ${enrollment.user_id},
              ${JSON.stringify({ challenge_id: challenge.id, challenge_name: challenge.name, day_number: nextDay })}
            )
            RETURNING id
          `;
          messageId = msgRow?.id;
        } catch (err: any) {
          sendStatus = "failed";
          sendError = err?.message || "Unknown error";
          errors++;
          console.error(`[Challenge Scheduler] Failed to send day ${nextDay} to ${enrollment.phone_number}:`, err);
        }

        try {
          await db.exec`
            INSERT INTO challenge_sends (
              challenge_id, enrollment_id, user_id, phone_number,
              day_number, message_body, sent_at, message_id, external_id, status, error
            ) VALUES (
              ${challenge.id}, ${enrollment.id}, ${enrollment.user_id}, ${enrollment.phone_number},
              ${nextDay}, ${dayEntry.message}, NOW(), ${messageId ?? null}, ${externalId ?? null},
              ${sendStatus}, ${sendError ?? null}
            )
            ON CONFLICT (enrollment_id, day_number) DO NOTHING
          `;

          if (sendStatus === "sent") {
            await db.exec`
              UPDATE challenge_enrollments
              SET current_day = ${nextDay}
              WHERE id = ${enrollment.id}
            `;
            sent++;
          }
        } catch (recordErr: any) {
          console.error(`[Challenge Scheduler] Failed to record send for enrollment ${enrollment.id}:`, recordErr);
          errors++;
        }
      }
    }

    return { sent, skipped, errors };
  }
);

const sendChallengeDays = new CronJob("challenge-day-sender", {
  title: "Send Challenge Day Messages",
  every: "1m",
  endpoint: sendChallengeDaysHandler,
});
