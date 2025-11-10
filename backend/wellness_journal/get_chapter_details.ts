import { api } from "encore.dev/api";
import db from "../db";
import type { GetChapterDetailsRequest, GetChapterDetailsResponse, WellnessChapter, WellnessSection, WellnessJournalEntry } from "./types";

export const getChapterDetails = api<GetChapterDetailsRequest, GetChapterDetailsResponse>(
  { expose: true, method: "POST", path: "/wellness_journal/chapters/details" },
  async (req) => {
    const { chapter_id, user_id } = req;

    const chapter = await db.queryRow<WellnessChapter>`
      SELECT * FROM wellness_journal_chapters
      WHERE id = ${chapter_id} AND user_id = ${user_id}
    `;

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    const sectionsQuery = `
      SELECT 
        s.*,
        COUNT(DISTINCT sl.id) FILTER (WHERE sl.completed = true AND sl.log_date >= CURRENT_DATE - INTERVAL '30 days') as completion_count,
        CASE 
          WHEN s.target_count IS NOT NULL AND s.target_count > 0 THEN 
            ROUND(
              (COUNT(DISTINCT sl.id) FILTER (WHERE sl.completed = true AND sl.log_date >= CURRENT_DATE - INTERVAL '30 days')::numeric / 
               s.target_count) * 100, 
              2
            )
          ELSE 0
        END as completion_percentage
      FROM wellness_journal_sections s
      LEFT JOIN wellness_journal_section_logs sl ON sl.section_id = s.id
      WHERE s.chapter_id = $1 AND s.is_active = true
      GROUP BY s.id
      ORDER BY s.order_index ASC
    `;

    const sections = await db.rawQueryAll<WellnessSection & { completion_count?: number; completion_percentage?: number }>(
      sectionsQuery,
      chapter_id
    );

    const entries = await db.query<WellnessJournalEntry>`
      SELECT * FROM wellness_journal_entries
      WHERE chapter_id = ${chapter_id}
      ORDER BY entry_date DESC, created_at DESC
      LIMIT 10
    `;

    const recentEntries = [];
    for await (const entry of entries) {
      recentEntries.push(entry);
    }

    const totalSections = sections.length;
    const completedSections = sections.filter(s => 
      s.completion_percentage && s.completion_percentage >= 100
    ).length;
    
    const progress_percentage = totalSections > 0 
      ? Math.round((completedSections / totalSections) * 100)
      : 0;

    return {
      chapter,
      sections,
      recent_entries: recentEntries,
      progress_percentage
    };
  }
);
