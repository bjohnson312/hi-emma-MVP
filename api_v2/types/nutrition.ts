export interface NutritionPreferences {
  goals: string[];
  restrictions: string[];
  allergies: string[];
  preferredCuisines: string[];
  mealsPerDay: number;
  dislikedFoods?: string[];
}

export interface GeneratePlanRequest {
  preferences?: Partial<NutritionPreferences>;
  duration: 'week' | 'month';
}

export interface NutritionPlan {
  id: string;
  userId: string;
  goals: string[];
  dailyCalories: number;
  macros: MacroTargets;
  recommendations: string[];
  createdAt: string;
  active: boolean;
}

export interface MacroTargets {
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
}

export interface GenerateWeeklyMealPlanRequest {
  planId?: string;
  preferences?: Partial<NutritionPreferences>;
  weekOf?: string;
}

export interface WeeklyMealPlan {
  id: string;
  userId: string;
  planId: string;
  weekOf: string;
  meals: DailyMeals[];
  shoppingListId?: string;
  createdAt: string;
}

export interface DailyMeals {
  date: string;
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  snacks?: Meal[];
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  nutrition: NutritionInfo;
  prepTime: number;
  cookTime: number;
  servings: number;
  recipe?: string;
  imageUrl?: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface AnalyzeImageRequest {
  imageData: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface AnalyzeImageResponse {
  detected: string[];
  nutritionEstimate: NutritionInfo;
  suggestions: string[];
  confidence: number;
}

export interface ShoppingList {
  id: string;
  mealPlanId: string;
  items: ShoppingListItem[];
  createdAt: string;
}

export interface ShoppingListItem {
  ingredient: string;
  amount: number;
  unit: string;
  category: string;
  checked: boolean;
}

export interface NutritionStats {
  period: 'week' | 'month';
  averageCalories: number;
  averageMacros: MacroTargets;
  adherence: number;
  mealsLogged: number;
  trends: NutritionTrend[];
}

export interface NutritionTrend {
  date: string;
  calories: number;
  macros: MacroTargets;
}

export interface LogMealRequest {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal: Partial<Meal>;
  timestamp?: string;
}

export interface UpdateMealPlanRequest {
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  meal: Partial<Meal>;
}
