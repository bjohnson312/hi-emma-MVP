import { api } from "encore.dev/api";
import db from "../db";
import type { GetUserPlansRequest, GetUserPlansResponse, CarePlan } from "./types";

export const getUserPlans = api<GetUserPlansRequest, GetUserPlansResponse>(
  { expose: true, method: "GET", path: "/care-plans/user/:user_id" },
  async (req) => {
    const { user_id } = req;

    const plansQuery = await db.query<CarePlan>`
      SELECT * FROM care_plans
      WHERE user_id = ${user_id}
      ORDER BY is_active DESC, created_at DESC
    `;

    const plans: CarePlan[] = [];
    for await (const plan of plansQuery) {
      plans.push(plan);
    }

    return { plans };
  }
);
