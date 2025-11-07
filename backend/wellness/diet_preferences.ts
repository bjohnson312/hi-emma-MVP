import { api } from "encore.dev/api";
import db from "../db";

interface UpdateDietPreferencesRequest {
  user_id: string;
  dietary_restrictions?: string[];
  allergies?: string[];
  meal_goals?: string[];
  water_goal_oz?: number;
  preferred_meal_times?: string;
}

interface DietPreferences {
  user_id: string;
  dietary_restrictions?: string[];
  allergies?: string[];
  meal_goals?: string[];
  water_goal_oz?: number;
  preferred_meal_times?: string;
  created_at: Date;
  updated_at: Date;
}

export const updateDietPreferences = api<UpdateDietPreferencesRequest, DietPreferences>(
  { expose: true, method: "POST", path: "/wellness/diet-preferences" },
  async (req) => {
    await db.exec`
      INSERT INTO diet_preferences 
        (user_id, dietary_restrictions, allergies, meal_goals, water_goal_oz, preferred_meal_times)
      VALUES 
        (${req.user_id}, ${req.dietary_restrictions || null}, ${req.allergies || null}, 
         ${req.meal_goals || null}, ${req.water_goal_oz || null}, ${req.preferred_meal_times || null})
      ON CONFLICT (user_id) DO UPDATE
      SET dietary_restrictions = EXCLUDED.dietary_restrictions,
          allergies = EXCLUDED.allergies,
          meal_goals = EXCLUDED.meal_goals,
          water_goal_oz = EXCLUDED.water_goal_oz,
          preferred_meal_times = EXCLUDED.preferred_meal_times,
          updated_at = NOW()
    `;

    const result = await db.queryRow<DietPreferences>`
      SELECT user_id, dietary_restrictions, allergies, meal_goals, water_goal_oz, 
             preferred_meal_times, created_at, updated_at
      FROM diet_preferences
      WHERE user_id = ${req.user_id}
    `;

    return result!;
  }
);
