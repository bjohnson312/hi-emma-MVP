import { api } from "encore.dev/api";
import db from "../db";
import type {
  GetJournalEntriesRequest,
  GetJournalEntriesResponse,
  WellnessJournalEntry,
  GetJournalStatsRequest,
  JournalStats,
  JournalEntryType
} from "./types";

export const getJournalEntries = api<GetJournalEntriesRequest, GetJournalEntriesResponse>(
  { expose: true, method: "POST", path: "/wellness_journal/entries" },
  async (req) => {
    const { user_id, start_date, end_date, entry_type, tags, limit = 50 } = req;

    let query = `
      SELECT id, user_id, entry_date, entry_type, title, content, mood_rating,
             energy_level, sleep_quality, tags, metadata, source_type, source_id,
             ai_generated, created_at, updated_at
      FROM wellness_journal_entries
      WHERE user_id = $1
    `;
    const params: any[] = [user_id];
    let paramIndex = 2;

    if (start_date) {
      query += ` AND entry_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND entry_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (entry_type) {
      query += ` AND entry_type = $${paramIndex}`;
      params.push(entry_type);
      paramIndex++;
    }

    if (tags && tags.length > 0) {
      query += ` AND tags && $${paramIndex}`;
      params.push(tags);
      paramIndex++;
    }

    query += ` ORDER BY entry_date DESC, created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const entries = await db.rawQueryAll<WellnessJournalEntry>(query, ...params);

    const countResult = await db.queryRow<{ count: number }>`
      SELECT COUNT(*) as count
      FROM wellness_journal_entries
      WHERE user_id = ${user_id}
    `;

    return {
      entries,
      total_count: countResult?.count || 0
    };
  }
);

export const getJournalStats = api<GetJournalStatsRequest, JournalStats>(
  { expose: true, method: "POST", path: "/wellness_journal/stats" },
  async (req) => {
    const { user_id, start_date, end_date } = req;

    let whereClause = "WHERE user_id = $1";
    const params: any[] = [user_id];
    let paramIndex = 2;

    if (start_date) {
      whereClause += ` AND entry_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      whereClause += ` AND entry_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    const totalResult = await db.rawQueryRow<{ count: number }>(
      `SELECT COUNT(*) as count FROM wellness_journal_entries ${whereClause}`,
      ...params
    );

    const typeResults = await db.rawQueryAll<{ entry_type: JournalEntryType; count: number }>(
      `SELECT entry_type, COUNT(*) as count FROM wellness_journal_entries ${whereClause} GROUP BY entry_type`,
      ...params
    );

    const entries_by_type: Record<JournalEntryType, number> = {
      daily_summary: 0,
      milestone: 0,
      insight: 0,
      event: 0
    };

    typeResults.forEach(row => {
      entries_by_type[row.entry_type] = row.count;
    });

    const moodResult = await db.rawQueryRow<{ avg: number | null }>(
      `SELECT AVG(mood_rating) as avg FROM wellness_journal_entries ${whereClause} AND mood_rating IS NOT NULL`,
      ...params
    );

    const energyResult = await db.rawQueryRow<{ avg: number | null }>(
      `SELECT AVG(energy_level) as avg FROM wellness_journal_entries ${whereClause} AND energy_level IS NOT NULL`,
      ...params
    );

    const tagResults = await db.rawQueryAll<{ tag: string; count: number }>(
      `SELECT unnest(tags) as tag, COUNT(*) as count 
       FROM wellness_journal_entries 
       ${whereClause} AND tags IS NOT NULL 
       GROUP BY tag 
       ORDER BY count DESC 
       LIMIT 10`,
      ...params
    );

    const streakResult = await calculateStreak(user_id);

    const lastEntryResult = await db.queryRow<{ entry_date: Date }>`
      SELECT entry_date
      FROM wellness_journal_entries
      WHERE user_id = ${user_id}
      ORDER BY entry_date DESC
      LIMIT 1
    `;

    return {
      total_entries: totalResult?.count || 0,
      entries_by_type,
      avg_mood_rating: moodResult?.avg ? Math.round(moodResult.avg * 10) / 10 : undefined,
      avg_energy_level: energyResult?.avg ? Math.round(energyResult.avg * 10) / 10 : undefined,
      most_common_tags: tagResults,
      streak_days: streakResult,
      last_entry_date: lastEntryResult?.entry_date
    };
  }
);

async function calculateStreak(userId: string): Promise<number> {
  const entriesQuery = await db.query<{ entry_date: Date }>`
    SELECT DISTINCT entry_date
    FROM wellness_journal_entries
    WHERE user_id = ${userId}
    ORDER BY entry_date DESC
    LIMIT 100
  `;
  const entries = [];
  for await (const entry of entriesQuery) {
    entries.push(entry);
  }

  if (entries.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const mostRecentEntry = new Date(entries[0].entry_date);
  mostRecentEntry.setHours(0, 0, 0, 0);

  const daysDiff = Math.floor((today.getTime() - mostRecentEntry.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 1) return 0;

  for (let i = 1; i < entries.length; i++) {
    const current = new Date(entries[i].entry_date);
    current.setHours(0, 0, 0, 0);
    
    const previous = new Date(entries[i - 1].entry_date);
    previous.setHours(0, 0, 0, 0);

    const diff = Math.floor((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 1) {
      streak++;
    } else if (diff > 1) {
      break;
    }
  }

  return streak;
}
