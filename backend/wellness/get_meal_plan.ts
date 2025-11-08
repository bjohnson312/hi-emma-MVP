import { api } from "encore.dev/api";
import db from "../db";
import type { GetMealPlanRequest, GetMealPlanResponse, WeeklyMealPlan } from "./meal_plan_types";

export const getMealPlan = api<GetMealPlanRequest, GetMealPlanResponse>(
  { expose: true, method: "POST", path: "/wellness/meal-plan/get" },
  async (req) => {
    const { user_id, week_start_date } = req;

    const weekStart = week_start_date 
      ? new Date(week_start_date) 
      : getStartOfWeek(new Date());
    
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const plan = await db.queryRow<{
      id: number;
      plan_data: string;
    }>`
      SELECT id, plan_data
      FROM weekly_meal_plans
      WHERE user_id = ${user_id} 
        AND week_start_date = ${weekStartStr}
        AND active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!plan) {
      return {
        plan_id: null,
        week_start_date: weekStartStr,
        plan_data: null,
        has_plan: false
      };
    }

    return {
      plan_id: plan.id,
      week_start_date: weekStartStr,
      plan_data: JSON.parse(plan.plan_data) as WeeklyMealPlan,
      has_plan: true
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
