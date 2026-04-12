import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import { sendSMS } from "../notifications/sms";
import { buildMemoryContext } from "../conversation/memory";

const OpenAIKey = secret("OpenAIKey");

async function personalizeMessage(
  templateMessage: string,
  dayNumber: number,
  totalDays: number,
  userId: string,
  recentReplies: { day: number; reply: string }[]
): Promise<string> {
  const openaiKey = OpenAIKey?.();
  if (!openaiKey) return templateMessage;

  const memoryContext = await buildMemoryContext(userId);

  const repliesContext = recentReplies.length > 0
    ? `\n\nThe user's recent replies to previous challenge messages:\n${recentReplies.map(r => `- Day ${r.day}: "${r.reply}"`).join("\n")}`
    : "";

  const prompt = `You are Emma, a warm and personal wellness companion sending a daily SMS challenge message.

Today is Day ${dayNumber} of ${totalDays} in the wellness challenge.

Template message to personalize:
"${templateMessage}"
${memoryContext}${repliesContext}

Rewrite the template message to feel personal and relevant to THIS specific user based on what you know about them. Keep it:
- SMS-appropriate length (under 320 characters)
- Warm, encouraging, conversational — like a friend who knows them
- True to the Day ${dayNumber} theme and goal from the template
- If they replied to a previous day, briefly acknowledge their progress
- Do NOT invent facts not in the context. If you have no personal info, keep close to the template.

Reply with ONLY the final SMS message text, nothing else.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Emma, a wellness companion. Respond with only the SMS message text." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("[Challenge Scheduler] OpenAI error:", await response.text());
      return templateMessage;
    }

    const data: any = await response.json();
    const personalized = data.choices?.[0]?.message?.content?.trim();
    return personalized || templateMessage;
  } catch (err) {
    console.error("[Challenge Scheduler] Failed to personalize message:", err);
    return templateMessage;
  }
}

export const sendChallengeDaysHandler = api(
  { expose: true, method: "POST", path: "/internal/send-challenge-days", auth: false },
  async (): Promise<{ sent: number; skipped: number; errors: number; reason?: string }> => {
    const now = new Date();

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

      const parsed: { day: number; message: string }[] = Array.isArray(dayMessages)
        ? dayMessages
        : typeof dayMessages === "string"
          ? JSON.parse(dayMessages)
          : [];

      if (!parsed || parsed.length === 0) continue;
      const totalDays = parsed.length;

      const sendTimeFull = `${challenge.send_time}:00`.slice(0, 8);

      const windowCheck = await db.queryRow<{ in_window: boolean }>`
        SELECT (
          (CURRENT_DATE + ${sendTimeFull}::TIME) AT TIME ZONE ${challenge.timezone} <= ${now}
          AND
          ((CURRENT_DATE + INTERVAL '1 day') + ${sendTimeFull}::TIME) AT TIME ZONE ${challenge.timezone} > ${now}
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

        const dayEntry = parsed.find(d => d.day === nextDay);
        if (!dayEntry) {
          skipped++;
          continue;
        }

        const recentReplies: { day: number; reply: string }[] = [];
        for await (const r of db.query<{ day_number: number; reply_body: string }>`
          SELECT day_number, reply_body
          FROM challenge_sends
          WHERE enrollment_id = ${enrollment.id}
            AND reply_body IS NOT NULL
          ORDER BY day_number DESC
          LIMIT 3
        `) {
          recentReplies.push({ day: r.day_number, reply: r.reply_body });
        }

        const messageBody = await personalizeMessage(
          dayEntry.message,
          nextDay,
          totalDays,
          enrollment.user_id,
          recentReplies
        );

        let messageId: number | undefined;
        let externalId: string | undefined;
        let sendStatus: "sent" | "failed" = "sent";
        let sendError: string | undefined;

        try {
          const result = await sendSMS(enrollment.phone_number, messageBody);
          externalId = result.sid;

          const msgRow = await db.queryRow<{ id: number }>`
            INSERT INTO messages (channel, direction, "to", "from", body, status, external_id, user_id, metadata)
            VALUES (
              'sms', 'outbound', ${enrollment.phone_number}, 'emma',
              ${messageBody}, 'sent', ${externalId}, ${enrollment.user_id},
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
              ${nextDay}, ${messageBody}, NOW(), ${messageId ?? null}, ${externalId ?? null},
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
