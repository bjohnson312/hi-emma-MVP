import { api } from "encore.dev/api";
import db from "../db";
import type { LogMealRequest, DietNutritionLog, GetLogsRequest } from "./types";
import { autoCreateNutritionEntry } from "../wellness_journal/auto_create";

export const logMeal = api<LogMealRequest, DietNutritionLog>(
  { expose: true, method: "POST", path: "/wellness/meal" },
  async (req) => {
    const { user_id, meal_type, meal_time, description, water_intake_oz, energy_level, notes } = req;

    const result = await db.queryRow<DietNutritionLog>`
      INSERT INTO diet_nutrition_logs 
        (user_id, meal_type, meal_time, description, water_intake_oz, energy_level, notes)
      VALUES 
        (${user_id}, ${meal_type}, ${meal_time || null}, ${description}, 
         ${water_intake_oz || null}, ${energy_level || null}, ${notes || null})
      RETURNING id, user_id, date, meal_type, meal_time, description, 
                water_intake_oz, energy_level, notes, created_at
    `;

    await autoCreateNutritionEntry(
      user_id,
      meal_type,
      description,
      water_intake_oz,
      energy_level,
      notes,
      result!.id
    );

    return result!;
  }
);

interface GetMealLogsResponse {
  logs: DietNutritionLog[];
}

export const getMealLogs = api<GetLogsRequest, GetMealLogsResponse>(
  { expose: true, method: "GET", path: "/wellness/meals/:user_id" },
  async (req) => {
    const { user_id, start_date, end_date, limit = 50 } = req;

    let query = `
      SELECT id, user_id, date, meal_type, meal_time, description, 
             water_intake_oz, energy_level, notes, created_at
      FROM diet_nutrition_logs
      WHERE user_id = $1
    `;
    const params: any[] = [user_id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY date DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const logs = await db.rawQueryAll<DietNutritionLog>(query, ...params);
    return { logs };
  }
);
