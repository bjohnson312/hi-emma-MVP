import { api } from "encore.dev/api";
import db from "../db";
import type { MorningRoutinePreference } from "./routine_types";
import { parseActivities, findBestMatch } from "./activity_utils";
import { logJournalEntry } from "./add_journal_entry";
import { extractAndStoreMemories } from "../conversation/memory";

interface MarkActivityCompleteRequest {
  user_id: string;
  activity_identifier: string;
}

interface MarkActivityCompleteResponse {
  matched_activity_name: string;
  activities_completed_today: number;
  total_activities: number;
  all_completed: boolean;
  already_complete: boolean;
}

export const markActivityComplete = api<MarkActivityCompleteRequest, MarkActivityCompleteResponse>(
  { expose: true, method: "POST", path: "/morning_routine/activity/complete" },
  async (req) => {
    const { user_id, activity_identifier } = req;

    console.log(`✅ COMPLETE: Starting for user ${user_id}, identifier: "${activity_identifier}"`);

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

    // 3. Find matching activity using fuzzy search
    const matchResult = findBestMatch(activity_identifier, activities);

    if (!matchResult) {
      throw new Error(`Activity "${activity_identifier}" not found in your routine.`);
    }

    const { match } = matchResult;
    console.log(`   ✅ Matched: "${match.name}" (id: ${match.id})`);

    // 4. Get today's completion record (normalized to 00:00:00)
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

    let activitiesCompletedToday: string[];
    let wasAlreadyComplete = false;

    if (completionRecord) {
      // Parse existing completions
      activitiesCompletedToday = Array.isArray(completionRecord.activities_completed)
        ? completionRecord.activities_completed
        : typeof completionRecord.activities_completed === 'string'
        ? JSON.parse(completionRecord.activities_completed)
        : [];

      // Check if already complete (idempotency)
      if (activitiesCompletedToday.includes(match.id)) {
        wasAlreadyComplete = true;
        console.log(`   ⚠️  Activity already complete today`);
      } else {
        // Add this activity
        activitiesCompletedToday.push(match.id);
      }
    } else {
      // First completion today
      activitiesCompletedToday = [match.id];
    }

    // 5. Compute all_completed status
    const allActivityIds = activities.map(a => a.id);
    const allComplete = allActivityIds.every(id => activitiesCompletedToday.includes(id));

    console.log(`   Progress: ${activitiesCompletedToday.length}/${activities.length} activities`);
    console.log(`   All complete: ${allComplete}`);

    // 6. Update or insert completion record
    if (!wasAlreadyComplete) {
      if (completionRecord) {
        await db.exec`
          UPDATE morning_routine_completions
          SET activities_completed = ${JSON.stringify(activitiesCompletedToday)}::jsonb,
              all_completed = ${allComplete}
          WHERE id = ${completionRecord.id}
        `;
      } else {
        await db.exec`
          INSERT INTO morning_routine_completions
            (user_id, completion_date, activities_completed, all_completed)
          VALUES
            (${user_id}, ${today}, ${JSON.stringify(activitiesCompletedToday)}::jsonb, ${allComplete})
        `;
      }

      // 7. Log to journal
      await logJournalEntry(
        user_id,
        "activity_completed",
        `Completed ${match.name}`,
        match.name,
        {
          activity_id: match.id,
          activities_completed_today: activitiesCompletedToday.length,
          total_activities: activities.length,
          all_completed: allComplete,
          source: "conversation"
        }
      );

      // 8. If all activities complete for first time, log special entry + award milestone
      if (allComplete && (!completionRecord || !completionRecord.all_completed)) {
        console.log(`   🎉 ALL ACTIVITIES COMPLETED!`);

        await logJournalEntry(
          user_id,
          "all_activities_completed",
          `Completed entire morning routine (${activities.length} activities)`,
          null,
          {
            total_activities: activities.length,
            completion_date: today.toISOString(),
            source: "conversation"
          }
        );

        // Award journey milestone
        try {
          const { updateProgress } = await import("../journey/update_progress");
          await updateProgress({
            user_id,
            milestone_id: "morning_routine_complete",
            increment: 1
          });
          console.log(`   🏆 Awarded milestone: morning_routine_complete`);
        } catch (error) {
          console.log(`   ⚠️  Milestone award failed (non-critical):`, error);
        }
      }

      // 9. Update Emma memory
      try {
        await extractAndStoreMemories(
          user_id,
          `Completed ${match.name}`,
          `Marked ${match.name} as complete (${activitiesCompletedToday.length}/${activities.length} activities done today)`
        );
      } catch (error) {
        console.log(`   ⚠️  Memory update failed (non-critical):`, error);
      }
    }

    return {
      matched_activity_name: match.name,
      activities_completed_today: activitiesCompletedToday.length,
      total_activities: activities.length,
      all_completed: allComplete,
      already_complete: wasAlreadyComplete
    };
  }
);
