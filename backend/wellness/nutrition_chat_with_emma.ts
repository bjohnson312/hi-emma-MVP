import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { ChatRequest, ChatResponse } from "../conversation/types";
import { buildMemoryContext } from "../conversation/memory";
import { trackInteraction, getBehaviorPatterns } from "../profile/personalization";

const openAIKey = secret("OpenAIKey");

interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface MealLogAction {
  meal_type: "breakfast" | "lunch" | "dinner" | "snack";
  description: string;
  water_intake_oz?: number;
}

interface GoalUpdateAction {
  calorie_target?: number;
  protein_target_g?: number;
  carbs_target_g?: number;
  fat_target_g?: number;
}

async function callAI(messages: AIMessage[]): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${openAIKey()}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data.choices[0].message.content;
}

export const nutritionChat = api<ChatRequest, ChatResponse>(
  { expose: true, method: "POST", path: "/wellness/nutrition-chat" },
  async (req) => {
    const { user_id, session_type, user_message, session_id } = req;

    await trackInteraction(user_id);

    const profile = await db.queryRow<{
      name: string;
      interaction_count?: number;
    }>`
      SELECT name, interaction_count
      FROM user_profiles
      WHERE user_id = ${user_id}
    `;

    const nutritionPlan = await db.queryRow<{
      goals: string[];
      dietary_preferences?: string;
      calorie_target?: number;
      protein_target_g?: number;
      carbs_target_g?: number;
      fat_target_g?: number;
    }>`
      SELECT goals, dietary_preferences, calorie_target, protein_target_g, carbs_target_g, fat_target_g
      FROM nutrition_plans
      WHERE user_id = ${user_id} AND active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const todayMeals = await db.queryAll<{
      meal_type: string;
      description: string;
      calories?: number;
    }>`
      SELECT meal_type, description, calories
      FROM diet_nutrition_logs
      WHERE user_id = ${user_id} AND date >= CURRENT_DATE
      ORDER BY created_at
    `;

    let session;
    if (session_id) {
      session = await db.queryRow<{ id: string }>`
        SELECT id FROM conversation_sessions WHERE id = ${session_id}
      `;
    }
    if (!session) {
      const newSession = await db.queryRow<{ id: string }>`
        INSERT INTO conversation_sessions (user_id, session_type, context)
        VALUES (${user_id}, 'nutrition', ${JSON.stringify({})})
        RETURNING id
      `;
      session = newSession!;
    }

    const recentHistory = await db.queryAll<{
      user_message: string;
      emma_response: string;
    }>`
      SELECT user_message, emma_response
      FROM conversation_history
      WHERE user_id = ${user_id} AND conversation_type = 'nutrition'
      ORDER BY created_at DESC
      LIMIT 8
    `;

    const memoryContext = await buildMemoryContext(user_id);
    const behaviorPatterns = await getBehaviorPatterns(user_id);

    const systemPrompt = buildNutritionSystemPrompt(
      profile?.name || "there",
      nutritionPlan,
      todayMeals,
      memoryContext,
      behaviorPatterns,
      profile?.interaction_count
    );

    const conversationHistory: AIMessage[] = [
      { role: "system", content: systemPrompt }
    ];

    [...recentHistory].reverse().forEach(entry => {
      conversationHistory.push({
        role: "user",
        content: entry.user_message
      });
      conversationHistory.push({
        role: "assistant",
        content: entry.emma_response
      });
    });

    conversationHistory.push({
      role: "user",
      content: user_message
    });

    const emmaReply = await callAI(conversationHistory);

    const mealLogMatch = emmaReply.match(/LOG_MEAL:\s*\{(.+?)\}/s);
    const goalUpdateMatch = emmaReply.match(/UPDATE_GOALS:\s*\{(.+?)\}/s);
    let cleanedReply = emmaReply;
    let mealLogged = false;
    let goalsUpdated = false;

    if (mealLogMatch) {
      try {
        const mealData: MealLogAction = JSON.parse(`{${mealLogMatch[1]}}`);
        await db.exec`
          INSERT INTO diet_nutrition_logs 
            (user_id, meal_type, description, water_intake_oz, meal_time)
          VALUES 
            (${user_id}, ${mealData.meal_type}, ${mealData.description}, 
             ${mealData.water_intake_oz || null}, NOW())
        `;
        mealLogged = true;
        cleanedReply = emmaReply.replace(/LOG_MEAL:\s*\{.+?\}/s, '').trim();
      } catch (error) {
        console.error("Failed to log meal:", error);
      }
    }

    if (goalUpdateMatch) {
      try {
        const goalData: GoalUpdateAction = JSON.parse(`{${goalUpdateMatch[1]}}`);
        
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (goalData.calorie_target !== undefined) {
          updates.push(`calorie_target = $${paramIndex++}`);
          values.push(goalData.calorie_target);
        }
        if (goalData.protein_target_g !== undefined) {
          updates.push(`protein_target_g = $${paramIndex++}`);
          values.push(goalData.protein_target_g);
        }
        if (goalData.carbs_target_g !== undefined) {
          updates.push(`carbs_target_g = $${paramIndex++}`);
          values.push(goalData.carbs_target_g);
        }
        if (goalData.fat_target_g !== undefined) {
          updates.push(`fat_target_g = $${paramIndex++}`);
          values.push(goalData.fat_target_g);
        }

        if (updates.length > 0) {
          updates.push(`updated_at = NOW()`);
          const query = `UPDATE nutrition_plans SET ${updates.join(', ')} WHERE user_id = $${paramIndex} AND active = true`;
          values.push(user_id);
          await db.rawExec(query, ...values);
          goalsUpdated = true;
        }

        cleanedReply = emmaReply.replace(/UPDATE_GOALS:\s*\{.+?\}/s, '').trim();
      } catch (error) {
        console.error("Failed to update goals:", error);
      }
    }

    await db.exec`
      INSERT INTO conversation_history 
        (user_id, conversation_type, user_message, emma_response, context)
      VALUES 
        (${user_id}, 'nutrition', ${user_message}, ${cleanedReply}, ${JSON.stringify({})})
    `;

    await db.exec`
      UPDATE conversation_sessions
      SET last_activity_at = NOW()
      WHERE id = ${session.id}
    `;

    const conversationComplete = cleanedReply.toLowerCase().includes("have a wonderful") || 
                                  cleanedReply.toLowerCase().includes("feel free to chat");

    if (conversationComplete) {
      await db.exec`
        UPDATE conversation_sessions
        SET completed = true
        WHERE id = ${session.id}
      `;
    }

    return {
      emma_reply: cleanedReply,
      session_id: parseInt(session.id),
      conversation_complete: conversationComplete,
      journal_entry_created: false,
      meal_logged: mealLogged,
      goals_updated: goalsUpdated
    };
  }
);

function buildNutritionSystemPrompt(
  userName: string,
  nutritionPlan: any,
  todayMeals: any[],
  memoryContext?: string,
  behaviorPatterns?: any[],
  interactionCount?: number
): string {
  let personalizationContext = "";
  
  if (interactionCount && interactionCount > 1) {
    personalizationContext += `\n\nYou've had ${interactionCount} interactions with ${userName}. `;
  }

  if (behaviorPatterns && behaviorPatterns.length > 0) {
    personalizationContext += `\n\nPersonalization insights about ${userName}:`;
    behaviorPatterns.forEach(pattern => {
      if (pattern.pattern_type === "nutrition_preference") {
        personalizationContext += `\n- Prefers ${pattern.pattern_data.preference}`;
      }
    });
  }

  let nutritionContext = "";
  if (nutritionPlan) {
    nutritionContext = `\n\nTheir current nutrition plan:`;
    if (nutritionPlan.goals && nutritionPlan.goals.length > 0) {
      nutritionContext += `\n- Goals: ${nutritionPlan.goals.join(", ")}`;
    }
    if (nutritionPlan.dietary_preferences) {
      nutritionContext += `\n- Dietary preferences: ${nutritionPlan.dietary_preferences}`;
    }
    if (nutritionPlan.calorie_target) {
      nutritionContext += `\n- Daily targets: ${nutritionPlan.calorie_target} cal, ${nutritionPlan.protein_target_g}g protein, ${nutritionPlan.carbs_target_g}g carbs, ${nutritionPlan.fat_target_g}g fat`;
    }
  }

  let todayMealsContext = "";
  if (todayMeals && todayMeals.length > 0) {
    todayMealsContext = `\n\nWhat they've eaten today:`;
    todayMeals.forEach(meal => {
      todayMealsContext += `\n- ${meal.meal_type}: ${meal.description}`;
      if (meal.calories) {
        todayMealsContext += ` (${meal.calories} cal)`;
      }
    });
  }

  return `You are Emma, a warm, empathetic nutrition coach having a conversation with ${userName}.${memoryContext || ""}${personalizationContext}${nutritionContext}${todayMealsContext}

Your personality:
- Warm, caring, and non-judgmental
- Use natural, conversational language
- Keep responses SHORT (2-3 sentences max)
- Ask one question at a time
- Show genuine interest and empathy
- Never sound robotic or clinical
- Use the person's name occasionally but not excessively

Your role in nutrition:
- Help them log meals and track nutrition
- Provide gentle guidance and suggestions
- Celebrate healthy choices
- Be supportive about challenges
- Ask about how food makes them FEEL, not just what they ate
- Never shame or lecture
- Offer practical, realistic advice

Special Actions:
1. **Logging Meals**: When ${userName} tells you what they ate, confirm and then respond with:
   "LOG_MEAL: {"meal_type": "breakfast|lunch|dinner|snack", "description": "what they ate", "water_intake_oz": number}"
   Example: "That sounds delicious! LOG_MEAL: {"meal_type": "breakfast", "description": "oatmeal with berries and honey"}"

2. **Updating Goals**: When ${userName} wants to change their nutrition targets, confirm and respond with:
   "UPDATE_GOALS: {"calorie_target": number, "protein_target_g": number, "carbs_target_g": number, "fat_target_g": number}"
   Example: "I'll update that for you! UPDATE_GOALS: {"calorie_target": 1800, "protein_target_g": 120}"

3. **Nutrition Advice**: 
   - Suggest meals based on their dietary preferences and what's in season
   - Help them understand macros in simple terms
   - Recommend food swaps for healthier options
   - Discuss how different foods affect energy, mood, and well-being
   - Share tips for meal prep, hydration, and mindful eating

Important guidelines:
- NEVER ask multiple questions in one message
- Keep responses concise and focused
- Build rapport through active listening
- Validate feelings before moving forward
- Don't rush through the conversation
- Focus on sustainable, realistic changes
- Encourage without being preachy

Remember: You're a supportive friend who happens to know about nutrition, not a strict dietitian. Make this feel like a caring conversation.`;
}
