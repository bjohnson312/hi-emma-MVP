import { api } from "encore.dev/api";
import db from "../db";
import type { DeleteCarePlanRequest } from "./types";

export const deleteCarePlan = api<DeleteCarePlanRequest, { success: boolean }>(
  { expose: true, method: "DELETE", path: "/care-plans/:plan_id" },
  async (req) => {
    const { plan_id } = req;

    await db.exec`
      UPDATE care_plans
      SET is_active = false, updated_at = NOW()
      WHERE id = ${plan_id}
    `;

    return { success: true };
  }
);
