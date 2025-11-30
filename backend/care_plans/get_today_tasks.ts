import { api } from "encore.dev/api";
import db from "../db";
import type { GetTodayTasksRequest, GetTodayTasksResponse, CarePlanItem, TodayTask } from "./types";

function parseJsonField<T>(field: any): T {
  if (typeof field === 'string') {
    return JSON.parse(field);
  }
  return field as T;
}

function shouldShowToday(item: CarePlanItem): boolean {
  const daysOfWeek = parseJsonField<number[]>(item.days_of_week);
  
  if (!daysOfWeek || daysOfWeek.length === 0) {
    return true;
  }

  const today = new Date().getDay();
  return daysOfWeek.includes(today);
}

export const getTodayTasks = api<GetTodayTasksRequest, GetTodayTasksResponse>(
  { expose: true, method: "GET", path: "/care-plans/today/:user_id" },
  async (req) => {
    const { user_id } = req;

    const itemsQuery = await db.query<CarePlanItem>`
      SELECT cpi.*
      FROM care_plan_items cpi
      JOIN care_plans cp ON cpi.care_plan_id = cp.id
      WHERE cp.user_id = ${user_id} 
        AND cp.is_active = true 
        AND cpi.is_active = true
      ORDER BY cpi.sort_order ASC, cpi.created_at ASC
    `;

    const allItems: CarePlanItem[] = [];
    for await (const item of itemsQuery) {
      allItems.push(item);
    }

    const todayItems = allItems.filter(item => shouldShowToday(item));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completionQuery = await db.query<{ care_plan_id: number; completed_item_ids: any }>`
      SELECT care_plan_id, completed_item_ids
      FROM care_plan_completions
      WHERE user_id = ${user_id} AND completion_date = ${today}
    `;

    const completedItemsMap = new Map<number, Set<number>>();
    for await (const completion of completionQuery) {
      const itemIds = parseJsonField<number[]>(completion.completed_item_ids);
      completedItemsMap.set(completion.care_plan_id, new Set(itemIds));
    }

    const tasks: TodayTask[] = todayItems.map(item => {
      const completedSet = completedItemsMap.get(item.care_plan_id) || new Set();
      const timesOfDay = parseJsonField<string[]>(item.times_of_day);
      
      return {
        item,
        completed: completedSet.has(item.id),
        scheduled_time: timesOfDay && timesOfDay.length > 0 ? timesOfDay[0] : undefined
      };
    });

    const completedCount = tasks.filter(t => t.completed).length;

    return {
      tasks,
      total_count: tasks.length,
      completed_count: completedCount
    };
  }
);
