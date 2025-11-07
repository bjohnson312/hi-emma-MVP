import { api } from "encore.dev/api";
import db from "../db";
import type { GetNutritionPlanRequest, NutritionPlan } from "./types";

interface GetNutritionPlanResponse {
  plan?: NutritionPlan;
}

export const getNutritionPlan = api<GetNutritionPlanRequest, GetNutritionPlanResponse>(
  { expose: true, method: "GET", path: "/wellness/nutrition-plan/:user_id" },
  async (req) => {
    const plan = await db.queryRow<NutritionPlan>`
      SELECT id, user_id, plan_name, goals, dietary_preferences, 
             calorie_target, protein_target_g, carbs_target_g, fat_target_g,
             meal_suggestions, active, created_at, updated_at
      FROM nutrition_plans
      WHERE user_id = ${req.user_id} AND active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    return { plan: plan || undefined };
  }
);
