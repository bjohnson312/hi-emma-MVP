import { api } from "encore.dev/api";
import db from "../db";
import type { ApplySuggestionRequest, ApplySuggestionResponse } from "./types";
import { addFromConversation } from "../wellness_journal/add_manual";
import { addActivity } from "../morning/add_activity";

export const applySuggestion = api<ApplySuggestionRequest, ApplySuggestionResponse>(
  { expose: true, method: "POST", path: "/insights/apply" },
  async (req) => {
    const { suggestionId, userId } = req;

    const suggestion = await db.queryRow<{
      id: string;
      user_id: string;
      intent_type: string;
      extracted_data: Record<string, any>;
      status: string;
    }>`
      SELECT id, user_id, intent_type, extracted_data, status
      FROM conversation_detected_insights
      WHERE id = ${suggestionId} AND user_id = ${userId}
    `;

    if (!suggestion) {
      return { success: false, message: "Suggestion not found" };
    }

    if (suggestion.status !== "pending") {
      return { success: false, message: "Suggestion already processed" };
    }

    const data = suggestion.extracted_data;

    try {
      switch (suggestion.intent_type) {
        case "morning_routine":
          await applyMorningRoutine(userId, data);
          break;
        
        case "evening_routine":
          await applyEveningRoutine(userId, data);
          break;
        
        case "diet_nutrition":
          await applyDietNutrition(userId, data);
          break;
        
        case "doctors_orders":
          await applyDoctorsOrders(userId, data);
          break;
        
        case "mood":
          await applyMoodLog(userId, data);
          break;
        
        case "symptoms":
          await applySymptoms(userId, data);
          break;
        
        case "wellness_general":
          await applyWellnessGeneral(userId, data);
          break;
        
        default:
          return { success: false, message: `Unknown intent type: ${suggestion.intent_type}` };
      }

      await db.exec`
        UPDATE conversation_detected_insights
        SET status = 'applied', applied_at = NOW()
        WHERE id = ${suggestionId}
      `;

      return { success: true, message: "Suggestion applied successfully" };
    } catch (error) {
      console.error("Error applying suggestion:", error);
      return { success: false, message: `Failed to apply suggestion: ${error}` };
    }
  }
);

async function applyMorningRoutine(userId: string, data: Record<string, any>): Promise<void> {
  try {
    await addActivity({
      user_id: userId,
      activity: {
        id: `activity-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        name: data.activity || data.name,
        duration_minutes: data.duration || 10,
        icon: data.icon || "⭐",
        description: data.description || ""
      }
    });
    
    console.log('✅ Applied morning routine activity:', data.activity || data.name);
    
  } catch (error: any) {
    if (error.message?.includes("already in your routine")) {
      console.log('ℹ️  Activity already exists, skipping');
      return;
    }
    
    if (error.message?.includes("No active morning routine found")) {
      console.log('ℹ️  No routine found, creating basic routine first');
      await db.exec`
        INSERT INTO morning_routine_preferences (user_id, routine_name, activities, is_active)
        VALUES (
          ${userId}, 
          'My Morning Routine',
          ${JSON.stringify([{
            id: `activity-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            name: data.activity || data.name,
            duration_minutes: data.duration || 10,
            icon: data.icon || "⭐",
            description: data.description || ""
          }])}::jsonb,
          true
        )
      `;
      console.log('✅ Created new routine with activity');
      return;
    }
    
    throw error;
  }
}

async function applyEveningRoutine(userId: string, data: Record<string, any>): Promise<void> {
  await addFromConversation({
    user_id: userId,
    conversation_text: `Evening routine: ${data.activity || data.description || JSON.stringify(data)}`,
    session_type: "evening_routine",
    title: "Evening Routine",
    tags: ["evening_routine", "routine"]
  });
}

async function applyDietNutrition(userId: string, data: Record<string, any>): Promise<void> {
  const existing = await db.queryRow<{ id: number }>`
    SELECT id FROM diet_preferences WHERE user_id = ${userId}
  `;

  const preferences: Record<string, any> = {};
  
  if (data.restriction) preferences.dietary_restrictions = [data.restriction];
  if (data.restrictions && Array.isArray(data.restrictions)) {
    preferences.dietary_restrictions = data.restrictions;
  }
  if (data.goal) preferences.health_goals = [data.goal];
  if (data.goals && Array.isArray(data.goals)) preferences.health_goals = data.goals;
  if (data.allergies) preferences.allergies = Array.isArray(data.allergies) ? data.allergies : [data.allergies];

  if (existing) {
    await db.exec`
      UPDATE diet_preferences
      SET 
        dietary_restrictions = COALESCE(dietary_restrictions, '[]'::jsonb) || ${JSON.stringify(preferences.dietary_restrictions || [])}::jsonb,
        health_goals = COALESCE(health_goals, '[]'::jsonb) || ${JSON.stringify(preferences.health_goals || [])}::jsonb,
        allergies = COALESCE(allergies, '[]'::jsonb) || ${JSON.stringify(preferences.allergies || [])}::jsonb,
        updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  } else {
    await db.exec`
      INSERT INTO diet_preferences (user_id, dietary_restrictions, health_goals, allergies)
      VALUES (
        ${userId}, 
        ${JSON.stringify(preferences.dietary_restrictions || [])},
        ${JSON.stringify(preferences.health_goals || [])},
        ${JSON.stringify(preferences.allergies || [])}
      )
    `;
  }

  await addFromConversation({
    user_id: userId,
    conversation_text: `Diet preferences updated: ${JSON.stringify(data)}`,
    session_type: "diet_nutrition",
    title: "Diet & Nutrition Update",
    tags: ["diet", "nutrition", "preferences"]
  });
}

async function applyDoctorsOrders(userId: string, data: Record<string, any>): Promise<void> {
  if (data.medication || data.name) {
    await db.exec`
      INSERT INTO wellness_doctors_orders 
        (user_id, order_type, description, medication_name, dosage, frequency, active)
      VALUES (
        ${userId},
        'medication',
        ${data.description || `${data.medication || data.name} - ${data.dosage || ''} ${data.frequency || ''}`},
        ${data.medication || data.name},
        ${data.dosage || null},
        ${data.frequency || 'daily'},
        true
      )
    `;
  }

  await addFromConversation({
    user_id: userId,
    conversation_text: `Doctor's orders: ${data.medication || data.name} - ${data.dosage || ''} ${data.frequency || ''}`,
    session_type: "doctors_orders",
    title: "Doctor's Orders",
    tags: ["doctors_orders", "medication", "health"]
  });
}

async function applyMoodLog(userId: string, data: Record<string, any>): Promise<void> {
  const moodValue = data.mood || data.feeling || "neutral";
  const intensity = data.intensity || 5;
  
  await db.exec`
    INSERT INTO wellness_mood_logs (user_id, mood, intensity, notes)
    VALUES (${userId}, ${moodValue}, ${intensity}, ${data.notes || data.description || ''})
  `;

  await addFromConversation({
    user_id: userId,
    conversation_text: `Mood: ${moodValue} (${intensity}/10)${data.notes ? ` - ${data.notes}` : ''}`,
    session_type: "mood",
    title: "Mood Check-in",
    tags: ["mood", "emotional_health"]
  });
}

async function applySymptoms(userId: string, data: Record<string, any>): Promise<void> {
  await addFromConversation({
    user_id: userId,
    conversation_text: `Symptoms: ${data.symptom || data.description || JSON.stringify(data)}`,
    session_type: "symptoms",
    title: "Symptom Log",
    tags: ["symptoms", "health", "wellness"]
  });
}

async function applyWellnessGeneral(userId: string, data: Record<string, any>): Promise<void> {
  await addFromConversation({
    user_id: userId,
    conversation_text: data.note || data.description || JSON.stringify(data),
    session_type: "general",
    title: "Wellness Note",
    tags: ["wellness", "general"]
  });
}
