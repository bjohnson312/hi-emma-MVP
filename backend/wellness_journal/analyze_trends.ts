import { api } from "encore.dev/api";
import db from "../db";
import { createInsight } from "../profile/personalization";

export interface AnalyzeTrendsRequest {
  user_id: string;
  days?: number;
}

export interface TrendAnalysis {
  sleep_trend?: {
    average_quality: string;
    improving: boolean;
    pattern: string;
  };
  mood_trend?: {
    average_rating: number;
    improving: boolean;
    best_time_of_day?: string;
  };
  energy_trend?: {
    average_level: number;
    improving: boolean;
    peak_hours?: string;
  };
  activity_patterns?: {
    most_consistent_activity?: string;
    completion_rate?: number;
  };
  insights_generated: number;
}

export const analyzeTrends = api(
  { method: "POST", path: "/wellness_journal/analyze", expose: true },
  async (req: AnalyzeTrendsRequest): Promise<TrendAnalysis> => {
    const days = req.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const morningLogsQuery = await db.query`
      SELECT sleep_quality, selected_action, created_at
      FROM morning_routine_logs
      WHERE user_id = ${req.user_id} AND created_at >= ${startDate}
      ORDER BY created_at DESC
    `;
    const morningLogs = [];
    for await (const log of morningLogsQuery) {
      morningLogs.push(log);
    }

    const moodLogsQuery = await db.query`
      SELECT mood_rating, energy_level, stress_level, created_at
      FROM mood_logs
      WHERE user_id = ${req.user_id} AND created_at >= ${startDate}
      ORDER BY created_at DESC
    `;
    const moodLogs = [];
    for await (const log of moodLogsQuery) {
      moodLogs.push(log);
    }

    const analysis: TrendAnalysis = {
      insights_generated: 0
    };

    if (morningLogs.length > 5) {
      const sleepQualities = morningLogs.map((log: any) => log.sleep_quality);
      const qualityScores: Record<string, number> = {
        excellent: 5,
        good: 4,
        fair: 3,
        poor: 2,
        terrible: 1
      };

      const avgScore = sleepQualities.reduce((sum: number, q: string) => 
        sum + (qualityScores[q] || 3), 0) / sleepQualities.length;

      const recentLogs = sleepQualities.slice(0, 7);
      const olderLogs = sleepQualities.slice(7, 14);
      
      const recentAvg = recentLogs.reduce((sum: number, q: string) => 
        sum + (qualityScores[q] || 3), 0) / Math.max(recentLogs.length, 1);

      const olderAvg = olderLogs.reduce((sum: number, q: string) => 
        sum + (qualityScores[q] || 3), 0) / Math.max(olderLogs.length, 1);

      const improving = recentAvg > olderAvg;

      const avgQuality = avgScore >= 4.5 ? "excellent" : avgScore >= 3.5 ? "good" : avgScore >= 2.5 ? "fair" : "poor";

      analysis.sleep_trend = {
        average_quality: avgQuality,
        improving,
        pattern: improving ? "Your sleep quality is improving!" : "Your sleep could use some attention"
      };

      if (improving && avgScore >= 4) {
        await createInsight(
          req.user_id,
          "sleep_improvement",
          "wellness",
          "🌙 Sleep Quality Improving!",
          `Your sleep quality has been getting better over the past ${days} days. Keep up the good work with your bedtime routine!`,
          [
            "Continue your current bedtime routine",
            "Track what helps you sleep best",
            "Consider setting a consistent sleep schedule"
          ],
          { average_score: avgScore, recent_avg: recentAvg, trend: "improving" }
        );
        analysis.insights_generated++;
      } else if (!improving && avgScore < 3) {
        await createInsight(
          req.user_id,
          "sleep_concern",
          "wellness",
          "💤 Let's Improve Your Sleep",
          `Your sleep quality has averaged ${avgQuality} over the past ${days} days. Let's work on improving this together.`,
          [
            "Try establishing a consistent bedtime routine",
            "Limit screen time before bed",
            "Consider meditation or relaxation exercises",
            "Track what might be affecting your sleep"
          ],
          { average_score: avgScore, recent_avg: recentAvg, trend: "declining" }
        );
        analysis.insights_generated++;
      }
    }

    if (moodLogs.length > 5) {
      const moodRatings = moodLogs.map((log: any) => log.mood_rating).filter((r: any) => r);
      const energyLevels = moodLogs.map((log: any) => log.energy_level).filter((e: any) => e);

      if (moodRatings.length > 0) {
        const avgMood = moodRatings.reduce((sum: number, rating: number) => sum + rating, 0) / moodRatings.length;
        const recentMoods = moodRatings.slice(0, 5);
        const olderMoods = moodRatings.slice(5, 10);
        
        const recentMood = recentMoods.reduce((sum: number, rating: number) => sum + rating, 0) / Math.max(recentMoods.length, 1);
        const olderMood = olderMoods.reduce((sum: number, rating: number) => sum + rating, 0) / Math.max(olderMoods.length, 1);

        analysis.mood_trend = {
          average_rating: Math.round(avgMood * 10) / 10,
          improving: recentMood > olderMood
        };

        if (avgMood >= 4) {
          await createInsight(
            req.user_id,
            "positive_mood",
            "wellness",
            "😊 You're Doing Great!",
            `Your mood has been consistently positive with an average rating of ${analysis.mood_trend.average_rating}/5. That's wonderful!`,
            [
              "Keep doing what makes you happy",
              "Share your positive practices with others",
              "Reflect on what's been working well"
            ],
            { average_mood: avgMood, trend: "positive" }
          );
          analysis.insights_generated++;
        }
      }

      if (energyLevels.length > 0) {
        const avgEnergy = energyLevels.reduce((sum: number, level: number) => sum + level, 0) / energyLevels.length;
        const recentEnergies = energyLevels.slice(0, 5);
        const olderEnergies = energyLevels.slice(5, 10);
        
        const recentEnergy = recentEnergies.reduce((sum: number, level: number) => sum + level, 0) / Math.max(recentEnergies.length, 1);
        const olderEnergy = olderEnergies.reduce((sum: number, level: number) => sum + level, 0) / Math.max(olderEnergies.length, 1);

        analysis.energy_trend = {
          average_level: Math.round(avgEnergy * 10) / 10,
          improving: recentEnergy > olderEnergy
        };

        if (avgEnergy < 3 && energyLevels.length >= 7) {
          await createInsight(
            req.user_id,
            "low_energy",
            "wellness",
            "⚡ Energy Boost Needed",
            `Your energy levels have been lower than usual. Let's explore ways to help you feel more energized.`,
            [
              "Review your sleep quality and duration",
              "Consider your nutrition and hydration",
              "Take short breaks for movement during the day",
              "Check in with your doctor if this persists"
            ],
            { average_energy: avgEnergy, trend: "low" }
          );
          analysis.insights_generated++;
        }
      }
    }

    if (morningLogs.length > 10) {
      const activities: Record<string, number> = {};
      morningLogs.forEach((log: any) => {
        if (log.selected_action) {
          activities[log.selected_action] = (activities[log.selected_action] || 0) + 1;
        }
      });

      const mostConsistent = Object.entries(activities).sort((a, b) => b[1] - a[1])[0];
      if (mostConsistent) {
        analysis.activity_patterns = {
          most_consistent_activity: mostConsistent[0],
          completion_rate: Math.round((mostConsistent[1] / morningLogs.length) * 100)
        };

        if (mostConsistent[1] >= 7) {
          await createInsight(
            req.user_id,
            "consistency_achievement",
            "achievement",
            "🎯 Consistency Champion!",
            `You've chosen ${mostConsistent[0]} ${mostConsistent[1]} times! Building consistent habits is key to lasting wellness.`,
            [
              "Continue building on this consistency",
              "Consider adding complementary practices",
              "Track how this habit affects your day"
            ],
            { activity: mostConsistent[0], count: mostConsistent[1] }
          );
          analysis.insights_generated++;
        }
      }
    }

    return analysis;
  }
);
