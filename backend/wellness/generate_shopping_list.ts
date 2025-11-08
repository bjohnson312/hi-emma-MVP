import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import type { GenerateShoppingListRequest, GenerateShoppingListResponse, ShoppingList } from "./meal_plan_types";

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
          content: "You are a helpful assistant that creates organized shopping lists. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.statusText}`);
  }

  const data: any = await response.json();
  return data.choices[0].message.content;
}

export const generateShoppingList = api<GenerateShoppingListRequest, GenerateShoppingListResponse>(
  { expose: true, method: "POST", path: "/wellness/meal-plan/shopping-list" },
  async (req) => {
    const { plan_id, user_id } = req;

    const plan = await db.queryRow<{
      plan_data: string;
    }>`
      SELECT plan_data
      FROM weekly_meal_plans
      WHERE id = ${plan_id} AND user_id = ${user_id}
    `;

    if (!plan) {
      throw new Error("Meal plan not found");
    }

    const planData = JSON.parse(plan.plan_data);
    
    const allIngredients: string[] = [];
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (const day of days) {
      const dayPlan = planData[day];
      if (!dayPlan) continue;
      
      if (dayPlan.breakfast?.ingredients) {
        allIngredients.push(...dayPlan.breakfast.ingredients);
      }
      if (dayPlan.lunch?.ingredients) {
        allIngredients.push(...dayPlan.lunch.ingredients);
      }
      if (dayPlan.dinner?.ingredients) {
        allIngredients.push(...dayPlan.dinner.ingredients);
      }
      if (dayPlan.snacks) {
        for (const snack of dayPlan.snacks) {
          if (snack.ingredients) {
            allIngredients.push(...snack.ingredients);
          }
        }
      }
    }

    const prompt = `Given this list of ingredients for a week of meals, create an organized shopping list.

Ingredients:
${allIngredients.join('\n')}

Please:
1. Combine duplicate ingredients and estimate reasonable quantities for one week
2. Organize into categories: produce, proteins, dairy, grains, pantry, other
3. Format quantities in standard measurements (e.g., "2 lbs", "1 dozen", "3 cups")

Respond with ONLY a JSON object in this structure:
{
  "produce": [{"item": "tomatoes", "quantity": "6 medium", "category": "produce"}],
  "proteins": [{"item": "chicken breast", "quantity": "2 lbs", "category": "proteins"}],
  "dairy": [{"item": "milk", "quantity": "1 gallon", "category": "dairy"}],
  "grains": [{"item": "rice", "quantity": "2 cups", "category": "grains"}],
  "pantry": [{"item": "olive oil", "quantity": "1 bottle", "category": "pantry"}],
  "other": [{"item": "item", "quantity": "amount", "category": "other"}]
}`;

    const aiResponse = await callAI(prompt);
    
    let shoppingList: ShoppingList;
    try {
      const cleaned = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      shoppingList = JSON.parse(cleaned);
    } catch (error) {
      console.error("Failed to parse AI response:", aiResponse);
      throw new Error("Failed to generate shopping list");
    }

    await db.exec`
      UPDATE weekly_meal_plans
      SET 
        shopping_list = ${JSON.stringify(shoppingList)},
        updated_at = NOW()
      WHERE id = ${plan_id} AND user_id = ${user_id}
    `;

    return {
      shopping_list: shoppingList
    };
  }
);
