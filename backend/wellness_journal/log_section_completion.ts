import { api } from "encore.dev/api";
import db from "../db";
import type { LogSectionCompletionRequest, SectionLog } from "./types";

export const logSectionCompletion = api<LogSectionCompletionRequest, SectionLog>(
  { expose: true, method: "POST", path: "/wellness_journal/sections/log" },
  async (req) => {
    const { section_id, user_id, completed, notes, metadata } = req;

    const section = await db.queryRow<{ id: number; chapter_id: number }>`
      SELECT s.id, s.chapter_id
      FROM wellness_journal_sections s
      JOIN wellness_journal_chapters c ON c.id = s.chapter_id
      WHERE s.id = ${section_id} AND c.user_id = ${user_id}
    `;

    if (!section) {
      throw new Error("Section not found");
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const existing = await db.queryRow<{ id: number }>`
      SELECT id FROM wellness_journal_section_logs
      WHERE section_id = ${section_id} 
        AND user_id = ${user_id}
        AND log_date = ${today}
    `;

    let log: SectionLog | null = null;

    if (existing) {
      log = await db.queryRow<SectionLog>`
        UPDATE wellness_journal_section_logs
        SET completed = ${completed}, notes = ${notes}, metadata = ${metadata}
        WHERE id = ${existing.id}
        RETURNING *
      `;
    } else {
      log = await db.queryRow<SectionLog>`
        INSERT INTO wellness_journal_section_logs (
          section_id, user_id, log_date, completed, notes, metadata
        ) VALUES (
          ${section_id}, ${user_id}, ${today}, ${completed}, ${notes}, ${metadata}
        )
        RETURNING *
      `;
    }

    if (!log) {
      throw new Error("Failed to log section completion");
    }

    return log;
  }
);
