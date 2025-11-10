import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateChapterRequest, WellnessChapter } from "./types";

export const updateChapter = api<UpdateChapterRequest, WellnessChapter>(
  { expose: true, method: "POST", path: "/wellness_journal/chapters/update" },
  async (req) => {
    const { chapter_id, user_id, title, description, motivation, target_outcome, completion_vision, is_active, is_completed } = req;

    const existing = await db.queryRow<WellnessChapter>`
      SELECT * FROM wellness_journal_chapters
      WHERE id = ${chapter_id} AND user_id = ${user_id}
    `;

    if (!existing) {
      throw new Error("Chapter not found");
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      params.push(description);
      paramIndex++;
    }

    if (motivation !== undefined) {
      updates.push(`motivation = $${paramIndex}`);
      params.push(motivation);
      paramIndex++;
    }

    if (target_outcome !== undefined) {
      updates.push(`target_outcome = $${paramIndex}`);
      params.push(target_outcome);
      paramIndex++;
    }

    if (completion_vision !== undefined) {
      updates.push(`completion_vision = $${paramIndex}`);
      params.push(completion_vision);
      paramIndex++;
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }

    if (is_completed !== undefined) {
      updates.push(`is_completed = $${paramIndex}, completed_at = ${is_completed ? 'NOW()' : 'NULL'}`);
      params.push(is_completed);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE wellness_journal_chapters
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

    params.push(chapter_id, user_id);

    const updated = await db.rawQueryRow<WellnessChapter>(query, ...params);

    if (!updated) {
      throw new Error("Failed to update chapter");
    }

    return updated;
  }
);
