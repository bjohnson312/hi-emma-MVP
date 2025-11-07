import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { GetDailySummaryRequest, GenerateDailySummaryResponse, DailySummaryData, WellnessJournalEntry } from "./types";
import { createJournalEntry } from "./auto_create";

const openAIKey = secret("OpenAIKey");

export const generateDailySummary = api<GetDailySummaryRequest, GenerateDailySummaryResponse>(
  { expose: true, method: "POST", path: "/wellness_journal/generate-daily-summary" },
  async (req) => {
    const { user_id, date = new Date() } = req;

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const data = await gatherDailyData(user_id, targetDate, nextDay);

    const existingSummary = await db.queryRow<{ id: number }>`
      SELECT id 
      FROM wellness_journal_entries
      WHERE user_id = ${user_id} 
        AND entry_date = ${targetDate}
        AND entry_type = 'daily_summary'
    `;

    if (existingSummary) {
      const summary = await db.queryRow<WellnessJournalEntry>`
        SELECT id, user_id, entry_date, entry_type, title, content, mood_rating,
               energy_level, sleep_quality, tags, metadata, source_type, source_id,
               ai_generated, created_at, updated_at
        FROM wellness_journal_entries
        WHERE id = ${existingSummary.id}
      `;
      return { summary: summary!, data };
    }

    const aiSummary = await generateAISummary(data, targetDate);

    const summary = await createJournalEntry({
      user_id,
      entry_date: targetDate,
      entry_type: "daily_summary",
      title: `Daily Summary - ${targetDate.toLocaleDateString()}`,
      content: aiSummary.content,
      mood_rating: aiSummary.avgMood,
      energy_level: aiSummary.avgEnergy,
      sleep_quality: data.morning_routine?.sleep_quality,
      tags: aiSummary.tags,
      metadata: {
        total_meals: data.meals.length,
        total_medications: data.medications.length,
        mood_logs_count: data.mood_logs.length,
        had_morning_routine: !!data.morning_routine,
        had_evening_routine: !!data.evening_routine
      },
      ai_generated: true
    });

    return { summary, data };
  }
);

async function gatherDailyData(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DailySummaryData> {
  const morningRoutine = await db.queryRow<any>`
    SELECT sleep_quality, selected_action, notes
    FROM morning_routine_logs
    WHERE user_id = ${userId} 
      AND date >= ${startDate} 
      AND date < ${endDate}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const eveningRoutine = await db.queryRow<any>`
    SELECT wind_down_activities, screen_time_minutes, bedtime
    FROM evening_routine_logs
    WHERE user_id = ${userId} 
      AND date >= ${startDate} 
      AND date < ${endDate}
    ORDER BY created_at DESC
    LIMIT 1
  `;

  const moodLogsQuery = await db.query<any>`
    SELECT mood_rating, energy_level, stress_level, notes
    FROM mood_logs
    WHERE user_id = ${userId} 
      AND date >= ${startDate} 
      AND date < ${endDate}
    ORDER BY date ASC
  `;
  const moodLogs = [];
  for await (const log of moodLogsQuery) {
    moodLogs.push(log);
  }

  const mealsQuery = await db.query<any>`
    SELECT meal_type, description, energy_level
    FROM diet_nutrition_logs
    WHERE user_id = ${userId} 
      AND date >= ${startDate} 
      AND date < ${endDate}
    ORDER BY date ASC
  `;
  const meals = [];
  for await (const meal of mealsQuery) {
    meals.push(meal);
  }

  const medicationsQuery = await db.query<any>`
    SELECT ml.taken_at, do_.medication_name
    FROM medication_logs ml
    LEFT JOIN doctors_orders do_ ON ml.doctors_order_id = do_.id
    WHERE ml.user_id = ${userId} 
      AND ml.taken_at >= ${startDate} 
      AND ml.taken_at < ${endDate}
    ORDER BY ml.taken_at ASC
  `;
  const medications = [];
  for await (const med of medicationsQuery) {
    medications.push(med);
  }

  const conversationsQuery = await db.query<{ user_message: string; emma_response: string }>`
    SELECT user_message, emma_response
    FROM conversation_history
    WHERE user_id = ${userId}
      AND created_at >= ${startDate}
      AND created_at < ${endDate}
    ORDER BY created_at ASC
  `;
  const conversations = [];
  for await (const conv of conversationsQuery) {
    conversations.push(conv);
  }

  const conversationHighlights = conversations
    .filter(c => c.user_message && c.user_message.length > 20)
    .map(c => c.user_message)
    .slice(0, 5);

  return {
    date: startDate,
    morning_routine: morningRoutine ? {
      sleep_quality: morningRoutine.sleep_quality,
      selected_action: morningRoutine.selected_action,
      notes: morningRoutine.notes
    } : undefined,
    evening_routine: eveningRoutine ? {
      wind_down_activities: eveningRoutine.wind_down_activities,
      screen_time_minutes: eveningRoutine.screen_time_minutes,
      bedtime: eveningRoutine.bedtime
    } : undefined,
    mood_logs: moodLogs.map(m => ({
      mood_rating: m.mood_rating,
      energy_level: m.energy_level,
      stress_level: m.stress_level,
      notes: m.notes
    })),
    meals: meals.map(m => ({
      meal_type: m.meal_type,
      description: m.description,
      energy_level: m.energy_level
    })),
    medications: medications.map(m => ({
      medication_name: m.medication_name,
      taken_at: m.taken_at
    })),
    conversation_highlights: conversationHighlights
  };
}

async function generateAISummary(
  data: DailySummaryData,
  date: Date
): Promise<{ content: string; avgMood?: number; avgEnergy?: number; tags: string[] }> {
  const dataPoints: string[] = [];
  const tags: string[] = ["daily-summary"];

  if (data.morning_routine) {
    dataPoints.push(`Sleep quality: ${data.morning_routine.sleep_quality}`);
    dataPoints.push(`Morning activity: ${data.morning_routine.selected_action}`);
    if (data.morning_routine.notes) {
      dataPoints.push(`Morning notes: ${data.morning_routine.notes}`);
    }
    tags.push("morning");
  }

  if (data.mood_logs.length > 0) {
    const avgMood = data.mood_logs.reduce((sum, m) => sum + m.mood_rating, 0) / data.mood_logs.length;
    dataPoints.push(`Average mood: ${avgMood.toFixed(1)}/10`);
    data.mood_logs.forEach((m, i) => {
      if (m.notes) dataPoints.push(`Mood ${i + 1}: ${m.notes}`);
    });
    tags.push("mood");
  }

  if (data.meals.length > 0) {
    dataPoints.push(`Meals: ${data.meals.map(m => `${m.meal_type} - ${m.description}`).join(", ")}`);
    tags.push("nutrition");
  }

  if (data.medications.length > 0) {
    dataPoints.push(`Medications taken: ${data.medications.map(m => m.medication_name).join(", ")}`);
    tags.push("medication");
  }

  if (data.evening_routine) {
    if (data.evening_routine.wind_down_activities) {
      dataPoints.push(`Evening wind-down: ${data.evening_routine.wind_down_activities.join(", ")}`);
    }
    if (data.evening_routine.bedtime) {
      dataPoints.push(`Bedtime: ${data.evening_routine.bedtime}`);
    }
    tags.push("evening");
  }

  if (data.conversation_highlights && data.conversation_highlights.length > 0) {
    dataPoints.push(`Key conversation topics: ${data.conversation_highlights.slice(0, 3).join("; ")}`);
    tags.push("conversation");
  }

  if (dataPoints.length === 0) {
    return {
      content: "No wellness data logged for this day.",
      tags: ["daily-summary", "no-activity"]
    };
  }

  const prompt = `Create a brief, warm, and personalized daily wellness summary (2-3 paragraphs) based on this data:

${dataPoints.join("\n")}

Write as if you're a caring wellness companion reflecting on the user's day. Focus on:
- Overall wellness patterns
- Positive highlights
- Gentle observations about routines
- Encouraging tone

Keep it concise and personal.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIKey()}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are Emma, a warm and caring wellness companion. Write personalized daily summaries."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.statusText}`);
    }

    const aiResponse: any = await response.json();
    const content = aiResponse.choices[0].message.content;

    const avgMood = data.mood_logs.length > 0
      ? data.mood_logs.reduce((sum, m) => sum + m.mood_rating, 0) / data.mood_logs.length
      : undefined;

    const avgEnergy = data.mood_logs.filter(m => m.energy_level).length > 0
      ? data.mood_logs.filter(m => m.energy_level).reduce((sum, m) => sum + (m.energy_level || 0), 0) / 
        data.mood_logs.filter(m => m.energy_level).length
      : undefined;

    return {
      content,
      avgMood: avgMood ? Math.round(avgMood * 10) / 10 : undefined,
      avgEnergy: avgEnergy ? Math.round(avgEnergy * 10) / 10 : undefined,
      tags
    };
  } catch (error) {
    console.error("AI summary generation failed:", error);
    return {
      content: dataPoints.join("\n\n"),
      tags
    };
  }
}
