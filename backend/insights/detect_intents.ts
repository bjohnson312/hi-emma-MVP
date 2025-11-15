import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { 
  IntentDetectionRequest, 
  IntentDetectionResponse, 
  DetectedInsight,
  IntentType,
  RoutineCompletion
} from "./types";

const openAIKey = secret("OpenAIKey");

async function getRoutineCompletion(userId: string): Promise<RoutineCompletion> {
  const morningPref = await db.queryRow<{ activity_count: number }>`
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE COALESCE(jsonb_array_length(activities), 0)
      END as activity_count
    FROM morning_routine_preferences
    WHERE user_id = ${userId} AND is_active = true
  `;

  const eveningCheckin = await db.queryRow<{ entry_count: number }>`
    SELECT COUNT(*) as entry_count
    FROM wellness_journal_entries
    WHERE user_id = ${userId}
      AND entry_type = 'evening_routine'
      AND created_at > NOW() - INTERVAL '7 days'
  `;

  const dietSetup = await db.queryRow<{ has_diet: boolean }>`
    SELECT COUNT(*) > 0 as has_diet
    FROM diet_preferences
    WHERE user_id = ${userId}
  `;

  const doctorsOrders = await db.queryRow<{ count: number }>`
    SELECT COUNT(*) as count
    FROM wellness_doctors_orders
    WHERE user_id = ${userId} AND active = true
  `;

  return {
    morningCompleted: (morningPref?.activity_count || 0) >= 3,
    eveningCompleted: (eveningCheckin?.entry_count || 0) >= 2,
    dietSetupComplete: dietSetup?.has_diet || false,
    doctorsOrdersCount: doctorsOrders?.count || 0
  };
}

function determineIntentPriority(completion: RoutineCompletion): IntentType[] {
  const priorities: IntentType[] = [];
  
  if (!completion.morningCompleted) {
    priorities.push("morning_routine");
  }
  
  if (!completion.eveningCompleted) {
    priorities.push("evening_routine");
  }
  
  if (!completion.dietSetupComplete) {
    priorities.push("diet_nutrition");
  }
  
  if (completion.doctorsOrdersCount === 0) {
    priorities.push("doctors_orders");
  }
  
  priorities.push("mood", "symptoms", "wellness_general");
  
  return priorities;
}

async function callAIForIntentDetection(
  userMessage: string, 
  emmaResponse: string,
  priorityIntents: IntentType[]
): Promise<Array<{ intentType: IntentType; extractedData: Record<string, any>; confidence: number; suggestionText?: string }>> {
  const systemPrompt = `You are an intent classifier for a wellness conversation. Analyze the user's message and Emma's response to detect actionable wellness insights.

Priority intent types (focus on these first): ${priorityIntents.slice(0, 3).join(", ")}

All intent types:
- morning_routine: Activities done or wanted in the morning (exercise, meditation, journaling, etc.)
- evening_routine: Evening wind-down activities, bedtime routines
- diet_nutrition: Food preferences, dietary restrictions, meals, nutrition goals
- doctors_orders: Medications, medical appointments, treatments, prescriptions
- mood: Emotional state, feelings, mental health check-ins
- symptoms: Physical symptoms, pain, discomfort, health issues
- wellness_general: General health observations, lifestyle insights

Rules:
1. ONLY detect intents if the user is clearly sharing actionable information
2. DO NOT detect intents if the user is just asking a question or making small talk
3. Confidence should be HIGH (>0.7) only if the information is explicit and actionable
4. Focus on the PRIORITY intents first - only detect others if very clear
5. For routine activities, only detect if they mention DOING or WANTING TO DO the activity
6. Return empty intents array if no clear intents detected

Return a JSON object with an 'intents' array like this:
{
  "intents": [
    {
      "intentType": "morning_routine",
      "extractedData": {"activity": "yoga", "duration": 20, "frequency": "daily"},
      "confidence": 0.9,
      "suggestionText": "I noticed you mentioned doing yoga this morning. Would you like me to add that to your morning routine?"
    }
  ]
}

User message: "${userMessage}"
Emma's response: "${emmaResponse}"`;

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
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze these messages for actionable wellness insights. Focus on: ${priorityIntents.slice(0, 3).join(", ")}` }
        ],
        temperature: 0.3,
        max_tokens: 500,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.error("AI API error:", response.statusText);
      return [];
    }

    const data: any = await response.json();
    const content = data.choices[0].message.content;
    
    const parsed = JSON.parse(content);
    
    if (parsed.intents && Array.isArray(parsed.intents)) {
      return parsed.intents;
    }
    
    return [];
  } catch (error) {
    console.error("Intent detection error:", error);
    return [];
  }
}

export const detectIntents = api<IntentDetectionRequest, IntentDetectionResponse>(
  { expose: true, method: "POST", path: "/insights/detect" },
  async (req) => {
    const { sessionId, userId, userMessage, emmaResponse } = req;

    const completion = await getRoutineCompletion(userId);
    const priorityIntents = determineIntentPriority(completion);

    console.log('🔍 Intent Detection:', {
      userId,
      completion,
      priorityIntents: priorityIntents.slice(0, 3),
      userMessage: userMessage.substring(0, 50)
    });

    const detectedIntents = await callAIForIntentDetection(
      userMessage,
      emmaResponse,
      priorityIntents
    );

    console.log(`✨ Detected ${detectedIntents.length} intents`);

    const insights: DetectedInsight[] = [];

    for (const intent of detectedIntents) {
      if (intent.confidence < 0.5) continue;

      const highConfidence = intent.confidence >= 0.8;
      
      if (!highConfidence && !priorityIntents.slice(0, 3).includes(intent.intentType)) {
        continue;
      }

      const inserted = await db.queryRow<DetectedInsight>`
        INSERT INTO conversation_detected_insights 
          (session_id, user_id, intent_type, extracted_data, confidence, emma_suggestion_text, status)
        VALUES 
          (${sessionId}, ${userId}, ${intent.intentType}, ${JSON.stringify(intent.extractedData)}, ${intent.confidence}, ${intent.suggestionText || null}, 'pending')
        RETURNING 
          id, session_id as "sessionId", user_id as "userId", 
          intent_type as "intentType", extracted_data as "extractedData", 
          confidence, emma_suggestion_text as "emmaSuggestionText", 
          status, created_at as "createdAt", applied_at as "appliedAt", 
          dismissed_at as "dismissedAt"
      `;

      if (inserted) {
        insights.push(inserted);
      }
    }

    return { insights };
  }
);
