import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateCarePlanRequest, CarePlan } from "./types";

export const updateCarePlan = api<UpdateCarePlanRequest, CarePlan>(
  { expose: true, method: "PATCH", path: "/care-plans/:plan_id" },
  async (req) => {
    const { plan_id, name, description, is_active } = req;

    if (name !== undefined) {
      const result = await db.queryRow<CarePlan>`
        UPDATE care_plans
        SET name = ${name}, updated_at = NOW()
        WHERE id = ${plan_id}
        RETURNING *
      `;
      return result!;
    }

    if (description !== undefined) {
      const result = await db.queryRow<CarePlan>`
        UPDATE care_plans
        SET description = ${description}, updated_at = NOW()
        WHERE id = ${plan_id}
        RETURNING *
      `;
      return result!;
    }

    if (is_active !== undefined) {
      const result = await db.queryRow<CarePlan>`
        UPDATE care_plans
        SET is_active = ${is_active}, updated_at = NOW()
        WHERE id = ${plan_id}
        RETURNING *
      `;
      return result!;
    }

    const result = await db.queryRow<CarePlan>`
      SELECT * FROM care_plans WHERE id = ${plan_id}
    `;
    return result!;
  }
);
