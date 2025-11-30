import { api } from "encore.dev/api";
import db from "../db";

interface DeleteTaskRequest {
  task_id: number;
}

interface DeleteTaskResponse {
  success: boolean;
}

export const deleteTask = api<DeleteTaskRequest, DeleteTaskResponse>(
  { expose: true, method: "POST", path: "/care_plans/tasks/delete" },
  async ({ task_id }) => {
    await db.exec`
      UPDATE care_plan_tasks 
      SET is_active = false 
      WHERE id = ${task_id}
    `;

    return { success: true };
  }
);
