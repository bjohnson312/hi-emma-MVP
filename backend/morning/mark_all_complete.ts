import { api } from "encore.dev/api";
import db from "../db";
import type { MorningRoutinePreference } from "./routine_types";
import { parseActivities } from "./activity_utils";
import { logJournalEntry } from "./add_journal_entry";
import { extractAndStoreMemories } from "../conversation/memory";

interface MarkAllCompleteRequest {
  user_id: string;
}

interface MarkAllCompleteResponse {
  newly_completed_count: number;
  total_activities: number;
  all_were_already_complete: boolean;
  newly_completed_names: string[];
}

export const markAllComplete = api<MarkAllCompleteRequest, MarkAllCompleteResponse>(
  { expose: true, method: "POST", path: "/morning_routine/complete_all" },
  async (req) => {
    const { user_id } = req;

    console.log(`🔥 COMPLETE ALL: Starting for user ${user_id}`);

    // 1. Get current routine
    const routine = await db.queryRow<MorningRoutinePreference>`
      SELECT * FROM morning_routine_preferences
      WHERE user_id = ${user_id} AND is_active = true
    `;

    if (!routine) {
      throw new Error("No active morning routine found.");
    }

    // 2. Parse activities
    const activities = parseActivities(routine.activities);

    if (activities.length === 0) {
      throw new Error("Your routine has no activities to complete.");
    }

    const total_activities = activities.length;
    const all_activity_ids = activities.map(a => a.id);

    console.log(`   Total activities in routine: ${total_activities}`);

    // 3. Get today's completion record (normalized to 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const completionRecord = await db.queryRow<{
      id: number;
      activities_completed: any;
      all_completed: boolean;
    }>`
      SELECT id, activities_completed, all_completed
      FROM morning_routine_completions
      WHERE user_id = ${user_id} AND completion_date = ${today}
    `;

    let already_completed_ids: string[];

    if (completionRecord) {
      // Parse existing completions
      already_completed_ids = Array.isArray(completionRecord.activities_completed)
        ? completionRecord.activities_completed
        : typeof completionRecord.activities_completed === 'string'
        ? JSON.parse(completionRecord.activities_completed)
        : [];
    } else {
      already_completed_ids = [];
    }

    console.log(`   Already completed: ${already_completed_ids.length}/${total_activities}`);

    // 4. Compute remaining activities
    const remaining_ids = all_activity_ids.filter(id => !already_completed_ids.includes(id));
    const newly_completed_count = remaining_ids.length;

    if (newly_completed_count === 0) {
      // Everything already complete
      console.log(`   ✅ Already at 100%`);
      return {
        newly_completed_count: 0,
        total_activities,
        all_were_already_complete: true,
        newly_completed_names: []
      };
    }

    // 5. Get names of newly completed activities
    const newly_completed_names = activities
      .filter(a => remaining_ids.includes(a.id))
      .map(a => a.name);

    console.log(`   Newly completing ${newly_completed_count} activities:`, newly_completed_names);

    // 6. Update completion record
    const final_completed_ids = [...already_completed_ids, ...remaining_ids];

    if (completionRecord) {
      await db.exec`
        UPDATE morning_routine_completions
        SET activities_completed = ${JSON.stringify(final_completed_ids)}::jsonb,
            all_completed = true
        WHERE id = ${completionRecord.id}
      `;
    } else {
      await db.exec`
        INSERT INTO morning_routine_completions
          (user_id, completion_date, activities_completed, all_completed)
        VALUES
          (${user_id}, ${today}, ${JSON.stringify(final_completed_ids)}::jsonb, true)
      `;
    }

    // 7. Log single journal entry with rich metadata
    await logJournalEntry(
      user_id,
      "all_activities_completed",
      `Completed entire morning routine (${total_activities} activities)`,
      undefined,
      {
        newly_completed_activity_ids: remaining_ids,
        newly_completed_activity_names: newly_completed_names,
        total_activities,
        completion_date: today.toISOString(),
        triggered_by: "complete_all_intent",
        source: "conversation"
      }
    );

    // 8. Award milestone (only if this is first time hitting 100%)
    if (!completionRecord || !completionRecord.all_completed) {
      console.log(`   🏆 Awarding milestone: morning_routine_complete`);
      try {
        const { updateJourneyProgress } = await import("../journey/update_progress");
        await updateJourneyProgress(user_id, "morning_routine_completed", true);
      } catch (error) {
        console.log(`   ⚠️  Milestone award failed (non-critical):`, error);
      }
    }

    // 9. Update Emma memory
    try {
      await extractAndStoreMemories(
        user_id,
        "Completed all morning routine activities",
        `Marked all ${newly_completed_count} remaining activities as complete (${total_activities}/${total_activities} done)`
      );
    } catch (error) {
      console.log(`   ⚠️  Memory update failed (non-critical):`, error);
    }

    console.log(`   ✅ COMPLETE ALL: Success - ${newly_completed_count} newly completed`);

    return {
      newly_completed_count,
      total_activities,
      all_were_already_complete: false,
      newly_completed_names
    };
  }
);
