import { api } from "encore.dev/api";
import db from "../db";
import type { AddJournalEntryRequest, MorningJournalEntry } from "./journal_types";

export const addJournalEntry = api<AddJournalEntryRequest, MorningJournalEntry>(
  { expose: true, method: "POST", path: "/morning_routine/journal/add" },
  async (req) => {
    const { user_id, entry_type, entry_text, activity_name, metadata } = req;

    const entry = await db.queryRow<MorningJournalEntry>`
      INSERT INTO morning_routine_journal (
        user_id, entry_type, entry_text, activity_name, metadata
      ) VALUES (
        ${user_id}, ${entry_type}, ${entry_text}, ${activity_name}, ${JSON.stringify(metadata || {})}
      )
      RETURNING *
    `;

    return entry!;
  }
);

export async function logJournalEntry(
  user_id: string,
  entry_type: string,
  entry_text: string,
  activity_name?: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await db.exec`
      INSERT INTO morning_routine_journal (
        user_id, entry_type, entry_text, activity_name, metadata
      ) VALUES (
        ${user_id}, ${entry_type}, ${entry_text}, ${activity_name}, ${JSON.stringify(metadata || {})}
      )
    `;
  } catch (error) {
    console.error("Failed to log journal entry:", error);
  }
}
