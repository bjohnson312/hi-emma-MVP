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
  let csv = "Day,Meal Type,Recipe,Calories,Protein,Carbs,Fats\n";
  
  for (const [day, meals] of Object.entries(mealPlan.weeklyPlan || {})) {
    const mealsObj = meals as any;
    for (const [mealType, meal] of Object.entries(mealsObj)) {
      const mealData = meal as any;
      csv += `${day},${mealType},${mealData.recipe || ''},"${mealData.calories || 0}","${mealData.protein || 0}g","${mealData.carbs || 0}g","${mealData.fats || 0}g"\n`;
    }
  }
  
  return csv;
}

function generateMealPlanHTML(mealPlan: any): string {
  const days = Object.keys(mealPlan.weeklyPlan || {});
  
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
    .day h2 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 5px; }
    .meal { background: #f9fafb; padding: 15px; margin: 10px 0; border-radius: 8px; }
    .meal h3 { margin: 0 0 10px 0; color: #1f2937; }
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
    const meals = mealPlan.weeklyPlan[day];
    html += `
  <div class="day">
    <h2>${day}</h2>
`;
    
    for (const [mealType, meal] of Object.entries(meals as any)) {
      const mealData = meal as any;
      html += `
    <div class="meal">
      <h3>${mealType}</h3>
      <p><strong>${mealData.recipe || 'No recipe'}</strong></p>
      <div class="nutrition">
        <span>🔥 ${mealData.calories || 0} cal</span>
        <span>💪 ${mealData.protein || 0}g protein</span>
        <span>🍞 ${mealData.carbs || 0}g carbs</span>
        <span>🥑 ${mealData.fats || 0}g fats</span>
      </div>
    </div>
`;
    }
    
    html += `  </div>\n`;
  }

  html += `
</body>
</html>
`;
  
  return html;
}
