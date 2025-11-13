import { api } from "encore.dev/api";
import db from "../db";
import type { SendNotificationRequest, NotificationQueueItem } from "./types";
import { sendPushToUser } from "../push/send";

export const sendNotification = api<SendNotificationRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/notifications/send" },
  async (req) => {
    const { user_id, title, message, notification_type, metadata } = req;

    const prefs = await db.queryRow<{
      notification_method: string;
      phone_number?: string;
      push_enabled?: boolean;
    }>`
      SELECT notification_method, phone_number, push_enabled
      FROM notification_preferences
      WHERE user_id = ${user_id}
    `;

    if (!prefs) {
      throw new Error("User notification preferences not found");
    }

    const now = new Date();

    if (prefs.notification_method === 'browser' || prefs.notification_method === 'both') {
      await db.exec`
        INSERT INTO notification_queue 
          (user_id, notification_type, title, message, scheduled_time, delivery_method, metadata)
        VALUES 
          (${user_id}, ${notification_type}, ${title}, ${message}, ${now}, 'browser', ${JSON.stringify(metadata || {})})
      `;
    }

    if ((prefs.notification_method === 'sms' || prefs.notification_method === 'both') && prefs.phone_number) {
      await db.exec`
        INSERT INTO notification_queue 
          (user_id, notification_type, title, message, scheduled_time, delivery_method, metadata)
        VALUES 
          (${user_id}, ${notification_type}, ${title}, ${message}, ${now}, 'sms', 
           ${JSON.stringify({ ...metadata, phone_number: prefs.phone_number })})
      `;
    }

    if (prefs.push_enabled !== false) {
      const url = getNotificationUrl(notification_type, metadata);
      await sendPushToUser(user_id, title, message, url);
    }

    return { success: true };
  }
);

function getNotificationUrl(notificationType: string, metadata?: Record<string, any>): string {
  switch (notificationType) {
    case 'morning_checkin':
      return '/morning-routine';
    case 'medication_reminder':
      return '/doctors-orders';
    case 'evening_reflection':
      return '/evening-routine';
    case 'mood_checkin':
      return '/mood';
    case 'nutrition_log':
      return '/diet-nutrition';
    default:
      return '/';
  }
}

interface GetPendingNotificationsRequest {
  user_id: string;
}

interface GetPendingNotificationsResponse {
  notifications: NotificationQueueItem[];
}

export const getPendingNotifications = api<GetPendingNotificationsRequest, GetPendingNotificationsResponse>(
  { expose: true, method: "GET", path: "/notifications/pending/:user_id" },
  async (req) => {
    const { user_id } = req;

    const notificationsQuery = await db.query<NotificationQueueItem>`
      SELECT id, user_id, notification_type, title, message, scheduled_time, 
             sent_at, delivery_method, status, metadata, error_message, created_at
      FROM notification_queue
      WHERE user_id = ${user_id}
        AND delivery_method = 'browser'
        AND status = 'pending'
        AND scheduled_time <= NOW()
      ORDER BY scheduled_time ASC
      LIMIT 10
    `;
    const notifications = [];
    for await (const notification of notificationsQuery) {
      notifications.push(notification);
    }

    if (notifications.length > 0) {
      const ids = notifications.map(n => n.id);
      await db.exec`
        UPDATE notification_queue
        SET status = 'sent', sent_at = NOW()
        WHERE id = ANY(${ids})
      `;
    }

    return { notifications };
  }
);

interface MarkNotificationReadRequest {
  notification_id: number;
}

export const markNotificationRead = api<MarkNotificationReadRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/notifications/mark-read" },
  async (req) => {
    const { notification_id } = req;

    await db.exec`
      UPDATE notification_queue
      SET status = 'sent', sent_at = NOW()
      WHERE id = ${notification_id}
    `;

    return { success: true };
  }
);
