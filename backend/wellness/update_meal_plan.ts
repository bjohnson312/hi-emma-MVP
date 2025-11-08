import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateMealPlanRequest, UpdateMealPlanResponse } from "./meal_plan_types";

export const updateMealPlan = api<UpdateMealPlanRequest, UpdateMealPlanResponse>(
  { expose: true, method: "POST", path: "/wellness/meal-plan/update" },
  async (req) => {
    const { plan_id, user_id, plan_data } = req;

    await db.exec`
      UPDATE weekly_meal_plans
      SET 
        plan_data = ${JSON.stringify(plan_data)},
        updated_at = NOW()
      WHERE id = ${plan_id} AND user_id = ${user_id}
    `;

    return {
      success: true
    };
  }
);
