import { api } from "encore.dev/api";
import db from "../db";
import { getBehaviorPatterns } from "./personalization";

export interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  action?: string;
  priority: "high" | "medium" | "low";
  reasoning: string;
}

export interface GetRecommendationsRequest {
  user_id: string;
}

export interface GetRecommendationsResponse {
  recommendations: Recommendation[];
}

export const getRecommendations = api(
  { method: "POST", path: "/profile/recommendations", expose: true },
  async (req: GetRecommendationsRequest): Promise<GetRecommendationsResponse> => {
    const recommendations: Recommendation[] = [];

    const patterns = await getBehaviorPatterns(req.user_id);
    
    const profile = await db.queryRow`
      SELECT interaction_count, wake_time, wellness_goals FROM user_profiles WHERE user_id = ${req.user_id}
    `;

    const interactionCount = profile?.interaction_count || 0;

    const sleepPattern = patterns.find(p => p.pattern_type === "sleep_quality");
    if (sleepPattern && sleepPattern.confidence_score > 0.7) {
      if (sleepPattern.pattern_data.typical_quality === "poor" || sleepPattern.pattern_data.typical_quality === "terrible") {
        recommendations.push({
          id: "sleep_improvement",
          category: "sleep",
          title: "Improve Your Sleep Quality",
          description: "You've been reporting poor sleep quality. Let's work on building better sleep habits together.",
          action: "Start an evening routine",
          priority: "high",
          reasoning: `Based on ${sleepPattern.observation_count} sleep reports`
        });
      } else if (sleepPattern.pattern_data.typical_quality === "excellent") {
        recommendations.push({
          id: "maintain_sleep",
          category: "sleep",
          title: "Keep Up the Great Sleep!",
          description: "Your sleep quality has been excellent. Whatever you're doing is working!",
          priority: "low",
          reasoning: `Based on ${sleepPattern.observation_count} excellent sleep reports`
        });
      }
    }

    const morningActivityPattern = patterns.find(p => p.pattern_type === "morning_activity");
    if (morningActivityPattern && morningActivityPattern.confidence_score > 0.6) {
      if (morningActivityPattern.pattern_data.preferred_activity === "gratitude") {
        recommendations.push({
          id: "expand_gratitude",
          category: "wellness",
          title: "Deepen Your Gratitude Practice",
          description: "You love gratitude practice. Consider keeping a gratitude journal to track what you're thankful for.",
          action: "Start gratitude journaling",
          priority: "medium",
          reasoning: "Based on your consistent gratitude practice preference"
        });
      }
    }

    const morningLogsQuery = await db.query`
      SELECT sleep_quality FROM morning_routine_logs 
       WHERE user_id = ${req.user_id}
       ORDER BY created_at DESC LIMIT 7
    `;
    const morningLogs = [];
    for await (const log of morningLogsQuery) {
      morningLogs.push(log);
    }

    if (morningLogs.length >= 7) {
      recommendations.push({
        id: "consistent_routine",
        category: "achievement",
        title: "7-Day Streak!",
        description: "You've checked in for 7 days in a row! Consistency is key to building lasting wellness habits.",
        priority: "medium",
        reasoning: "7 consecutive morning check-ins"
      });
    }

    const moodLogsQuery = await db.query`
      SELECT mood_rating, energy_level FROM mood_logs 
       WHERE user_id = ${req.user_id}
       ORDER BY created_at DESC LIMIT 14
    `;
    const moodLogs = [];
    for await (const log of moodLogsQuery) {
      moodLogs.push(log);
    }

    if (moodLogs.length >= 7) {
      const avgMood = moodLogs.reduce((sum: number, log: any) => sum + (log.mood_rating || 3), 0) / moodLogs.length;
      
      if (avgMood < 2.5) {
        recommendations.push({
          id: "mood_support",
          category: "wellness",
          title: "Let's Talk About Your Mood",
          description: "I've noticed your mood has been lower lately. Would you like to talk about what's going on?",
          action: "Start a conversation",
          priority: "high",
          reasoning: "Based on recent mood patterns"
        });
      }
    }

    if (interactionCount >= 30 && !profile?.wellness_goals) {
      recommendations.push({
        id: "set_goals",
        category: "planning",
        title: "Set Your Wellness Goals",
        description: "You've been consistent for a month! Let's define some personal wellness goals to work towards.",
        action: "Set wellness goals",
        priority: "medium",
        reasoning: "30+ days of engagement without defined goals"
      });
    }

    try {
      const journalEntriesQuery = await db.query`
        SELECT COUNT(*) as count FROM wellness_journal_entries 
         WHERE user_id = ${req.user_id} AND ai_generated = false
      `;
      const journalEntries = [];
      for await (const entry of journalEntriesQuery) {
        journalEntries.push(entry);
      }

      const manualEntryCount = journalEntries[0]?.count || 0;
      if (interactionCount >= 10 && manualEntryCount === 0) {
        recommendations.push({
          id: "try_journaling",
          category: "wellness",
          title: "Try Personal Journaling",
          description: "Journaling can help you process thoughts and track your progress. Want to give it a try?",
          action: "Write a journal entry",
          priority: "low",
          reasoning: "You haven't tried manual journaling yet"
        });
      }
    } catch (error) {
      console.error('Error loading journal entry recommendations:', error);
    }

    return { recommendations: recommendations.slice(0, 5) };
  }
);
