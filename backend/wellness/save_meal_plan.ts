import { api } from "encore.dev/api";
import db from "../db";

export interface SaveMealPlanRequest {
  user_id: string;
  title: string;
  mealPlanId?: number;
  mealPlanData: any;
}

export interface SaveMealPlanResponse {
  id: number;
  success: boolean;
}

export const saveMealPlan = api<SaveMealPlanRequest, SaveMealPlanResponse>(
  { method: "POST", path: "/wellness/meal-plans/save", expose: true },
  async (req) => {
    const result = await db.queryRow<{ id: number }>`
      INSERT INTO saved_meal_plans (user_id, meal_plan_id, title, meal_plan_data)
      VALUES (${req.user_id}, ${req.mealPlanId || null}, ${req.title}, ${JSON.stringify(req.mealPlanData)})
      RETURNING id
    `;

    return {
      id: result!.id,
      success: true
    };
  }
);

export interface ToggleFavoriteMealPlanRequest {
  user_id: string;
  id: number;
  isFavorite: boolean;
}

export const toggleFavoriteMealPlan = api<ToggleFavoriteMealPlanRequest, { success: boolean }>(
  { method: "POST", path: "/wellness/meal-plans/:id/favorite", expose: true },
  async (req) => {
    await db.exec`
      UPDATE saved_meal_plans 
      SET is_favorite = ${req.isFavorite}, updated_at = NOW()
      WHERE id = ${req.id} AND user_id = ${req.user_id}
    `;

    return { success: true };
  }
);

export interface SavedMealPlan {
  id: number;
  title: string;
  mealPlanData: any;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListSavedMealPlansRequest {
  user_id: string;
  favoritesOnly?: boolean;
}

export interface ListSavedMealPlansResponse {
  plans: SavedMealPlan[];
}

export const listSavedMealPlans = api<ListSavedMealPlansRequest, ListSavedMealPlansResponse>(
  { method: "POST", path: "/wellness/meal-plans/saved", expose: true },
  async (req) => {
    let query = db.query<{
      id: number;
      title: string;
      meal_plan_data: string;
      is_favorite: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, title, meal_plan_data, is_favorite, created_at, updated_at
      FROM saved_meal_plans
      WHERE user_id = ${req.user_id}
    `;

    if (req.favoritesOnly) {
      query = db.query<{
        id: number;
        title: string;
        meal_plan_data: string;
        is_favorite: boolean;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT id, title, meal_plan_data, is_favorite, created_at, updated_at
        FROM saved_meal_plans
        WHERE user_id = ${req.user_id} AND is_favorite = true
      `;
    }

    const rows: any[] = [];
    for await (const row of query) {
      rows.push(row);
    }
    const plans = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      mealPlanData: JSON.parse(row.meal_plan_data),
      isFavorite: row.is_favorite,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));

    return { plans };
  }
);

export interface DeleteSavedMealPlanRequest {
  user_id: string;
  id: number;
}

export const deleteSavedMealPlan = api<DeleteSavedMealPlanRequest, { success: boolean }>(
  { method: "DELETE", path: "/wellness/meal-plans/saved/:id", expose: true },
  async (req) => {
    await db.exec`
      DELETE FROM saved_meal_plans 
      WHERE id = ${req.id} AND user_id = ${req.user_id}
    `;

    return { success: true };
  }
);
