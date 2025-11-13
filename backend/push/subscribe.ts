import { api } from "encore.dev/api";
import db from "../db";
import type { SubscribeRequest } from "./types";

export const subscribe = api(
  { method: "POST", path: "/push/subscribe", expose: true },
  async (req: SubscribeRequest): Promise<{ success: boolean }> => {
    const { userId, subscription, userAgent } = req;

    await db.exec`
      INSERT INTO push_subscriptions (
        user_id,
        endpoint,
        p256dh,
        auth,
        user_agent,
        last_used
      ) VALUES (
        ${userId},
        ${subscription.endpoint},
        ${subscription.keys.p256dh},
        ${subscription.keys.auth},
        ${userAgent || null},
        NOW()
      )
      ON CONFLICT (user_id, endpoint)
      DO UPDATE SET
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        last_used = NOW()
    `;

    return { success: true };
  }
);
