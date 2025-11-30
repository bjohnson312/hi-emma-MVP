import { api } from "encore.dev/api";
import db from "../db";
import type { DeleteCarePlanItemRequest } from "./types";

export const deleteCarePlanItem = api<DeleteCarePlanItemRequest, { success: boolean }>(
  { expose: true, method: "DELETE", path: "/care-plans/items/:item_id" },
  async (req) => {
    const { item_id } = req;

    await db.exec`
      UPDATE care_plan_items
      SET is_active = false, updated_at = NOW()
      WHERE id = ${item_id}
    `;

    return { success: true };
  }
);
