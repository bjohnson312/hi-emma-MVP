import { api } from "encore.dev/api";
import { CronJob } from "encore.dev/cron";
import db from "../db";

export const correlateRepliesHandler = api(
  { expose: true, method: "POST", path: "/internal/correlate-challenge-replies", auth: false },
  async (): Promise<{ correlated: number }> => {
    let correlated = 0;

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for await (const inbound of db.query<{
      id: number;
      from_number: string;
      body: string;
      created_at: Date;
    }>`
      SELECT id, "from" as from_number, body, created_at
      FROM messages
      WHERE direction = 'inbound'
        AND channel = 'sms'
        AND created_at >= ${since}
    `) {
      const alreadyLinked = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count FROM challenge_sends
        WHERE reply_message_id = ${inbound.id}
      `;
      if (alreadyLinked && alreadyLinked.count > 0) continue;

      const matchingSend = await db.queryRow<{ id: number; enrollment_id: number }>`
        SELECT cs.id, cs.enrollment_id
        FROM challenge_sends cs
        WHERE cs.phone_number = ${inbound.from_number}
          AND cs.status = 'sent'
          AND cs.replied_at IS NULL
          AND cs.sent_at <= ${inbound.created_at}
        ORDER BY cs.sent_at DESC
        LIMIT 1
      `;

      if (!matchingSend) continue;

      await db.exec`
        UPDATE challenge_sends
        SET replied_at = ${inbound.created_at},
            reply_body = ${inbound.body},
            reply_message_id = ${inbound.id}
        WHERE id = ${matchingSend.id}
      `;

      correlated++;
    }

    return { correlated };
  }
);

const correlateReplies = new CronJob("challenge-reply-correlator", {
  title: "Correlate Challenge SMS Replies",
  every: "5m",
  endpoint: correlateRepliesHandler,
});
