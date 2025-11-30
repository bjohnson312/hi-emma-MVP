import { api } from "encore.dev/api";
import db from "../db";
import type { CreateCarePlanItemRequest, CarePlanItem } from "./types";

export const createCarePlanItem = api<CreateCarePlanItemRequest, CarePlanItem>(
  { expose: true, method: "POST", path: "/care-plans/items" },
  async (req) => {
    const {
      care_plan_id,
      type,
      label,
      details,
      frequency,
      times_of_day,
      days_of_week,
      reminder_enabled = true,
      sort_order = 0
    } = req;

    const result = await db.queryRow<CarePlanItem>`
      INSERT INTO care_plan_items (
        care_plan_id, type, label, details, frequency, 
        times_of_day, days_of_week, reminder_enabled, sort_order
      )
      VALUES (
        ${care_plan_id}, ${type}, ${label}, ${JSON.stringify(details || {})}, ${frequency},
        ${JSON.stringify(times_of_day || [])}, ${JSON.stringify(days_of_week || [])},
        ${reminder_enabled}, ${sort_order}
      )
      RETURNING *
    `;

    return result!;
  }
);
