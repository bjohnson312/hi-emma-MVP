export interface MealItem {
  name: string;
  description: string;
  calories?: number;
  protein_g?: number;
  carbs_g?: number;
  fat_g?: number;
  ingredients?: string[];
}

export interface DayMealPlan {
  breakfast: MealItem;
  lunch: MealItem;
  dinner: MealItem;
  snacks: MealItem[];
}

export interface WeeklyMealPlan {
  monday: DayMealPlan;
  tuesday: DayMealPlan;
  wednesday: DayMealPlan;
  thursday: DayMealPlan;
  friday: DayMealPlan;
  saturday: DayMealPlan;
  sunday: DayMealPlan;
}

export interface ShoppingListItem {
  item: string;
  quantity: string;
  category: string;
}

export interface ShoppingList {
  produce: ShoppingListItem[];
  proteins: ShoppingListItem[];
  dairy: ShoppingListItem[];
  grains: ShoppingListItem[];
  pantry: ShoppingListItem[];
  other: ShoppingListItem[];
}

export interface GenerateMealPlanRequest {
  user_id: string;
  week_start_date?: string;
}

export interface GenerateMealPlanResponse {
  plan_id: number;
  week_start_date: string;
  plan_data: WeeklyMealPlan;
}

export interface GetMealPlanRequest {
  user_id: string;
  week_start_date?: string;
}

export interface GetMealPlanResponse {
  plan_id: number | null;
  week_start_date: string;
  plan_data: WeeklyMealPlan | null;
  has_plan: boolean;
}

export interface UpdateMealPlanRequest {
  plan_id: number;
  user_id: string;
  plan_data: WeeklyMealPlan;
}

export interface UpdateMealPlanResponse {
  success: boolean;
}

export interface GenerateShoppingListRequest {
  plan_id: number;
  user_id: string;
}

export interface GenerateShoppingListResponse {
  shopping_list: ShoppingList;
}
