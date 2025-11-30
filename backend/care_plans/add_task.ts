import { api } from "encore.dev/api";
import db from "../db";
import type { AddTaskRequest, AddTaskResponse, CarePlanTask } from "./types";

export const addTask = api<AddTaskRequest, AddTaskResponse>(
  { expose: true, method: "POST", path: "/care_plans/tasks/add" },
  async (req) => {
    const { care_plan_id, task } = req;

    const createdTask = await db.queryRow<CarePlanTask>`
      INSERT INTO care_plan_tasks 
        (care_plan_id, label, type, frequency, time_of_day, reminder_enabled, order_index, is_active)
      VALUES 
        (${care_plan_id}, ${task.label}, ${task.type}, ${task.frequency}, 
         ${task.time_of_day || null}, ${task.reminder_enabled}, ${task.order_index}, true)
      RETURNING *
    `;

    if (!createdTask) {
      throw new Error("Failed to create task");
    }

    return { task: createdTask };
  }
);
