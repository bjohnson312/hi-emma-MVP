import type { NutritionInfo, MacroTargets, Meal, Ingredient } from '../types';

export function calculateMacroPercentages(nutrition: NutritionInfo): {
  protein: number;
  carbs: number;
  fats: number;
} {
  const totalCals = nutrition.protein * 4 + nutrition.carbs * 4 + nutrition.fats * 9;
  if (totalCals === 0) return { protein: 0, carbs: 0, fats: 0 };

  return {
    protein: Math.round((nutrition.protein * 4 / totalCals) * 100),
    carbs: Math.round((nutrition.carbs * 4 / totalCals) * 100),
    fats: Math.round((nutrition.fats * 9 / totalCals) * 100),
  };
}

export function groupIngredients(meals: Meal[]): Map<string, Ingredient> {
  const grouped = new Map<string, Ingredient>();

  meals.forEach(meal => {
    meal.ingredients.forEach(ingredient => {
      const key = ingredient.name.toLowerCase();
      const existing = grouped.get(key);

      if (existing && existing.unit === ingredient.unit) {
        existing.amount += ingredient.amount;
      } else {
        grouped.set(key, { ...ingredient });
      }
    });
  });

  return grouped;
}

export function validateNutritionInfo(nutrition: NutritionInfo): boolean {
  return (
    nutrition.calories >= 0 &&
    nutrition.protein >= 0 &&
    nutrition.carbs >= 0 &&
    nutrition.fats >= 0
  );
}
