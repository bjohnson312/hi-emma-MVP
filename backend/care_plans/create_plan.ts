import { api } from "encore.dev/api";
import db from "../db";
import type { CreatePlanRequest, CreatePlanResponse, CarePlan, CarePlanTask } from "./types";

export const createPlan = api<CreatePlanRequest, CreatePlanResponse>(
  { expose: true, method: "POST", path: "/care_plans/create" },
  async (req) => {
    const { user_id, name, description, tasks } = req;

    const existingPlan = await db.queryRow<{ id: number }>`
      SELECT id FROM care_plans WHERE user_id = ${user_id} AND is_active = true
    `;

    if (existingPlan) {
      await db.exec`
        UPDATE care_plans SET is_active = false WHERE id = ${existingPlan.id}
      `;
    }

    const plan = await db.queryRow<CarePlan>`
      INSERT INTO care_plans (user_id, name, description, is_active)
      VALUES (${user_id}, ${name}, ${description || null}, true)
      RETURNING *
    `;

    if (!plan) {
      throw new Error("Failed to create care plan");
    }

    const createdTasks: CarePlanTask[] = [];

    for (const task of tasks) {
      const createdTask = await db.queryRow<CarePlanTask>`
        INSERT INTO care_plan_tasks 
          (care_plan_id, label, type, frequency, time_of_day, reminder_enabled, order_index, is_active)
        VALUES 
          (${plan.id}, ${task.label}, ${task.type}, ${task.frequency}, 
           ${task.time_of_day || null}, ${task.reminder_enabled}, ${task.order_index}, true)
        RETURNING *
      `;

      if (createdTask) {
        createdTasks.push(createdTask);
      }
    }

    return {
      plan: {
        ...plan,
        tasks: createdTasks
      }
    };
  }
);
