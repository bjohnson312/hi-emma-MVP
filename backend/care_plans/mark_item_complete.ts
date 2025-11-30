import { api } from "encore.dev/api";
import db from "../db";
import type { MarkItemCompleteRequest, CarePlanCompletion } from "./types";

function parseJsonField<T>(field: any): T {
  if (typeof field === 'string') {
    return JSON.parse(field);
  }
  return field as T;
}

export const markItemComplete = api<MarkItemCompleteRequest, CarePlanCompletion>(
  { expose: true, method: "POST", path: "/care-plans/complete" },
  async (req) => {
    const { user_id, item_id, completed, notes } = req;

    const item = await db.queryRow<{ care_plan_id: number }>`
      SELECT care_plan_id FROM care_plan_items WHERE id = ${item_id}
    `;

    if (!item) {
      throw new Error("Item not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db.queryRow<{ id: number; completed_item_ids: any; notes: string | null }>`
      SELECT id, completed_item_ids, notes
      FROM care_plan_completions
      WHERE user_id = ${user_id} 
        AND care_plan_id = ${item.care_plan_id} 
        AND completion_date = ${today}
    `;

    let completedIds: number[] = [];
    let existingNotes = "";

    if (existing) {
      completedIds = parseJsonField<number[]>(existing.completed_item_ids);
      existingNotes = existing.notes || "";
    }

    if (completed && !completedIds.includes(item_id)) {
      completedIds.push(item_id);
    } else if (!completed && completedIds.includes(item_id)) {
      completedIds = completedIds.filter(id => id !== item_id);
    }

    const allItemsQuery = await db.query<{ id: number }>`
      SELECT id FROM care_plan_items
      WHERE care_plan_id = ${item.care_plan_id} AND is_active = true
    `;
    
    const allItemIds: number[] = [];
    for await (const i of allItemsQuery) {
      allItemIds.push(i.id);
    }

    const allCompleted = allItemIds.length > 0 && allItemIds.every(id => completedIds.includes(id));

    const mergedNotes = notes ? (existingNotes ? `${existingNotes}\n${notes}` : notes) : existingNotes;

    let result: CarePlanCompletion | null;

    if (existing) {
      result = await db.queryRow<CarePlanCompletion>`
        UPDATE care_plan_completions
        SET completed_item_ids = ${JSON.stringify(completedIds)},
            all_completed = ${allCompleted},
            notes = ${mergedNotes || null},
            updated_at = NOW()
        WHERE id = ${existing.id}
        RETURNING *
      `;
    } else {
      result = await db.queryRow<CarePlanCompletion>`
        INSERT INTO care_plan_completions (
          user_id, care_plan_id, completion_date, completed_item_ids, all_completed, notes
        )
        VALUES (
          ${user_id}, ${item.care_plan_id}, ${today}, ${JSON.stringify(completedIds)}, ${allCompleted}, ${notes || null}
        )
        RETURNING *
      `;
    }

    return result!;
  }
);
