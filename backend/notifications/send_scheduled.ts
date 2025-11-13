import { api } from "encore.dev/api";
import db from "../db";
import { sendPushToUser } from "../push/send";

export const sendMorningCheckinReminder = api(
  { expose: false, method: "POST", path: "/internal/send-morning-checkin" },
  async (req: { userId: string }): Promise<{ success: boolean }> => {
    const { userId } = req;

    const title = "🌅 Good Morning from Emma!";
    const message = "Time to start your day with a morning check-in. Let's see how you're feeling today!";
    
    await sendPushToUser(userId, title, message, '/morning-routine');
    
    return { success: true };
  }
);

export const sendEveningReflectionReminder = api(
  { expose: false, method: "POST", path: "/internal/send-evening-reflection" },
  async (req: { userId: string }): Promise<{ success: boolean }> => {
    const { userId } = req;

    const title = "🌙 Evening Reflection with Emma";
    const message = "How was your day? Let's take a moment to reflect on your evening routine.";
    
    await sendPushToUser(userId, title, message, '/evening-routine');
    
    return { success: true };
  }
);

export const sendMoodCheckinReminder = api(
  { expose: false, method: "POST", path: "/internal/send-mood-checkin" },
  async (req: { userId: string }): Promise<{ success: boolean }> => {
    const { userId } = req;

    const title = "😊 How Are You Feeling?";
    const message = "Emma here! Let's check in on your emotional wellbeing. How are you feeling right now?";
    
    await sendPushToUser(userId, title, message, '/mood');
    
    return { success: true };
  }
);

export const sendNutritionLogReminder = api(
  { expose: false, method: "POST", path: "/internal/send-nutrition-log" },
  async (req: { userId: string }): Promise<{ success: boolean }> => {
    const { userId } = req;

    const title = "🍎 Nutrition Log Reminder";
    const message = "Don't forget to log your meals today! Emma is here to help you track your nutrition.";
    
    await sendPushToUser(userId, title, message, '/diet-nutrition');
    
    return { success: true };
  }
);
