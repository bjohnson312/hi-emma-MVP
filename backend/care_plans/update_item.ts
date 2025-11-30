import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateCarePlanItemRequest, CarePlanItem } from "./types";

export const updateCarePlanItem = api<UpdateCarePlanItemRequest, CarePlanItem>(
  { expose: true, method: "PATCH", path: "/care-plans/items/:item_id" },
  async (req) => {
    const {
      item_id,
      label,
      details,
      frequency,
      times_of_day,
      days_of_week,
      reminder_enabled,
      is_active,
      sort_order
    } = req;

    const result = await db.queryRow<CarePlanItem>`
      UPDATE care_plan_items
      SET 
        label = COALESCE(${label}, label),
        details = COALESCE(${details ? JSON.stringify(details) : null}, details),
        frequency = COALESCE(${frequency}, frequency),
        times_of_day = COALESCE(${times_of_day ? JSON.stringify(times_of_day) : null}, times_of_day),
        days_of_week = COALESCE(${days_of_week ? JSON.stringify(days_of_week) : null}, days_of_week),
        reminder_enabled = COALESCE(${reminder_enabled}, reminder_enabled),
        is_active = COALESCE(${is_active}, is_active),
        sort_order = COALESCE(${sort_order}, sort_order),
        updated_at = NOW()
      WHERE id = ${item_id}
      RETURNING *
    `;

    return result!;
  }
);
