import { api } from "encore.dev/api";
import db from "../db";
import type { CreateSectionRequest, WellnessSection } from "./types";

export const createSection = api<CreateSectionRequest, WellnessSection>(
  { expose: true, method: "POST", path: "/wellness_journal/sections/create" },
  async (req) => {
    const { chapter_id, user_id, title, description, habit_type, tracking_frequency, target_count } = req;

    const chapter = await db.queryRow<{ id: number; user_id: string }>`
      SELECT id, user_id FROM wellness_journal_chapters
      WHERE id = ${chapter_id} AND user_id = ${user_id}
    `;

    if (!chapter) {
      throw new Error("Chapter not found");
    }

    const maxOrderResult = await db.queryRow<{ max_order: number | null }>`
      SELECT MAX(order_index) as max_order
      FROM wellness_journal_sections
      WHERE chapter_id = ${chapter_id}
    `;

    const newOrder = (maxOrderResult?.max_order ?? -1) + 1;

    const section = await db.queryRow<WellnessSection>`
      INSERT INTO wellness_journal_sections (
        chapter_id, title, description, habit_type, tracking_frequency, 
        target_count, order_index
      ) VALUES (
        ${chapter_id}, ${title}, ${description}, ${habit_type}, ${tracking_frequency}, 
        ${target_count}, ${newOrder}
      )
      RETURNING *
    `;

    if (!section) {
      throw new Error("Failed to create section");
    }

    return section;
  }
);
