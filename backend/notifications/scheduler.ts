import { CronJob } from "encore.dev/cron";
import { api } from "encore.dev/api";
import db from "../db";
import type { DoctorsOrder } from "../wellness/types";
import type { NotificationPreferences } from "./types";
import { sendPushToUser } from "../push/send";

export const checkMedicationRemindersHandler = api<void, void>(
  { expose: false, method: "POST", path: "/internal/check-medication-reminders" },
  async () => {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  const prefsQuery = await db.query<NotificationPreferences & { user_id: string; push_enabled?: boolean }>`
    SELECT user_id, medication_reminders_enabled, notification_method, phone_number, push_subscription, timezone, push_enabled
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
      if (!order.time_of_day) continue;
      
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

          const title = "💊 Medication Reminder from Emma";
          const dosageText = order.dosage ? ` (${order.dosage})` : '';
          const message = `Hi! Emma here 😊 It's time to take ${order.medication_name}${dosageText}. Tap here to mark it as taken!`;

          if (pref.push_enabled !== false) {
            await sendPushToUser(
              pref.user_id,
              title,
              message,
              '/doctors-orders',
              '/logo.png'
            );
          }

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

const checkMedicationReminders = new CronJob(
  "check-medication-reminders",
  {
    title: "Check Medication Reminders",
    every: "15m",
    endpoint: checkMedicationRemindersHandler,
  }
);

export const checkMorningRoutineRemindersHandler = api<void, void>(
  { expose: false, method: "POST", path: "/internal/check-morning-routine-reminders" },
  async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const prefsQuery = await db.query<NotificationPreferences & { user_id: string; push_enabled?: boolean }>`
    SELECT user_id, morning_routine_reminders_enabled, notification_method, phone_number, push_subscription, timezone, push_enabled
    FROM notification_preferences
    WHERE morning_routine_reminders_enabled = true
  `;
  
  const prefs = [];
  for await (const pref of prefsQuery) {
    prefs.push(pref);
  }

  for (const pref of prefs) {
    const routinePrefs = await db.queryRow<{ target_wake_time: string; reminder_time: string }>`
      SELECT target_wake_time, reminder_time
      FROM morning_routine_preferences
      WHERE user_id = ${pref.user_id}
    `;

    if (!routinePrefs || !routinePrefs.reminder_time) {
      continue;
    }

    const [reminderHour, reminderMinute] = routinePrefs.reminder_time.split(':').map(Number);

    if (currentHour === reminderHour && Math.abs(currentMinute - reminderMinute) <= 5) {
      const existingNotification = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count
        FROM notification_queue
        WHERE user_id = ${pref.user_id}
          AND notification_type = 'morning_routine'
          AND DATE(scheduled_time) = CURRENT_DATE
          AND EXTRACT(HOUR FROM scheduled_time) = ${reminderHour}
          AND status IN ('pending', 'sent')
      `;

      if (existingNotification && existingNotification.count > 0) {
        continue;
      }

      const scheduledTime = new Date();
      scheduledTime.setHours(reminderHour, reminderMinute, 0, 0);

      const title = "🌅 Morning Routine Reminder from Emma";
      const message = "Good morning! 🌞 Ready to start your day with your morning routine?";

      if (pref.push_enabled !== false) {
        await sendPushToUser(
          pref.user_id,
          title,
          message,
          '/morning-routine',
          '/logo.png'
        );
      }

      if (pref.notification_method === 'browser' || pref.notification_method === 'both') {
        await db.exec`
          INSERT INTO notification_queue 
            (user_id, notification_type, title, message, scheduled_time, delivery_method, metadata)
          VALUES 
            (${pref.user_id}, 'morning_routine', ${title}, ${message}, 
             ${scheduledTime}, 'browser', 
             ${JSON.stringify({ reminder_time: routinePrefs.reminder_time })})
        `;
      }

      if ((pref.notification_method === 'sms' || pref.notification_method === 'both') && pref.phone_number) {
        await db.exec`
          INSERT INTO notification_queue 
            (user_id, notification_type, title, message, scheduled_time, delivery_method, metadata)
          VALUES 
            (${pref.user_id}, 'morning_routine', ${title}, ${message}, 
             ${scheduledTime}, 'sms', 
             ${JSON.stringify({ 
               reminder_time: routinePrefs.reminder_time,
               phone_number: pref.phone_number 
             })})
        `;
      }
    }
  }
});

const checkMorningRoutineReminders = new CronJob(
  "check-morning-routine-reminders",
  {
    title: "Check Morning Routine Reminders",
    every: "5m",
    endpoint: checkMorningRoutineRemindersHandler,
  }
);

export const checkEveningRoutineRemindersHandler = api<void, void>(
  { expose: false, method: "POST", path: "/internal/check-evening-routine-reminders" },
  async () => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  const prefsQuery = await db.query<NotificationPreferences & { user_id: string; push_enabled?: boolean }>`
    SELECT user_id, evening_routine_reminders_enabled, notification_method, phone_number, push_subscription, timezone, push_enabled
    FROM notification_preferences
    WHERE evening_routine_reminders_enabled = true
  `;
  
  const prefs = [];
  for await (const pref of prefsQuery) {
    prefs.push(pref);
  }

  for (const pref of prefs) {
    const eveningRoutineTime = 21;

    if (currentHour === eveningRoutineTime && currentMinute <= 5) {
      const existingNotification = await db.queryRow<{ count: number }>`
        SELECT COUNT(*) as count
        FROM notification_queue
        WHERE user_id = ${pref.user_id}
          AND notification_type = 'evening_routine'
          AND DATE(scheduled_time) = CURRENT_DATE
          AND EXTRACT(HOUR FROM scheduled_time) = ${eveningRoutineTime}
          AND status IN ('pending', 'sent')
      `;

      if (existingNotification && existingNotification.count > 0) {
        continue;
      }

      const scheduledTime = new Date();
      scheduledTime.setHours(eveningRoutineTime, 0, 0, 0);

      const title = "🌙 Evening Check-in from Emma";
      const message = "Good evening! How was your day? Let's reflect together.";

      if (pref.push_enabled !== false) {
        await sendPushToUser(
          pref.user_id,
          title,
          message,
          '/evening-routine',
          '/logo.png'
        );
      }

      if (pref.notification_method === 'browser' || pref.notification_method === 'both') {
        await db.exec`
          INSERT INTO notification_queue 
            (user_id, notification_type, title, message, scheduled_time, delivery_method, metadata)
          VALUES 
            (${pref.user_id}, 'evening_routine', ${title}, ${message}, 
             ${scheduledTime}, 'browser', 
             ${JSON.stringify({})})
        `;
      }

      if ((pref.notification_method === 'sms' || pref.notification_method === 'both') && pref.phone_number) {
        await db.exec`
          INSERT INTO notification_queue 
            (user_id, notification_type, title, message, scheduled_time, delivery_method, metadata)
          VALUES 
            (${pref.user_id}, 'evening_routine', ${title}, ${message}, 
             ${scheduledTime}, 'sms', 
             ${JSON.stringify({ phone_number: pref.phone_number })})
        `;
      }
    }
  }
});

const checkEveningRoutineReminders = new CronJob(
  "check-evening-routine-reminders",
  {
    title: "Check Evening Routine Reminders",
    every: "15m",
    endpoint: checkEveningRoutineRemindersHandler,
  }
);
