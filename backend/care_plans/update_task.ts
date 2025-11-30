import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateTaskRequest, UpdateTaskResponse, CarePlanTask } from "./types";

export const updateTask = api<UpdateTaskRequest, UpdateTaskResponse>(
  { expose: true, method: "POST", path: "/care_plans/tasks/update" },
  async (req) => {
    const { task_id, updates } = req;

    const parts: string[] = [];

    if (updates.label !== undefined) {
      parts.push('label');
    }
    if (updates.type !== undefined) {
      parts.push('type');
    }
    if (updates.frequency !== undefined) {
      parts.push('frequency');
    }
    if (updates.time_of_day !== undefined) {
      parts.push('time_of_day');
    }
    if (updates.reminder_enabled !== undefined) {
      parts.push('reminder_enabled');
    }
    if (updates.order_index !== undefined) {
      parts.push('order_index');
    }

    if (parts.length === 0) {
      const task = await db.queryRow<CarePlanTask>`
        SELECT * FROM care_plan_tasks WHERE id = ${task_id}
      `;
      if (!task) {
        throw new Error("Task not found");
      }
      return { task };
    }

    let updatedTask: CarePlanTask | null = null;

    if (parts.includes('label') && updates.label !== undefined) {
      updatedTask = await db.queryRow<CarePlanTask>`
        UPDATE care_plan_tasks SET label = ${updates.label}, updated_at = NOW()
        WHERE id = ${task_id} RETURNING *
      `;
    }
    if (parts.includes('type') && updates.type !== undefined) {
      updatedTask = await db.queryRow<CarePlanTask>`
        UPDATE care_plan_tasks SET type = ${updates.type}, updated_at = NOW()
        WHERE id = ${task_id} RETURNING *
      `;
    }
    if (parts.includes('frequency') && updates.frequency !== undefined) {
      updatedTask = await db.queryRow<CarePlanTask>`
        UPDATE care_plan_tasks SET frequency = ${updates.frequency}, updated_at = NOW()
        WHERE id = ${task_id} RETURNING *
      `;
    }
    if (parts.includes('time_of_day') && updates.time_of_day !== undefined) {
      updatedTask = await db.queryRow<CarePlanTask>`
        UPDATE care_plan_tasks SET time_of_day = ${updates.time_of_day || null}, updated_at = NOW()
        WHERE id = ${task_id} RETURNING *
      `;
    }
    if (parts.includes('reminder_enabled') && updates.reminder_enabled !== undefined) {
      updatedTask = await db.queryRow<CarePlanTask>`
        UPDATE care_plan_tasks SET reminder_enabled = ${updates.reminder_enabled}, updated_at = NOW()
        WHERE id = ${task_id} RETURNING *
      `;
    }
    if (parts.includes('order_index') && updates.order_index !== undefined) {
      updatedTask = await db.queryRow<CarePlanTask>`
        UPDATE care_plan_tasks SET order_index = ${updates.order_index}, updated_at = NOW()
        WHERE id = ${task_id} RETURNING *
      `;
    }

    if (!updatedTask) {
      throw new Error("Task not found");
    }

    return { task: updatedTask };
  }
);
