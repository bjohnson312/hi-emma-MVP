import { api } from "encore.dev/api";
import db from "../db";

export interface SaveShoppingListRequest {
  user_id: string;
  title: string;
  mealPlanId?: number;
  shoppingListData: any;
}

export interface SaveShoppingListResponse {
  id: number;
  success: boolean;
}

export const saveShoppingList = api<SaveShoppingListRequest, SaveShoppingListResponse>(
  { method: "POST", path: "/wellness/shopping-lists/save", expose: true },
  async (req) => {
    const result = await db.queryRow<{ id: number }>`
      INSERT INTO saved_shopping_lists (user_id, meal_plan_id, title, shopping_list_data)
      VALUES (${req.user_id}, ${req.mealPlanId || null}, ${req.title}, ${JSON.stringify(req.shoppingListData)})
      RETURNING id
    `;

    return {
      id: result!.id,
      success: true
    };
  }
);

export interface ToggleFavoriteShoppingListRequest {
  user_id: string;
  id: number;
  isFavorite: boolean;
}

export const toggleFavoriteShoppingList = api<ToggleFavoriteShoppingListRequest, { success: boolean }>(
  { method: "POST", path: "/wellness/shopping-lists/:id/favorite", expose: true },
  async (req) => {
    await db.exec`
      UPDATE saved_shopping_lists 
      SET is_favorite = ${req.isFavorite}, updated_at = NOW()
      WHERE id = ${req.id} AND user_id = ${req.user_id}
    `;

    return { success: true };
  }
);

export interface SavedShoppingList {
  id: number;
  title: string;
  shoppingListData: any;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListSavedShoppingListsRequest {
  user_id: string;
  favoritesOnly?: boolean;
}

export interface ListSavedShoppingListsResponse {
  lists: SavedShoppingList[];
}

export const listSavedShoppingLists = api<ListSavedShoppingListsRequest, ListSavedShoppingListsResponse>(
  { method: "POST", path: "/wellness/shopping-lists/saved", expose: true },
  async (req) => {
    let query = db.query<{
      id: number;
      title: string;
      shopping_list_data: string;
      is_favorite: boolean;
      created_at: Date;
      updated_at: Date;
    }>`
      SELECT id, title, shopping_list_data, is_favorite, created_at, updated_at
      FROM saved_shopping_lists
      WHERE user_id = ${req.user_id}
    `;

    if (req.favoritesOnly) {
      query = db.query<{
        id: number;
        title: string;
        shopping_list_data: string;
        is_favorite: boolean;
        created_at: Date;
        updated_at: Date;
      }>`
        SELECT id, title, shopping_list_data, is_favorite, created_at, updated_at
        FROM saved_shopping_lists
        WHERE user_id = ${req.user_id} AND is_favorite = true
      `;
    }

    const rows: any[] = [];
    for await (const row of query) {
      rows.push(row);
    }
    const lists = rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      shoppingListData: JSON.parse(row.shopping_list_data),
      isFavorite: row.is_favorite,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString()
    }));

    return { lists };
  }
);

export interface DeleteSavedShoppingListRequest {
  user_id: string;
  id: number;
}

export const deleteSavedShoppingList = api<DeleteSavedShoppingListRequest, { success: boolean }>(
  { method: "DELETE", path: "/wellness/shopping-lists/saved/:id", expose: true },
  async (req) => {
    await db.exec`
      DELETE FROM saved_shopping_lists 
      WHERE id = ${req.id} AND user_id = ${req.user_id}
    `;

    return { success: true };
  }
);
