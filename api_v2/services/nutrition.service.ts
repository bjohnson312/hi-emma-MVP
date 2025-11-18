import type {
  NutritionPreferences,
  GeneratePlanRequest,
  NutritionPlan,
  GenerateWeeklyMealPlanRequest,
  WeeklyMealPlan,
  AnalyzeImageRequest,
  AnalyzeImageResponse,
  NutritionStats,
  ShoppingList,
} from '../types';

export class NutritionService {
  async getPreferences(userId: string): Promise<NutritionPreferences> {
    throw new Error('getPreferences() not implemented');
  }

  async updatePreferences(userId: string, prefs: NutritionPreferences): Promise<NutritionPreferences> {
    throw new Error('updatePreferences() not implemented');
  }

  async generatePlan(userId: string, req: GeneratePlanRequest): Promise<NutritionPlan> {
    throw new Error('generatePlan() not implemented');
  }

  async getCurrentPlan(userId: string): Promise<NutritionPlan> {
    throw new Error('getCurrentPlan() not implemented');
  }

  async generateWeeklyMealPlan(userId: string, req: GenerateWeeklyMealPlanRequest): Promise<WeeklyMealPlan> {
    throw new Error('generateWeeklyMealPlan() not implemented');
  }

  async getCurrentWeeklyMealPlan(userId: string): Promise<WeeklyMealPlan> {
    throw new Error('getCurrentWeeklyMealPlan() not implemented');
  }

  async generateShoppingList(userId: string, mealPlanId: string): Promise<ShoppingList> {
    throw new Error('generateShoppingList() not implemented');
  }

  async analyzeImage(userId: string, req: AnalyzeImageRequest): Promise<AnalyzeImageResponse> {
    throw new Error('analyzeImage() not implemented');
  }

  async getStats(userId: string, period: 'week' | 'month'): Promise<NutritionStats> {
    throw new Error('getStats() not implemented');
  }
}

export const nutritionService = new NutritionService();
