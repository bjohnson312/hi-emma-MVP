import { api } from "encore.dev/api";
import db from "../db";
import type { GetPlanItemsRequest, GetPlanItemsResponse, CarePlanItem } from "./types";

export const getPlanItems = api<GetPlanItemsRequest, GetPlanItemsResponse>(
  { expose: true, method: "GET", path: "/care-plans/:care_plan_id/items" },
  async (req) => {
    const { care_plan_id } = req;

    const itemsQuery = await db.query<CarePlanItem>`
      SELECT * FROM care_plan_items
      WHERE care_plan_id = ${care_plan_id} AND is_active = true
      ORDER BY sort_order ASC, created_at ASC
    `;

    const items: CarePlanItem[] = [];
    for await (const item of itemsQuery) {
      items.push(item);
    }

    return { items };
  }
);
