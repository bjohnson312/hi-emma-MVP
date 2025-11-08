import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { GenerateMealPlanRequest, GenerateMealPlanResponse, WeeklyMealPlan } from "./meal_plan_types";

const openAIKey = secret("OpenAIKey");

async function callAI(prompt: string): Promise<string> {
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
          content: "You are a nutrition expert who creates personalized weekly meal plans. Always respond with valid JSON only, no additional text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data.choices[0].message.content;
}

export const generateMealPlan = api<GenerateMealPlanRequest, GenerateMealPlanResponse>(
  { expose: true, method: "POST", path: "/wellness/meal-plan/generate" },
  async (req) => {
    const { user_id, week_start_date } = req;

    const weekStart = week_start_date 
      ? new Date(week_start_date) 
      : getStartOfWeek(new Date());
    
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const profile = await db.queryRow<{
      name: string;
      age?: number;
      health_conditions?: string[];
    }>`
      SELECT name, age, health_conditions
      FROM user_profiles
      WHERE user_id = ${user_id}
    `;

    const nutritionPlan = await db.queryRow<{
      goals: string[];
      dietary_preferences?: string;
      calorie_target?: number;
      protein_target_g?: number;
    }>`
      SELECT goals, dietary_preferences, calorie_target, protein_target_g
      FROM nutrition_plans
      WHERE user_id = ${user_id} AND active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const dietPreferences = await db.queryRow<{
      dietary_restrictions?: string[];
      allergies?: string[];
    }>`
      SELECT dietary_restrictions, allergies
      FROM diet_preferences
      WHERE user_id = ${user_id}
    `;

    const prompt = buildMealPlanPrompt(profile, nutritionPlan, dietPreferences);
    const aiResponse = await callAI(prompt);
    
    let planData: WeeklyMealPlan;
    try {
      const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      planData = JSON.parse(cleaned);
    } catch (error) {
      console.error("Failed to parse AI response:", aiResponse);
      throw new Error("Failed to generate meal plan");
    }

    await db.exec`
      UPDATE weekly_meal_plans
      SET active = false
      WHERE user_id = ${user_id}
    `;

    const result = await db.queryRow<{ id: number }>`
      INSERT INTO weekly_meal_plans (user_id, week_start_date, plan_data, active)
      VALUES (${user_id}, ${weekStartStr}, ${JSON.stringify(planData)}, true)
      ON CONFLICT (user_id, week_start_date)
      DO UPDATE SET 
        plan_data = ${JSON.stringify(planData)},
        active = true,
        updated_at = NOW()
      RETURNING id
    `;

    return {
      plan_id: result!.id,
      week_start_date: weekStartStr,
      plan_data: planData
    };
  }
);

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildMealPlanPrompt(
  profile: any,
  nutritionPlan: any,
  dietPreferences: any
): string {
  let prompt = `Create a personalized weekly meal plan for ${profile?.name || 'the user'}.

Requirements:
- 7 days (Monday through Sunday)
- Each day must have: breakfast, lunch, dinner, and 2-3 snacks
- Include calorie and macro estimates for each meal
- List main ingredients for each meal (for shopping list generation)
`;

  if (nutritionPlan?.calorie_target) {
    const dailyCalories = nutritionPlan.calorie_target;
    prompt += `\n- Target daily calories: ${dailyCalories} (breakfast ~${Math.round(dailyCalories * 0.25)}, lunch ~${Math.round(dailyCalories * 0.35)}, dinner ~${Math.round(dailyCalories * 0.30)}, snacks ~${Math.round(dailyCalories * 0.10)})`;
  }

  if (nutritionPlan?.protein_target_g) {
    prompt += `\n- Daily protein target: ${nutritionPlan.protein_target_g}g`;
  }

  if (nutritionPlan?.goals && nutritionPlan.goals.length > 0) {
    prompt += `\n- Nutrition goals: ${nutritionPlan.goals.join(", ")}`;
  }

  if (nutritionPlan?.dietary_preferences) {
    prompt += `\n- Dietary preference: ${nutritionPlan.dietary_preferences}`;
  }

  if (dietPreferences?.dietary_restrictions && dietPreferences.dietary_restrictions.length > 0) {
    prompt += `\n- Dietary restrictions: ${dietPreferences.dietary_restrictions.join(", ")}`;
  }

  if (dietPreferences?.allergies && dietPreferences.allergies.length > 0) {
    prompt += `\n- ALLERGIES (NEVER include): ${dietPreferences.allergies.join(", ")}`;
  }

  if (profile?.health_conditions && profile.health_conditions.length > 0) {
    prompt += `\n- Health considerations: ${profile.health_conditions.join(", ")}`;
  }

  prompt += `\n\nRespond with ONLY a JSON object in this exact structure:
{
  "monday": {
    "breakfast": {"name": "Meal Name", "description": "Brief description", "calories": 400, "protein_g": 20, "carbs_g": 45, "fat_g": 15, "ingredients": ["ingredient1", "ingredient2"]},
    "lunch": {"name": "...", "description": "...", "calories": 500, "protein_g": 30, "carbs_g": 50, "fat_g": 18, "ingredients": [...]},
    "dinner": {"name": "...", "description": "...", "calories": 450, "protein_g": 35, "carbs_g": 40, "fat_g": 16, "ingredients": [...]},
    "snacks": [
      {"name": "...", "description": "...", "calories": 150, "protein_g": 8, "carbs_g": 15, "fat_g": 6, "ingredients": [...]},
      {"name": "...", "description": "...", "calories": 100, "protein_g": 5, "carbs_g": 12, "fat_g": 4, "ingredients": [...]}
    ]
  },
  "tuesday": { ... },
  "wednesday": { ... },
  "thursday": { ... },
  "friday": { ... },
  "saturday": { ... },
  "sunday": { ... }
}

Make the meals varied, delicious, and realistic. Include different cuisines throughout the week.`;

  return prompt;
}
