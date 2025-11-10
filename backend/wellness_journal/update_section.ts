import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateSectionRequest, WellnessSection } from "./types";

export const updateSection = api<UpdateSectionRequest, WellnessSection>(
  { expose: true, method: "POST", path: "/wellness_journal/sections/update" },
  async (req) => {
    const { section_id, user_id, title, description, is_active } = req;

    const existing = await db.queryRow<{ id: number; chapter_id: number }>`
      SELECT s.id, s.chapter_id
      FROM wellness_journal_sections s
      JOIN wellness_journal_chapters c ON c.id = s.chapter_id
      WHERE s.id = ${section_id} AND c.user_id = ${user_id}
    `;

    if (!existing) {
      throw new Error("Section not found");
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

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      params.push(is_active);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE wellness_journal_sections
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    params.push(section_id);

    const updated = await db.rawQueryRow<WellnessSection>(query, ...params);

    if (!updated) {
      throw new Error("Failed to update section");
    }

    return updated;
  }
);
