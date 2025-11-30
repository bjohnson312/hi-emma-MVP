import { api } from "encore.dev/api";
import db from "../db";
import type { MarkTaskCompleteRequest, MarkTaskCompleteResponse, TaskCompletion } from "./types";

export const markTaskComplete = api<MarkTaskCompleteRequest, MarkTaskCompleteResponse>(
  { expose: true, method: "POST", path: "/care_plans/tasks/complete" },
  async (req) => {
    const { user_id, task_id, notes } = req;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db.queryRow<TaskCompletion>`
      SELECT * FROM care_plan_completions
      WHERE user_id = ${user_id} AND task_id = ${task_id} AND completion_date = ${today}
    `;

    if (existing) {
      return {
        completion: existing,
        already_complete: true
      };
    }

    const completion = await db.queryRow<TaskCompletion>`
      INSERT INTO care_plan_completions (user_id, task_id, completion_date, notes)
      VALUES (${user_id}, ${task_id}, ${today}, ${notes || null})
      RETURNING *
    `;

    if (!completion) {
      throw new Error("Failed to mark task complete");
    }

    return {
      completion,
      already_complete: false
    };
  }
);
