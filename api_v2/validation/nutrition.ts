import { z } from 'zod';

export const nutritionPreferencesSchema = z.object({
  goals: z.array(z.string()),
  restrictions: z.array(z.string()),
  allergies: z.array(z.string()),
  preferredCuisines: z.array(z.string()),
  mealsPerDay: z.number().min(1).max(6),
  dislikedFoods: z.array(z.string()).optional(),
});

export const generatePlanSchema = z.object({
  preferences: nutritionPreferencesSchema.partial().optional(),
  duration: z.enum(['week', 'month']),
});

export const generateWeeklyMealPlanSchema = z.object({
  planId: z.string().uuid().optional(),
  preferences: nutritionPreferencesSchema.partial().optional(),
  weekOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const analyzeImageSchema = z.object({
  imageData: z.string().min(1, 'Image data is required'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
});

export const logMealSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  meal: z.object({
    name: z.string(),
    description: z.string().optional(),
    ingredients: z.array(z.object({
      name: z.string(),
      amount: z.number(),
      unit: z.string(),
    })).optional(),
    nutrition: z.object({
      calories: z.number(),
      protein: z.number(),
      carbs: z.number(),
      fats: z.number(),
    }).optional(),
  }),
  timestamp: z.string().optional(),
});
