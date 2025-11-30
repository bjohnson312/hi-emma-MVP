import { api } from "encore.dev/api";
import db from "../db";
import type { GetCompletionsRequest, GetCompletionsResponse, CarePlanCompletion } from "./types";

export const getCompletions = api<GetCompletionsRequest, GetCompletionsResponse>(
  { expose: true, method: "GET", path: "/care-plans/completions/:user_id" },
  async (req) => {
    const { user_id, start_date, end_date, limit = 30 } = req;

    let query;
    
    if (start_date && end_date) {
      query = db.query<CarePlanCompletion>`
        SELECT * FROM care_plan_completions
        WHERE user_id = ${user_id}
          AND completion_date >= ${start_date}
          AND completion_date <= ${end_date}
        ORDER BY completion_date DESC
        LIMIT ${limit}
      `;
    } else if (start_date) {
      query = db.query<CarePlanCompletion>`
        SELECT * FROM care_plan_completions
        WHERE user_id = ${user_id}
          AND completion_date >= ${start_date}
        ORDER BY completion_date DESC
        LIMIT ${limit}
      `;
    } else {
      query = db.query<CarePlanCompletion>`
        SELECT * FROM care_plan_completions
        WHERE user_id = ${user_id}
        ORDER BY completion_date DESC
        LIMIT ${limit}
      `;
    }

    const completions: CarePlanCompletion[] = [];
    for await (const completion of query) {
      completions.push(completion);
    }

    return { completions };
  }
);
