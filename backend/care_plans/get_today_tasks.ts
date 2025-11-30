import { api } from "encore.dev/api";
import db from "../db";
import type { GetTodayTasksRequest, GetTodayTasksResponse, CarePlan, CarePlanTask, TodayTask } from "./types";

export const getTodayTasks = api<GetTodayTasksRequest, GetTodayTasksResponse>(
  { expose: true, method: "GET", path: "/care_plans/today/:user_id" },
  async ({ user_id }) => {
    const plan = await db.queryRow<CarePlan>`
      SELECT * FROM care_plans 
      WHERE user_id = ${user_id} AND is_active = true
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (!plan) {
      return {
        tasks: [],
        completed_count: 0,
        total_count: 0
      };
    }

    const tasksResult = await db.query<CarePlanTask>`
      SELECT * FROM care_plan_tasks
      WHERE care_plan_id = ${plan.id} AND is_active = true
      ORDER BY order_index ASC
    `;

    const tasks: CarePlanTask[] = [];
    for await (const task of tasksResult) {
      tasks.push(task);
    }

    if (tasks.length === 0) {
      return {
        tasks: [],
        completed_count: 0,
        total_count: 0
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completionsResult = await db.query<{ task_id: number }>`
      SELECT task_id FROM care_plan_completions
      WHERE user_id = ${user_id} AND completion_date = ${today}
    `;

    const completions: Array<{ task_id: number }> = [];
    for await (const completion of completionsResult) {
      completions.push(completion);
    }

    const completedTaskIds = new Set(completions.map((c: any) => c.task_id));

    const todayTasks: TodayTask[] = tasks.map((task: any) => ({
      ...task,
      completed: completedTaskIds.has(task.id!)
    }));

    return {
      tasks: todayTasks,
      completed_count: todayTasks.filter(t => t.completed).length,
      total_count: todayTasks.length
    };
  }
);
