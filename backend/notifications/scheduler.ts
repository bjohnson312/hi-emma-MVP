import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import db from "../db";
import type { DoctorsOrder } from "../wellness/types";
import type { NotificationPreferences } from "./types";

export const checkMedicationRemindersHandler = api<void, void>(
  { expose: false, method: "POST", path: "/internal/check-medication-reminders" },
  async () => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const prefsQuery = await db.query<NotificationPreferences & { user_id: string }>`
    SELECT user_id, medication_reminders_enabled, notification_method, phone_number, push_subscription, timezone
    FROM notification_preferences
    WHERE medication_reminders_enabled = true
  `;
  
  const prefs = [];
  for await (const pref of prefsQuery) {
    prefs.push(pref);
  }

  for (const pref of prefs) {
    const ordersQuery = await db.query<DoctorsOrder>`
      SELECT id, user_id, medication_name, dosage, time_of_day, start_date, end_date
      FROM doctors_orders
      WHERE user_id = ${pref.user_id} 
        AND active = true
        AND start_date <= CURRENT_DATE
        AND (end_date IS NULL OR end_date >= CURRENT_DATE)
    `;
    
    const orders = [];
    for await (const order of ordersQuery) {
      orders.push(order);
    }

    for (const order of orders) {
      for (const timeSlot of order.time_of_day) {
        const [hours, minutes] = timeSlot.split(':');
        const reminderTime = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        
        if (currentTime === reminderTime || 
            (parseInt(currentTime.split(':')[0]) === parseInt(hours) && 
             Math.abs(parseInt(currentTime.split(':')[1]) - parseInt(minutes)) <= 15)) {
          
          const existingNotification = await db.queryRow<{ count: number }>`
            SELECT COUNT(*) as count
            FROM notification_queue
            WHERE user_id = ${pref.user_id}
              AND notification_type = 'medication_reminder'
              AND metadata->>'doctors_order_id' = ${order.id.toString()}
              AND DATE(scheduled_time) = CURRENT_DATE
              AND EXTRACT(HOUR FROM scheduled_time) = ${parseInt(hours)}
              AND status IN ('pending', 'sent')
          `;

          if (existingNotification && existingNotification.count > 0) {
            continue;
          }

          const scheduledTime = new Date();
          scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          const title = "💊 Medication Reminder";
          const message = `Time to take ${order.medication_name} (${order.dosage})`;

          if (pref.notification_method === 'browser' || pref.notification_method === 'both') {
            await db.exec`
              INSERT INTO notification_queue 
                (user_id, notification_type, title, message, scheduled_time, delivery_method, metadata)
              VALUES 
                (${pref.user_id}, 'medication_reminder', ${title}, ${message}, 
                 ${scheduledTime}, 'browser', 
                 ${JSON.stringify({ doctors_order_id: order.id, medication_name: order.medication_name })})
            `;
          }

          if ((pref.notification_method === 'sms' || pref.notification_method === 'both') && pref.phone_number) {
            await db.exec`
              INSERT INTO notification_queue 
                (user_id, notification_type, title, message, scheduled_time, delivery_method, metadata)
              VALUES 
                (${pref.user_id}, 'medication_reminder', ${title}, ${message}, 
                 ${scheduledTime}, 'sms', 
                 ${JSON.stringify({ 
                   doctors_order_id: order.id, 
                   medication_name: order.medication_name,
                   phone_number: pref.phone_number 
                 })})
            `;
          }
        }
      }
    }
  }
});

// Temporarily disabled
// const checkMedicationReminders = new CronJob("check-medication-reminders", {
//   title: "Check Medication Reminders",
//   schedule: "*/15 * * * *",
//   endpoint: checkMedicationRemindersHandler,
// });

export const processPendingNotificationsHandler = api<void, void>(
  { expose: false, method: "POST", path: "/internal/process-pending-notifications" },
  async () => {
  const pendingNotificationsQuery = await db.query<{
    id: number;
    user_id: string;
    title: string;
    message: string;
    delivery_method: string;
    metadata: Record<string, any>;
  }>`
    SELECT id, user_id, title, message, delivery_method, metadata
    FROM notification_queue
    WHERE status = 'pending'
      AND scheduled_time <= NOW()
    ORDER BY scheduled_time ASC
    LIMIT 100
  `;
  
  const pendingNotifications = [];
  for await (const notification of pendingNotificationsQuery) {
    pendingNotifications.push(notification);
  }

  for (const notification of pendingNotifications) {
    try {
      if (notification.delivery_method === 'sms') {
        const { sendSMS } = await import('./sms');
        const phoneNumber = notification.metadata?.phone_number;
        
        if (phoneNumber) {
          try {
            await sendSMS(phoneNumber, notification.message);
          } catch (error) {
            console.warn('SMS sending skipped (Twilio not configured):', error);
          }
        }
      }
      
      await db.exec`
        UPDATE notification_queue
        SET status = 'sent', sent_at = NOW()
        WHERE id = ${notification.id}
      `;
    } catch (error) {
      await db.exec`
        UPDATE notification_queue
        SET status = 'failed', 
            error_message = ${error instanceof Error ? error.message : 'Unknown error'}
        WHERE id = ${notification.id}
      `;
    }
  }
});

// Temporarily disabled
// const processPendingNotifications = new CronJob("process-pending-notifications", {
//   title: "Process Pending Notifications",
//   schedule: "*/5 * * * *",
//   endpoint: processPendingNotificationsHandler,
// });
