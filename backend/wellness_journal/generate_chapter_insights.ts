import { api } from "encore.dev/api";
import db from "../db";
import type { ChapterInsight } from "./types";

interface GenerateChapterInsightsRequest {
  chapter_id: number;
  user_id: string;
  days?: number;
}

interface GenerateChapterInsightsResponse {
  insights: ChapterInsight[];
  summary: string;
}

export const generateChapterInsights = api<GenerateChapterInsightsRequest, GenerateChapterInsightsResponse>(
  { expose: true, method: "POST", path: "/wellness_journal/chapters/insights" },
  async (req) => {
    const { chapter_id, user_id, days = 30 } = req;

    const chapter = await db.queryRow<{ id: number; title: string; user_id: string }>`
      SELECT id, title, user_id
      FROM wellness_journal_chapters
      WHERE id = ${chapter_id} AND user_id = ${user_id}
    `;

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const sections = await db.query<{ id: number; title: string; tracking_frequency: string; target_count: number | null }>`
      SELECT id, title, tracking_frequency, target_count
      FROM wellness_journal_sections
      WHERE chapter_id = ${chapter_id} AND is_active = true
    `;

    const sectionsList = [];
    for await (const section of sections) {
      sectionsList.push(section);
    }

    const insights: ChapterInsight[] = [];
    const insightTexts: string[] = [];

    for (const section of sectionsList) {
      const logs = await db.query<{ log_date: Date; completed: boolean }>`
        SELECT log_date, completed
        FROM wellness_journal_section_logs
        WHERE section_id = ${section.id} 
          AND log_date >= ${sinceDate}
        ORDER BY log_date DESC
      `;

      const logsList = [];
      for await (const log of logs) {
        logsList.push(log);
      }

      const completedCount = logsList.filter(l => l.completed).length;
      const totalDays = logsList.length;
      const completionRate = totalDays > 0 ? (completedCount / totalDays) * 100 : 0;

      if (completionRate >= 80) {
        const insightText = `You're doing excellent with "${section.title}" - ${Math.round(completionRate)}% completion rate over the last ${days} days!`;
        insightTexts.push(insightText);
        insights.push({
          chapter_id,
          insight_text: insightText,
          metric_type: "completion_rate",
          metric_value: Math.round(completionRate),
          generated_at: new Date()
        });
      } else if (completionRate < 40) {
        const insightText = `"${section.title}" needs attention - only ${Math.round(completionRate)}% completion. Consider what might help you stay consistent.`;
        insightTexts.push(insightText);
        insights.push({
          chapter_id,
          insight_text: insightText,
          metric_type: "completion_rate",
          metric_value: Math.round(completionRate),
          generated_at: new Date()
        });
      }

      let currentStreak = 0;
      for (const log of logsList) {
        if (log.completed) {
          currentStreak++;
        } else {
          break;
        }
      }

      if (currentStreak >= 7) {
        const insightText = `Amazing ${currentStreak}-day streak on "${section.title}"! You're building a strong habit.`;
        insightTexts.push(insightText);
        insights.push({
          chapter_id,
          insight_text: insightText,
          metric_type: "streak",
          metric_value: currentStreak,
          generated_at: new Date()
        });
      }
    }

    const entries = await db.query<{ mood_rating: number | null; entry_date: Date }>`
      SELECT mood_rating, entry_date
      FROM wellness_journal_entries
      WHERE chapter_id = ${chapter_id}
        AND entry_date >= ${sinceDate}
        AND mood_rating IS NOT NULL
      ORDER BY entry_date DESC
    `;

    const moodRatings: number[] = [];
    for await (const entry of entries) {
      if (entry.mood_rating) {
        moodRatings.push(entry.mood_rating);
      }
    }

    if (moodRatings.length >= 5) {
      const avgMood = moodRatings.reduce((sum, r) => sum + r, 0) / moodRatings.length;
      const recentMood = moodRatings.slice(0, Math.min(7, moodRatings.length));
      const recentAvg = recentMood.reduce((sum, r) => sum + r, 0) / recentMood.length;
      
      if (recentAvg > avgMood + 0.5) {
        const insightText = `Your mood has been trending upward recently in this chapter - from ${avgMood.toFixed(1)} to ${recentAvg.toFixed(1)} average!`;
        insightTexts.push(insightText);
        insights.push({
          chapter_id,
          insight_text: insightText,
          metric_type: "mood_trend",
          metric_value: { overall: avgMood.toFixed(1), recent: recentAvg.toFixed(1), improving: true },
          generated_at: new Date()
        });
      }
    }

    const totalSections = sectionsList.length;
    const allLogs = await db.query<{ section_id: number; completed: boolean }>`
      SELECT sl.section_id, sl.completed
      FROM wellness_journal_section_logs sl
      JOIN wellness_journal_sections s ON s.id = sl.section_id
      WHERE s.chapter_id = ${chapter_id}
        AND sl.log_date >= ${sinceDate}
    `;

    const logsArray = [];
    for await (const log of allLogs) {
      logsArray.push(log);
    }

    const overallCompletion = logsArray.length > 0 
      ? (logsArray.filter(l => l.completed).length / logsArray.length) * 100 
      : 0;

    let summary = `In your "${chapter.title}" chapter over the last ${days} days: `;
    summary += `${totalSections} habit${totalSections !== 1 ? 's' : ''} tracked with ${Math.round(overallCompletion)}% overall completion. `;
    
    if (insights.length > 0) {
      summary += `Generated ${insights.length} insight${insights.length !== 1 ? 's' : ''}.`;
    } else {
      summary += `Keep building your habits to unlock insights!`;
    }

    return {
      insights,
      summary
    };
  }
);
