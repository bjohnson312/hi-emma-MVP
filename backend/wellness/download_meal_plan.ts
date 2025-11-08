import { api } from "encore.dev/api";

export interface DownloadMealPlanRequest {
  mealPlanData: any;
  format: "pdf" | "csv";
}

export interface DownloadResponse {
  content: string;
  filename: string;
  contentType: string;
}

export const downloadMealPlan = api<DownloadMealPlanRequest, DownloadResponse>(
  { method: "POST", path: "/wellness/meal-plans/download", expose: true },
  async (req) => {
    if (req.format === "csv") {
      const csv = generateMealPlanCSV(req.mealPlanData);
      return {
        content: csv,
        filename: `meal-plan-${new Date().toISOString().split('T')[0]}.csv`,
        contentType: "text/csv"
      };
    } else {
      const html = generateMealPlanHTML(req.mealPlanData);
      return {
        content: html,
        filename: `meal-plan-${new Date().toISOString().split('T')[0]}.html`,
        contentType: "text/html"
      };
    }
  }
);

function generateMealPlanCSV(mealPlan: any): string {
  let csv = "Day,Meal Type,Recipe,Description,Calories,Protein,Carbs,Fats\n";
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    const dayMeals = mealPlan[day];
    if (!dayMeals) continue;
    
    const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
    
    if (dayMeals.breakfast) {
      const meal = dayMeals.breakfast;
      csv += `"${dayLabel}","Breakfast","${meal.name || ''}","${meal.description || ''}","${meal.calories || 0}","${meal.protein_g || 0}g","${meal.carbs_g || 0}g","${meal.fat_g || 0}g"\n`;
    }
    
    if (dayMeals.lunch) {
      const meal = dayMeals.lunch;
      csv += `"${dayLabel}","Lunch","${meal.name || ''}","${meal.description || ''}","${meal.calories || 0}","${meal.protein_g || 0}g","${meal.carbs_g || 0}g","${meal.fat_g || 0}g"\n`;
    }
    
    if (dayMeals.dinner) {
      const meal = dayMeals.dinner;
      csv += `"${dayLabel}","Dinner","${meal.name || ''}","${meal.description || ''}","${meal.calories || 0}","${meal.protein_g || 0}g","${meal.carbs_g || 0}g","${meal.fat_g || 0}g"\n`;
    }
    
    if (dayMeals.snacks && Array.isArray(dayMeals.snacks)) {
      dayMeals.snacks.forEach((snack: any, idx: number) => {
        csv += `"${dayLabel}","Snack ${idx + 1}","${snack.name || ''}","${snack.description || ''}","${snack.calories || 0}","${snack.protein_g || 0}g","${snack.carbs_g || 0}g","${snack.fat_g || 0}g"\n`;
      });
    }
  }
  
  return csv;
}

function generateMealPlanHTML(mealPlan: any): string {
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Weekly Meal Plan</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; }
    .day { margin-bottom: 30px; page-break-inside: avoid; }
    .day h2 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; text-transform: capitalize; }
    .meal { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .meal h3 { margin: 0 0 10px 0; color: #1f2937; text-transform: capitalize; }
    .meal-name { font-size: 16px; font-weight: 600; margin-bottom: 5px; }
    .meal-desc { font-size: 14px; color: #4b5563; margin-bottom: 10px; }
    .nutrition { display: flex; gap: 15px; font-size: 14px; color: #6b7280; }
    .nutrition span { background: white; padding: 5px 10px; border-radius: 4px; }
    @media print { .day { page-break-after: always; } }
  </style>
</head>
<body>
  <h1>Weekly Meal Plan</h1>
  <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
`;

  for (const day of days) {
    const dayMeals = mealPlan[day];
    if (!dayMeals) continue;
    
    const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);
    html += `
  <div class="day">
    <h2>${dayLabel}</h2>
`;
    
    if (dayMeals.breakfast) {
      const meal = dayMeals.breakfast;
      html += `
    <div class="meal">
      <h3>Breakfast</h3>
      <div class="meal-name">${meal.name || 'No name'}</div>
      <div class="meal-desc">${meal.description || ''}</div>
      <div class="nutrition">
        <span>🔥 ${meal.calories || 0} cal</span>
        <span>💪 ${meal.protein_g || 0}g protein</span>
        <span>🍞 ${meal.carbs_g || 0}g carbs</span>
        <span>🥑 ${meal.fat_g || 0}g fat</span>
      </div>
    </div>
`;
    }
    
    if (dayMeals.lunch) {
      const meal = dayMeals.lunch;
      html += `
    <div class="meal">
      <h3>Lunch</h3>
      <div class="meal-name">${meal.name || 'No name'}</div>
      <div class="meal-desc">${meal.description || ''}</div>
      <div class="nutrition">
        <span>🔥 ${meal.calories || 0} cal</span>
        <span>💪 ${meal.protein_g || 0}g protein</span>
        <span>🍞 ${meal.carbs_g || 0}g carbs</span>
        <span>🥑 ${meal.fat_g || 0}g fat</span>
      </div>
    </div>
`;
    }
    
    if (dayMeals.dinner) {
      const meal = dayMeals.dinner;
      html += `
    <div class="meal">
      <h3>Dinner</h3>
      <div class="meal-name">${meal.name || 'No name'}</div>
      <div class="meal-desc">${meal.description || ''}</div>
      <div class="nutrition">
        <span>🔥 ${meal.calories || 0} cal</span>
        <span>💪 ${meal.protein_g || 0}g protein</span>
        <span>🍞 ${meal.carbs_g || 0}g carbs</span>
        <span>🥑 ${meal.fat_g || 0}g fat</span>
      </div>
    </div>
`;
    }
    
    if (dayMeals.snacks && Array.isArray(dayMeals.snacks) && dayMeals.snacks.length > 0) {
      dayMeals.snacks.forEach((snack: any, idx: number) => {
        html += `
    <div class="meal">
      <h3>Snack ${idx + 1}</h3>
      <div class="meal-name">${snack.name || 'No name'}</div>
      <div class="meal-desc">${snack.description || ''}</div>
      <div class="nutrition">
        <span>🔥 ${snack.calories || 0} cal</span>
        <span>💪 ${snack.protein_g || 0}g protein</span>
      </div>
    </div>
`;
      });
    }
    
    html += `  </div>\n`;
  }

  html += `
</body>
</html>
`;
  
  return html;
}
