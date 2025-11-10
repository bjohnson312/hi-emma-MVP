import { api } from "encore.dev/api";
import db from "../db";
import type { CreateChapterRequest, WellnessChapter } from "./types";

export const createChapter = api<CreateChapterRequest, WellnessChapter>(
  { expose: true, method: "POST", path: "/wellness_journal/chapters/create" },
  async (req) => {
    const { user_id, title, description, motivation, target_outcome, completion_vision } = req;

    const maxOrderResult = await db.queryRow<{ max_order: number | null }>`
      SELECT MAX(order_index) as max_order
      FROM wellness_journal_chapters
      WHERE user_id = ${user_id}
    `;

    const newOrder = (maxOrderResult?.max_order ?? -1) + 1;

    const chapter = await db.queryRow<WellnessChapter>`
      INSERT INTO wellness_journal_chapters (
        user_id, title, description, motivation, target_outcome, 
        completion_vision, order_index
      ) VALUES (
        ${user_id}, ${title}, ${description}, ${motivation}, ${target_outcome}, 
        ${completion_vision}, ${newOrder}
      )
      RETURNING *
    `;

    if (!chapter) {
      throw new Error("Failed to create chapter");
    }

    return chapter;
  }
);
