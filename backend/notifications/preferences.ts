import { api } from "encore.dev/api";
import db from "../db";
import type { 
  NotificationPreferences, 
  UpdateNotificationPreferencesRequest,
  GetNotificationPreferencesRequest,
  RegisterPushSubscriptionRequest
} from "./types";

export const getPreferences = api<GetNotificationPreferencesRequest, NotificationPreferences>(
  { expose: true, method: "GET", path: "/notifications/preferences/:user_id" },
  async (req) => {
    const { user_id } = req;

    let prefs = await db.queryRow<NotificationPreferences>`
      SELECT id, user_id, morning_checkin_enabled, morning_checkin_time, 
             medication_reminders_enabled, evening_reflection_enabled, 
             evening_reflection_time, notification_method, phone_number, 
             push_subscription, timezone, created_at, updated_at
      FROM notification_preferences
      WHERE user_id = ${user_id}
    `;

    if (!prefs) {
      prefs = await db.queryRow<NotificationPreferences>`
        INSERT INTO notification_preferences (user_id)
        VALUES (${user_id})
        RETURNING id, user_id, morning_checkin_enabled, morning_checkin_time, 
                  medication_reminders_enabled, evening_reflection_enabled, 
                  evening_reflection_time, notification_method, phone_number, 
                  push_subscription, timezone, created_at, updated_at
      `;
    }

    return prefs!;
  }
);

export const updatePreferences = api<UpdateNotificationPreferencesRequest, NotificationPreferences>(
  { expose: true, method: "PUT", path: "/notifications/preferences" },
  async (req) => {
    const { user_id } = req;

    const current = await db.queryRow<NotificationPreferences>`
      SELECT id, user_id, morning_checkin_enabled, morning_checkin_time, 
             medication_reminders_enabled, evening_reflection_enabled, 
             evening_reflection_time, notification_method, phone_number, 
             push_subscription, timezone, created_at, updated_at
      FROM notification_preferences
      WHERE user_id = ${user_id}
    `;

    if (!current) {
      throw new Error("Notification preferences not found");
    }

    const morning_checkin_enabled = req.morning_checkin_enabled ?? current.morning_checkin_enabled;
    const morning_checkin_time = req.morning_checkin_time ?? current.morning_checkin_time;
    const medication_reminders_enabled = req.medication_reminders_enabled ?? current.medication_reminders_enabled;
    const evening_reflection_enabled = req.evening_reflection_enabled ?? current.evening_reflection_enabled;
    const evening_reflection_time = req.evening_reflection_time ?? current.evening_reflection_time;
    const notification_method = req.notification_method ?? current.notification_method;
    const phone_number = req.phone_number ?? current.phone_number;
    const timezone = req.timezone ?? current.timezone;

    const result = await db.queryRow<NotificationPreferences>`
      UPDATE notification_preferences
      SET morning_checkin_enabled = ${morning_checkin_enabled},
          morning_checkin_time = ${morning_checkin_time},
          medication_reminders_enabled = ${medication_reminders_enabled},
          evening_reflection_enabled = ${evening_reflection_enabled},
          evening_reflection_time = ${evening_reflection_time},
          notification_method = ${notification_method},
          phone_number = ${phone_number},
          timezone = ${timezone},
          updated_at = NOW()
      WHERE user_id = ${user_id}
      RETURNING id, user_id, morning_checkin_enabled, morning_checkin_time, 
                medication_reminders_enabled, evening_reflection_enabled, 
                evening_reflection_time, notification_method, phone_number, 
                push_subscription, timezone, created_at, updated_at
    `;

    return result!;
  }
);

export const registerPushSubscription = api<RegisterPushSubscriptionRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/notifications/push-subscription" },
  async (req) => {
    const { user_id, subscription } = req;

    await db.exec`
      UPDATE notification_preferences
      SET push_subscription = ${JSON.stringify(subscription)},
          updated_at = NOW()
      WHERE user_id = ${user_id}
    `;

    return { success: true };
  }
);
