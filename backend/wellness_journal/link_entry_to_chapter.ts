import { api } from "encore.dev/api";
import db from "../db";

interface LinkEntryToChapterRequest {
  entry_id: number;
  user_id: string;
  chapter_id?: number;
  section_id?: number;
}

export const linkEntryToChapter = api<LinkEntryToChapterRequest, { success: boolean }>(
  { expose: true, method: "POST", path: "/wellness_journal/entries/link" },
  async (req) => {
    const { entry_id, user_id, chapter_id, section_id } = req;

    const entry = await db.queryRow<{ id: number; user_id: string }>`
      SELECT id, user_id FROM wellness_journal_entries
      WHERE id = ${entry_id} AND user_id = ${user_id}
    `;

    if (!entry) {
      throw new Error("Entry not found");
    }

    if (chapter_id) {
      const chapter = await db.queryRow<{ id: number }>`
        SELECT id FROM wellness_journal_chapters
        WHERE id = ${chapter_id} AND user_id = ${user_id}
      `;

      if (!chapter) {
        throw new Error("Chapter not found");
      }
    }

    if (section_id) {
      const section = await db.queryRow<{ id: number; chapter_id: number }>`
        SELECT s.id, s.chapter_id
        FROM wellness_journal_sections s
        JOIN wellness_journal_chapters c ON c.id = s.chapter_id
        WHERE s.id = ${section_id} AND c.user_id = ${user_id}
      `;

      if (!section) {
        throw new Error("Section not found");
      }
    }

    await db.exec`
      UPDATE wellness_journal_entries
      SET chapter_id = ${chapter_id || null},
          section_id = ${section_id || null},
          updated_at = NOW()
      WHERE id = ${entry_id}
    `;

    return { success: true };
  }
);

export async function autoLinkEntryToChapter(
  userId: string,
  entryId: number,
  sourceType?: string
): Promise<void> {
  const activeChapters = await db.query<{ id: number; title: string; description: string }>`
    SELECT id, title, description
    FROM wellness_journal_chapters
    WHERE user_id = ${userId} AND is_active = true
    ORDER BY created_at DESC
    LIMIT 5
  `;

  const chapters = [];
  for await (const chapter of activeChapters) {
    chapters.push(chapter);
  }

  if (chapters.length === 0) {
    return;
  }

  let matchedChapterId: number | null = null;

  if (sourceType === "morning_routine") {
    const sleepChapter = chapters.find(c => 
      c.title.toLowerCase().includes("sleep") || 
      c.description?.toLowerCase().includes("sleep")
    );
    if (sleepChapter) matchedChapterId = sleepChapter.id;
  }

  if (sourceType === "mood") {
    const stressChapter = chapters.find(c => 
      c.title.toLowerCase().includes("stress") || 
      c.title.toLowerCase().includes("anxiety") ||
      c.description?.toLowerCase().includes("stress")
    );
    if (stressChapter) matchedChapterId = stressChapter.id;
  }

  if (sourceType === "nutrition") {
    const nutritionChapter = chapters.find(c => 
      c.title.toLowerCase().includes("eat") || 
      c.title.toLowerCase().includes("food") ||
      c.title.toLowerCase().includes("nutrition")
    );
    if (nutritionChapter) matchedChapterId = nutritionChapter.id;
  }

  if (sourceType === "medication") {
    const medicationChapter = chapters.find(c => 
      c.title.toLowerCase().includes("medication") ||
      c.title.toLowerCase().includes("consistent")
    );
    if (medicationChapter) matchedChapterId = medicationChapter.id;
  }

  if (!matchedChapterId && chapters.length > 0) {
    matchedChapterId = chapters[0].id;
  }

  if (matchedChapterId) {
    await db.exec`
      UPDATE wellness_journal_entries
      SET chapter_id = ${matchedChapterId},
          updated_at = NOW()
      WHERE id = ${entryId}
    `;
  }
}
