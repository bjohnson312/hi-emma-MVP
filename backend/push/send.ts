import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { SendPushRequest, PushSubscriptionRecord } from "./types";
import webpush from "web-push";

const vapidPublicKey = secret("VAPIDPublicKey");
const vapidPrivateKey = secret("VAPIDPrivateKey");
const vapidEmail = secret("VAPIDEmail");

webpush.setVapidDetails(
  vapidEmail(),
  vapidPublicKey(),
  vapidPrivateKey()
);

export const sendPush = api(
  { method: "POST", path: "/push/send", expose: true },
  async (req: SendPushRequest): Promise<{ success: boolean; sent: number; failed: number }> => {
    const { userId, title, body, icon = "/logo.png", badge = "/logo.png", url = "/", tag = "emma-notification" } = req;

    const subscriptionsQuery = await db.query<PushSubscriptionRecord>`
      SELECT id, user_id, endpoint, p256dh, auth, user_agent, created_at, last_used
      FROM push_subscriptions
      WHERE user_id = ${userId}
    `;

    const subscriptions = [];
    for await (const sub of subscriptionsQuery) {
      subscriptions.push(sub);
    }

    if (subscriptions.length === 0) {
      return { success: false, sent: 0, failed: 0 };
    }

    const payload = JSON.stringify({
      title,
      body,
      icon,
      badge,
      url,
      tag,
      timestamp: Date.now()
    });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        };

        await webpush.sendNotification(pushSubscription, payload);
        
        await db.exec`
          UPDATE push_subscriptions
          SET last_used = NOW()
          WHERE id = ${sub.id}
        `;
        
        sent++;
      } catch (error: any) {
        console.error(`Failed to send push to ${sub.endpoint}:`, error);
        
        if (error.statusCode === 410 || error.statusCode === 404) {
          await db.exec`
            DELETE FROM push_subscriptions
            WHERE id = ${sub.id}
          `;
        }
        
        failed++;
      }
    }

    return { success: sent > 0, sent, failed };
  }
);

export async function sendPushToUser(
  userId: string,
  title: string,
  body: string,
  url?: string,
  icon?: string
): Promise<void> {
  try {
    await sendPush({
      userId,
      title,
      body,
      url,
      icon
    });
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
}
