import { api } from "encore.dev/api";
import db from "../db";
import type { CarePlan, CarePlanTask } from "./types";

export interface GetPatientPlanRequest {
  patient_id: string;
}

export interface GetPatientPlanResponse {
  plan: (CarePlan & { tasks: CarePlanTask[] }) | null;
}

export const getPatientPlan = api<GetPatientPlanRequest, GetPatientPlanResponse>(
  { expose: true, method: "GET", path: "/care_plans/patient/:patient_id" },
  async ({ patient_id }) => {
    const plan = await db.queryRow<CarePlan>`
      SELECT * FROM care_plans 
      WHERE patient_id = ${patient_id}::uuid AND is_active = true
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
