import { api } from "encore.dev/api";
import db from "../db";

interface SaveNutritionPlanRequest {
  user_id: string;
  goals: string[];
  dietary_preferences?: string;
  calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number;
  fat_target_g: number;
}

interface SaveNutritionPlanResponse {
  success: boolean;
}

export const saveNutritionPlan = api<SaveNutritionPlanRequest, SaveNutritionPlanResponse>(
  { expose: true, method: "POST", path: "/wellness/nutrition-plan/save" },
  async (req) => {
    await db.exec`
      UPDATE nutrition_plans 
      SET active = false 
      WHERE user_id = ${req.user_id} AND active = true
    `;

    await db.exec`
      INSERT INTO nutrition_plans 
        (user_id, plan_name, goals, dietary_preferences, calorie_target, 
         protein_target_g, carbs_target_g, fat_target_g, active)
      VALUES 
        (${req.user_id}, 'My Nutrition Plan', ${req.goals}, 
         ${req.dietary_preferences || null}, ${req.calorie_target},
         ${req.protein_target_g}, ${req.carbs_target_g}, 
         ${req.fat_target_g}, true)
    `;

    return { success: true };
  }
);
