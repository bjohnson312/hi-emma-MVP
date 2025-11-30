import { api } from "encore.dev/api";
import db from "../db";
import type { GetUserPlanRequest, GetUserPlanResponse, CarePlan, CarePlanTask } from "./types";

export const getUserPlan = api<GetUserPlanRequest, GetUserPlanResponse>(
  { expose: true, method: "GET", path: "/care_plans/user/:user_id" },
  async ({ user_id }) => {
    const plan = await db.queryRow<CarePlan>`
      SELECT * FROM care_plans 
      WHERE user_id = ${user_id} AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!plan) {
      return { plan: null };
    }

    const tasksResult = await db.query<CarePlanTask>`
      SELECT * FROM care_plan_tasks
      WHERE care_plan_id = ${plan.id} AND is_active = true
      ORDER BY order_index ASC
    `;

    const tasks: CarePlanTask[] = [];
    for await (const task of tasksResult) {
      tasks.push(task);
    }

    return {
      plan: {
        ...plan,
        tasks
      }
    };
  }
);
