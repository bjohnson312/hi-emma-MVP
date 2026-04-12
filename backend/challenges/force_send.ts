import { api } from "encore.dev/api";
import db from "../db";
import { sendSMS } from "../notifications/sms";
import { buildMemoryContext } from "../conversation/memory";
import { secret } from "encore.dev/config";

const OpenAIKey = secret("OpenAIKey");

async function personalizeMessage(
  template: string,
  dayNumber: number,
  totalDays: number,
  userId: string,
  recentReplies: { day: number; reply: string }[]
): Promise<string> {
  const openaiKey = OpenAIKey?.();
  if (!openaiKey) return template;

  const memoryContext = await buildMemoryContext(userId);
  const repliesContext = recentReplies.length > 0
    ? `\n\nUser's recent replies:\n${recentReplies.map(r => `- Day ${r.day}: "${r.reply}"`).join("\n")}`
    : "";

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
          {
            role: "user",
            content: `You are Emma sending a Day ${dayNumber} of ${totalDays} wellness challenge SMS.\n\nTemplate: "${template}"\n${memoryContext}${repliesContext}\n\nPersonalize it for this user. Keep under 320 chars. Reply with ONLY the message text.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });
    if (!response.ok) return template;
    const data: any = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || template;
  } catch {
    return template;
  }
}

export interface ForceSendRequest {
  challenge_id: number;
  enrollment_id: number;
  day_number: number;
  override_sent?: boolean;
}

export interface ForceSendResponse {
  success: boolean;
  message_body?: string;
  external_id?: string;
  was_resend?: boolean;
  error?: string;
}

export const forceSend = api(
  { expose: true, method: "POST", path: "/challenges/force-send", auth: false },
  async (req: ForceSendRequest): Promise<ForceSendResponse> => {
    const enrollment = await db.queryRow<{
      id: number;
      user_id: string;
      phone_number: string;
      current_day: number;
      challenge_id: number;
    }>`
      SELECT id, user_id, phone_number, current_day, challenge_id
      FROM challenge_enrollments
      WHERE id = ${req.enrollment_id} AND challenge_id = ${req.challenge_id}
    `;
    if (!enrollment) return { success: false, error: "Enrollment not found" };

    const challenge = await db.queryRow<{ name: string; day_messages: string }>`
      SELECT name, day_messages::text FROM challenges WHERE id = ${req.challenge_id}
    `;
    if (!challenge) return { success: false, error: "Challenge not found" };

    const rawMessages = typeof challenge.day_messages === "string"
      ? JSON.parse(challenge.day_messages)
      : challenge.day_messages;
    const dayMessages: { day: number; message: string }[] = Array.isArray(rawMessages)
      ? rawMessages
      : typeof rawMessages === "string"
        ? JSON.parse(rawMessages)
        : [];

    const dayEntry = dayMessages.find(d => d.day === req.day_number);
    if (!dayEntry) return { success: false, error: `No message defined for day ${req.day_number}` };

    const existing = await db.queryRow<{ id: number; status: string }>`
      SELECT id, status FROM challenge_sends
      WHERE enrollment_id = ${enrollment.id} AND day_number = ${req.day_number}
    `;

    const isResend = !!existing;

    if (existing && !req.override_sent) {
      return {
        success: false,
        error: `Day ${req.day_number} was already sent (status: ${existing.status}). Set override_sent=true to resend.`,
      };
    }

    const recentReplies: { day: number; reply: string }[] = [];
    for await (const r of db.query<{ day_number: number; reply_body: string }>`
      SELECT day_number, reply_body FROM challenge_sends
      WHERE enrollment_id = ${enrollment.id} AND reply_body IS NOT NULL
      ORDER BY day_number DESC LIMIT 3
    `) {
      recentReplies.push({ day: r.day_number, reply: r.reply_body });
    }

    const messageBody = await personalizeMessage(
      dayEntry.message,
      req.day_number,
      dayMessages.length,
      enrollment.user_id,
      recentReplies
    );

    let externalId: string | undefined;
    let messageId: number | undefined;
    let sendStatus: "sent" | "failed" = "sent";
    let sendError: string | undefined;

    try {
      const result = await sendSMS(enrollment.phone_number, messageBody);
      externalId = result.sid;

      const msgRow = await db.queryRow<{ id: number }>`
        INSERT INTO messages (channel, direction, "to", "from", body, status, external_id, user_id, metadata)
        VALUES ('sms', 'outbound', ${enrollment.phone_number}, 'emma',
          ${messageBody}, 'sent', ${externalId}, ${enrollment.user_id},
          ${JSON.stringify({ challenge_id: req.challenge_id, challenge_name: challenge.name, day_number: req.day_number, force_send: true })})
        RETURNING id
      `;
      messageId = msgRow?.id;
    } catch (err: any) {
      sendStatus = "failed";
      sendError = err?.message || "Unknown error";
    }

    if (isResend && existing) {
      await db.exec`
        UPDATE challenge_sends
        SET
          message_body = ${messageBody},
          sent_at = NOW(),
          message_id = ${messageId ?? null},
          external_id = ${externalId ?? null},
          status = ${sendStatus},
          error = ${sendError ?? null}
        WHERE id = ${existing.id}
      `;
    } else {
      await db.exec`
        INSERT INTO challenge_sends (
          challenge_id, enrollment_id, user_id, phone_number,
          day_number, message_body, sent_at, message_id, external_id, status, error
        ) VALUES (
          ${req.challenge_id}, ${enrollment.id}, ${enrollment.user_id}, ${enrollment.phone_number},
          ${req.day_number}, ${messageBody}, NOW(), ${messageId ?? null}, ${externalId ?? null},
          ${sendStatus}, ${sendError ?? null}
        )
        ON CONFLICT (enrollment_id, day_number) DO UPDATE SET
          message_body = EXCLUDED.message_body,
          sent_at = EXCLUDED.sent_at,
          message_id = EXCLUDED.message_id,
          external_id = EXCLUDED.external_id,
          status = EXCLUDED.status,
          error = EXCLUDED.error
      `;
    }

    if (sendStatus === "sent") {
      await db.exec`
        UPDATE challenge_enrollments
        SET current_day = GREATEST(current_day, ${req.day_number})
        WHERE id = ${enrollment.id}
      `;
    }

    return {
      success: sendStatus === "sent",
      message_body: messageBody,
      external_id: externalId,
      was_resend: isResend,
      error: sendError,
    };
  }
);
