import { api } from "encore.dev/api";
import db from "../db";
import type { CreateCarePlanRequest, CarePlan } from "./types";

export const createCarePlan = api<CreateCarePlanRequest, CarePlan>(
  { expose: true, method: "POST", path: "/care-plans" },
  async (req) => {
    const { user_id, name, condition_key, description } = req;

    const existingActive = await db.queryRow<{ id: number }>`
      SELECT id FROM care_plans
      WHERE user_id = ${user_id} AND is_active = true
      LIMIT 1
    `;

    if (existingActive) {
      await db.exec`
        UPDATE care_plans
        SET is_active = false, updated_at = NOW()
        WHERE id = ${existingActive.id}
      `;
    }

    const result = await db.queryRow<CarePlan>`
      INSERT INTO care_plans (user_id, name, condition_key, description, is_active)
      VALUES (${user_id}, ${name}, ${condition_key || null}, ${description || null}, true)
      RETURNING *
    `;

    return result!;
  }
);
