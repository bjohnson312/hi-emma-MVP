import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import { sendSMS } from "../notifications/sms";
import { buildMemoryContext, extractAndStoreMemories } from "../conversation/memory";

const twilioMessagingServiceSid = secret("TwilioMessagingServiceSID");
const twilioPhoneNumber = secret("TwilioPhoneNumber");
const OpenAIKey = secret("OpenAIKey");

async function generateChallengeReply(
  userMessage: string,
  userId: string,
  challengeName: string,
  dayNumber: number,
  totalDays: number,
  originalDayMessage: string
): Promise<string> {
  const openaiKey = OpenAIKey?.();
  if (!openaiKey) return "";

  const memoryContext = await buildMemoryContext(userId);

  const prompt = `You are Emma, a warm wellness companion. A user just replied to their Day ${dayNumber} of ${totalDays} challenge SMS in "${challengeName}".

The message you sent them today was:
"${originalDayMessage}"

Their reply: "${userMessage}"
${memoryContext}

Respond as Emma — warm, encouraging, brief (under 200 characters). Acknowledge what they said, celebrate their effort, and give them a small nudge for tomorrow if appropriate. Be conversational, not clinical.

Reply with ONLY the SMS response text.`;

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
          { role: "system", content: "You are Emma, a wellness companion. Respond with only the SMS message text, under 200 characters." },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      console.error("[Twilio Inbound] OpenAI error:", await response.text());
      return "";
    }

    const data: any = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();

    if (userId && reply) {
      extractAndStoreMemories(userId, userMessage, reply).catch(() => {});
    }

    return reply || "";
  } catch (err) {
    console.error("[Twilio Inbound] Failed to generate challenge reply:", err);
    return "";
  }
}

export const inboundSMS = api.raw(
  { expose: true, method: "POST", path: "/twilio/inbound-sms" },
  async (req, resp) => {
    console.log('[Twilio Inbound] Webhook received');

    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const bodyText = Buffer.concat(chunks).toString('utf-8');

    console.log('[Twilio Inbound] raw body:', bodyText.substring(0, 200));

    const params = new URLSearchParams(bodyText);

    const MessageSid = params.get('MessageSid') || params.get('SmsMessageSid') || '';
    const From = params.get('From') || '';
    const To = params.get('To') || '';
    const Body = params.get('Body') || '';

    console.log(`[Twilio Inbound] MessageSid: ${MessageSid}, From: ${From}, To: ${To}, Body: ${Body}`);

    if (!MessageSid || !From || !To || !Body) {
      console.error('[Twilio Inbound] Missing required fields');
      resp.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
      resp.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
      return;
    }

    try {
      const existing = await db.queryRow<{ id: number }>`
        SELECT id FROM messages
        WHERE external_id = ${MessageSid}
      `;

      if (existing) {
        console.log(`[Twilio Inbound] Already processed message ${MessageSid}`);
        resp.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
        resp.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        return;
      }

      const inboundMessage = await db.queryRow<{ id: number }>`
        INSERT INTO messages (
          channel, direction, "to", "from", body, status, external_id, metadata
        ) VALUES (
          'sms',
          'inbound',
          ${To},
          ${From},
          ${Body},
          'received',
          ${MessageSid},
          ${JSON.stringify({ source: 'twilio_webhook' })}
        )
        ON CONFLICT (external_id) DO NOTHING
        RETURNING id
      `;

      if (!inboundMessage) {
        console.log(`[Twilio Inbound] Message ${MessageSid} already processed (via conflict)`);
        resp.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
        resp.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        return;
      }

      console.log(`[Twilio Inbound] Received inbound SMS (ID: ${inboundMessage.id})`);

      let fromIdentifier: string;
      try {
        const serviceSid = twilioMessagingServiceSid();
        fromIdentifier = serviceSid || twilioPhoneNumber();
      } catch {
        fromIdentifier = twilioPhoneNumber();
      }

      const normalized = Body.trim().toLowerCase().replace(/^hi,\s*/i, 'hi ');

      if (normalized.startsWith('hi emma')) {
        const replyBody = "Hi, I'm Emma. Thanks for reaching out. I'm your personal wellness companion. I'll send your daily check-in link here soon. Brian appreciates you helping me be the best I can be! - Health is wealth, invest in yourself.\n\nEmma Health App: https://staging-hi-emma-morning-routine-f5ci.frontend.encr.app";

        try {
          const result = await sendSMS(From, replyBody);

          await db.exec`
            INSERT INTO messages (
              channel, direction, "to", "from", body, status, external_id, metadata
            ) VALUES (
              'sms',
              'outbound',
              ${From},
              ${fromIdentifier},
              ${replyBody},
              'sent',
              ${result.sid},
              ${JSON.stringify({
                auto_reply: true,
                triggered_by_message_id: inboundMessage.id,
                trigger: 'hi_emma'
              })}
            )
          `;

          console.log(`[Twilio Inbound] Sent auto-reply to ${From} (SID: ${result.sid})`);
        } catch (error) {
          console.error(`[Twilio Inbound] Failed to send auto-reply:`, error);
        }

        resp.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
        resp.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
        return;
      }

      const matchingSend = await db.queryRow<{
        id: number;
        enrollment_id: number;
        user_id: string;
        day_number: number;
        message_body: string;
        challenge_id: number;
      }>`
        SELECT cs.id, cs.enrollment_id, cs.user_id, cs.day_number, cs.message_body, cs.challenge_id
        FROM challenge_sends cs
        WHERE cs.phone_number = ${From}
          AND cs.status = 'sent'
          AND cs.replied_at IS NULL
          AND cs.sent_at <= NOW()
        ORDER BY cs.sent_at DESC
        LIMIT 1
      `;

      if (matchingSend) {
        await db.exec`
          UPDATE challenge_sends
          SET replied_at = NOW(),
              reply_body = ${Body},
              reply_message_id = ${inboundMessage.id}
          WHERE id = ${matchingSend.id}
        `;

        const challengeInfo = await db.queryRow<{ name: string; day_messages: string }>`
          SELECT name, day_messages::text FROM challenges WHERE id = ${matchingSend.challenge_id}
        `;

        if (challengeInfo) {
          const dayMessages: { day: number; message: string }[] =
            typeof challengeInfo.day_messages === "string"
              ? JSON.parse(challengeInfo.day_messages)
              : challengeInfo.day_messages;
          const totalDays = dayMessages.length;

          const replyBody = await generateChallengeReply(
            Body,
            matchingSend.user_id,
            challengeInfo.name,
            matchingSend.day_number,
            totalDays,
            matchingSend.message_body
          );

          if (replyBody) {
            try {
              const result = await sendSMS(From, replyBody);

              await db.exec`
                INSERT INTO messages (
                  channel, direction, "to", "from", body, status, external_id, user_id, metadata
                ) VALUES (
                  'sms', 'outbound', ${From}, ${fromIdentifier},
                  ${replyBody}, 'sent', ${result.sid}, ${matchingSend.user_id},
                  ${JSON.stringify({
                    auto_reply: true,
                    triggered_by_message_id: inboundMessage.id,
                    trigger: 'challenge_reply',
                    challenge_id: matchingSend.challenge_id,
                    day_number: matchingSend.day_number,
                  })}
                )
              `;

              console.log(`[Twilio Inbound] Sent challenge reply to ${From} for day ${matchingSend.day_number}`);
            } catch (err) {
              console.error(`[Twilio Inbound] Failed to send challenge reply:`, err);
            }
          }
        }
      }

    } catch (error) {
      console.error(`[Twilio Inbound] Error processing webhook:`, error);
    }

    resp.writeHead(200, { 'Content-Type': 'text/xml; charset=utf-8' });
    resp.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
  }
);
