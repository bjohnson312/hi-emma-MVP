import { api } from "encore.dev/api";
import db from "../db";
import type { MorningRoutinePreference, MorningRoutineActivity } from "./routine_types";
import { parseActivities, findBestMatch } from "./activity_utils";
import { calculateTotalDuration } from "./routine_types";
import { logJournalEntry } from "./add_journal_entry";
import { extractAndStoreMemories } from "../conversation/memory";

interface UpdateActivityRequest {
  user_id: string;
  activity_identifier: string;
  new_name?: string;
  new_duration?: number;
  new_icon?: string;
}

interface UpdateActivityResponse {
  updated_activity: MorningRoutineActivity;
  matched_original_name: string;
  changes_made: string[];
}

export const updateActivity = api<UpdateActivityRequest, UpdateActivityResponse>(
  { expose: true, method: "PATCH", path: "/morning_routine/activity/update" },
  async (req) => {
    const { user_id, activity_identifier, new_name, new_duration, new_icon } = req;

    console.log(`🔧 UPDATE: Starting for user ${user_id}, identifier: "${activity_identifier}"`);

    // 1. Get current routine
    const routine = await db.queryRow<MorningRoutinePreference>`
      SELECT * FROM morning_routine_preferences
      WHERE user_id = ${user_id} AND is_active = true
    `;

    if (!routine) {
      throw new Error("No active morning routine found.");
    }

    console.log(`   ✓ Found routine with ${routine.activities ? 'activities' : 'no activities'}`);

    // 2. Parse activities
    const activities = parseActivities(routine.activities);
    console.log(`   ✓ Parsed ${activities.length} activities`);

    if (activities.length === 0) {
      throw new Error("Your routine has no activities to update.");
    }

    // 3. Find matching activity using fuzzy search
    const matchResult = findBestMatch(activity_identifier, activities);

    if (!matchResult) {
      console.log(`   ✗ No match found for "${activity_identifier}"`);
      throw new Error(`Activity "${activity_identifier}" not found in your routine.`);
    }

    const { index, match } = matchResult;
    console.log(`   ✓ Matched "${activity_identifier}" to "${match.name}" (index ${index})`);

    const oldActivity = { ...match };

    // 4. Build updated activity
    const updatedActivity: MorningRoutineActivity = {
      ...activities[index],
      name: new_name !== undefined ? new_name : activities[index].name,
      duration_minutes: new_duration !== undefined ? new_duration : activities[index].duration_minutes,
      icon: new_icon !== undefined ? new_icon : activities[index].icon
    };

    // 5. Track what changed
    const changes: string[] = [];
    if (new_name && new_name !== oldActivity.name) {
      changes.push(`renamed to "${new_name}"`);
    }
    if (new_duration !== undefined && new_duration !== oldActivity.duration_minutes) {
      changes.push(`duration changed to ${new_duration} min`);
    }
    if (new_icon && new_icon !== oldActivity.icon) {
      changes.push(`icon changed to ${new_icon}`);
    }

    if (changes.length === 0) {
      console.log(`   ℹ No changes detected`);
      return {
        updated_activity: updatedActivity,
        matched_original_name: oldActivity.name,
        changes_made: ["no changes"]
      };
    }

    console.log(`   ✓ Changes: ${changes.join(', ')}`);

    // 6. Update array
    activities[index] = updatedActivity;
    const newDuration = calculateTotalDuration(activities);

    console.log(`   ✓ New total duration: ${newDuration} min`);

    // 7. Save to database
    await db.exec`
      UPDATE morning_routine_preferences
      SET activities = ${JSON.stringify(activities)}::jsonb,
          duration_minutes = ${newDuration},
          updated_at = NOW()
      WHERE user_id = ${user_id} AND is_active = true
    `;

    console.log(`   ✓ Database updated`);

    // 8. Log to journal
    await logJournalEntry(
      user_id,
      "activity_edited",
      `Updated ${oldActivity.name}: ${changes.join(', ')}`,
      updatedActivity.name,
      {
        old_name: oldActivity.name,
        old_duration: oldActivity.duration_minutes,
        new_name: updatedActivity.name,
        new_duration: updatedActivity.duration_minutes,
        changes,
        source: "conversation"
      }
    );

    console.log(`   ✓ Journal entry created`);

    // 9. Update Emma memory
    try {
      await extractAndStoreMemories(
        user_id,
        `Updated ${oldActivity.name}`,
        `Changed ${oldActivity.name}: ${changes.join(', ')}`
      );
      console.log(`   ✓ Memory updated`);
    } catch (error) {
      console.log(`   ⚠ Memory update failed (non-critical):`, error);
    }

    console.log(`✅ UPDATE: Complete for "${oldActivity.name}"`);

    return {
      updated_activity: updatedActivity,
      matched_original_name: oldActivity.name,
      changes_made: changes
    };
  }
);
