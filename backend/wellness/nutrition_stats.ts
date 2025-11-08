import { api } from "encore.dev/api";
import db from "../db";

interface GetNutritionStatsRequest {
  user_id: string;
}

interface DailyAchievement {
  date: Date;
  overall_percentage: number;
  achieved: boolean;
}

interface NutritionStats {
  total_days_tracked: number;
  days_achieved: number;
  current_streak: number;
  longest_streak: number;
  recent_achievements: DailyAchievement[];
}

export const getNutritionStats = api<GetNutritionStatsRequest, NutritionStats>(
  { expose: true, method: "GET", path: "/wellness/nutrition-stats/:user_id" },
  async (req) => {
    const achievements = await db.queryAll<{
      date: Date;
      overall_percentage: number;
      achieved: boolean;
    }>`
      SELECT date, overall_percentage, achieved
      FROM nutrition_daily_achievements
      WHERE user_id = ${req.user_id}
      ORDER BY date DESC
    `;

    const totalDays = achievements.length;
    const daysAchieved = achievements.filter(a => a.achieved).length;

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sortedAchievements = [...achievements].reverse();
    
    for (let i = 0; i < sortedAchievements.length; i++) {
      const achievement = sortedAchievements[i];
      const achievementDate = new Date(achievement.date);
      achievementDate.setHours(0, 0, 0, 0);

      if (achievement.achieved) {
        tempStreak++;
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
        
        const daysDiff = Math.floor((today.getTime() - achievementDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff === i) {
          currentStreak = tempStreak;
        }
      } else {
        tempStreak = 0;
      }
    }

    return {
      total_days_tracked: totalDays,
      days_achieved: daysAchieved,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      recent_achievements: achievements.slice(0, 7)
    };
  }
);

interface CalculateDailyAchievementRequest {
  user_id: string;
  date: Date;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  water_oz: number;
  calorie_target: number;
  protein_target: number;
  carbs_target: number;
  fat_target: number;
  water_target: number;
}

interface CalculateDailyAchievementResponse {
  overall_percentage: number;
  goals_met: number;
  achieved: boolean;
}

export const calculateDailyAchievement = api<CalculateDailyAchievementRequest, CalculateDailyAchievementResponse>(
  { expose: true, method: "POST", path: "/wellness/nutrition-achievement/calculate" },
  async (req) => {
    const caloriePercentage = req.calorie_target > 0 ? Math.min((req.calories / req.calorie_target) * 100, 100) : 0;
    const proteinPercentage = req.protein_target > 0 ? Math.min((req.protein_g / req.protein_target) * 100, 100) : 0;
    const carbsPercentage = req.carbs_target > 0 ? Math.min((req.carbs_g / req.carbs_target) * 100, 100) : 0;
    const fatPercentage = req.fat_target > 0 ? Math.min((req.fat_g / req.fat_target) * 100, 100) : 0;
    const waterPercentage = req.water_target > 0 ? Math.min((req.water_oz / req.water_target) * 100, 100) : 0;

    const overallPercentage = (caloriePercentage + proteinPercentage + carbsPercentage + fatPercentage + waterPercentage) / 5;

    const threshold = 80;
    let goalsMet = 0;
    if (caloriePercentage >= threshold) goalsMet++;
    if (proteinPercentage >= threshold) goalsMet++;
    if (carbsPercentage >= threshold) goalsMet++;
    if (fatPercentage >= threshold) goalsMet++;
    if (waterPercentage >= threshold) goalsMet++;

    const achieved = goalsMet >= 4;

    await db.exec`
      INSERT INTO nutrition_daily_achievements 
        (user_id, date, calorie_percentage, protein_percentage, carbs_percentage, 
         fat_percentage, water_percentage, overall_percentage, goals_met, total_goals, achieved)
      VALUES 
        (${req.user_id}, ${req.date}, ${caloriePercentage}, ${proteinPercentage}, 
         ${carbsPercentage}, ${fatPercentage}, ${waterPercentage}, ${overallPercentage}, 
         ${goalsMet}, 5, ${achieved})
      ON CONFLICT (user_id, date) DO UPDATE
      SET calorie_percentage = EXCLUDED.calorie_percentage,
          protein_percentage = EXCLUDED.protein_percentage,
          carbs_percentage = EXCLUDED.carbs_percentage,
          fat_percentage = EXCLUDED.fat_percentage,
          water_percentage = EXCLUDED.water_percentage,
          overall_percentage = EXCLUDED.overall_percentage,
          goals_met = EXCLUDED.goals_met,
          achieved = EXCLUDED.achieved
    `;

    return {
      overall_percentage: Math.round(overallPercentage),
      goals_met: goalsMet,
      achieved
    };
  }
);
