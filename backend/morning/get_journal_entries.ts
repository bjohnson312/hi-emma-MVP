import { api } from "encore.dev/api";
import db from "../db";
import type { GetJournalEntriesRequest, GetJournalEntriesResponse, MorningJournalEntry } from "./journal_types";

export const getJournalEntries = api<GetJournalEntriesRequest, GetJournalEntriesResponse>(
  { expose: true, method: "POST", path: "/morning_routine/journal/get" },
  async (req) => {
    const { user_id, days = 30, entry_type } = req;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query;
    if (entry_type) {
      query = db.query<MorningJournalEntry>`
        SELECT * FROM morning_routine_journal
        WHERE user_id = ${user_id}
          AND entry_type = ${entry_type}
          AND created_at >= ${cutoffDate}
        ORDER BY created_at DESC
        LIMIT 100
      `;
    } else {
      query = db.query<MorningJournalEntry>`
        SELECT * FROM morning_routine_journal
        WHERE user_id = ${user_id}
          AND created_at >= ${cutoffDate}
        ORDER BY created_at DESC
        LIMIT 100
      `;
    }

    const entries: MorningJournalEntry[] = [];
    for await (const entry of query) {
      entries.push(entry);
    }

    return { entries };
  }
);
