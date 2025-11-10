import { api } from "encore.dev/api";
import db from "../db";
import type { GetChaptersRequest, GetChaptersResponse, WellnessChapter } from "./types";

export const getChapters = api<GetChaptersRequest, GetChaptersResponse>(
  { expose: true, method: "POST", path: "/wellness_journal/chapters/list" },
  async (req) => {
    const { user_id, include_completed = false } = req;

    let query = `
      SELECT 
        c.*,
        COUNT(DISTINCT s.id) as section_count,
        CASE 
          WHEN COUNT(DISTINCT s.id) > 0 THEN 
            ROUND(
              (COUNT(DISTINCT CASE WHEN sl.completed = true THEN sl.id END)::numeric / 
               NULLIF(COUNT(DISTINCT s.id), 0)) * 100, 
              2
            )
          ELSE 0
        END as progress_percentage
      FROM wellness_journal_chapters c
      LEFT JOIN wellness_journal_sections s ON s.chapter_id = c.id AND s.is_active = true
      LEFT JOIN wellness_journal_section_logs sl ON sl.section_id = s.id 
        AND sl.log_date >= CURRENT_DATE - INTERVAL '7 days'
      WHERE c.user_id = $1
    `;

    const params: any[] = [user_id];

    if (!include_completed) {
      query += ` AND c.is_active = true`;
    }

    query += `
      GROUP BY c.id
      ORDER BY c.order_index ASC, c.created_at DESC
    `;

    const chapters = await db.rawQueryAll<WellnessChapter & { section_count?: number; progress_percentage?: number }>(
      query,
      ...params
    );

    return { chapters };
  }
);
