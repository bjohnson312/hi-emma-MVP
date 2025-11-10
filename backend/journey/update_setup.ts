import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateJourneySetupRequest, WellnessJourneySetup } from "./types";
import { checkAndAwardMilestones } from "./award_milestones";

export const updateJourneySetup = api<UpdateJourneySetupRequest, WellnessJourneySetup>(
  { expose: true, method: "POST", path: "/journey/setup/update" },
  async (req) => {
    const {
      user_id,
      wellness_journal_setup,
      wellness_journal_chapter_created,
      morning_routine_completed,
      evening_routine_completed,
      diet_nutrition_setup,
      doctors_orders_added,
      care_team_added,
      notifications_configured,
      user_profile_completed,
      first_conversation
    } = req;

    let existing = await db.queryRow<WellnessJourneySetup>`
      SELECT * FROM wellness_journey_setup
      WHERE user_id = ${user_id}
    `;

    if (!existing) {
      existing = await db.queryRow<WellnessJourneySetup>`
        INSERT INTO wellness_journey_setup (user_id)
        VALUES (${user_id})
        RETURNING *
      `;
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (wellness_journal_setup !== undefined) {
      updates.push(`wellness_journal_setup = $${paramIndex}`);
      params.push(wellness_journal_setup);
      paramIndex++;
    }

    if (wellness_journal_chapter_created !== undefined) {
      updates.push(`wellness_journal_chapter_created = $${paramIndex}`);
      params.push(wellness_journal_chapter_created);
      paramIndex++;
    }

    if (morning_routine_completed !== undefined) {
      updates.push(`morning_routine_completed = $${paramIndex}`);
      params.push(morning_routine_completed);
      paramIndex++;
    }

    if (evening_routine_completed !== undefined) {
      updates.push(`evening_routine_completed = $${paramIndex}`);
      params.push(evening_routine_completed);
      paramIndex++;
    }

    if (diet_nutrition_setup !== undefined) {
      updates.push(`diet_nutrition_setup = $${paramIndex}`);
      params.push(diet_nutrition_setup);
      paramIndex++;
    }

    if (doctors_orders_added !== undefined) {
      updates.push(`doctors_orders_added = $${paramIndex}`);
      params.push(doctors_orders_added);
      paramIndex++;
    }

    if (care_team_added !== undefined) {
      updates.push(`care_team_added = $${paramIndex}`);
      params.push(care_team_added);
      paramIndex++;
    }

    if (notifications_configured !== undefined) {
      updates.push(`notifications_configured = $${paramIndex}`);
      params.push(notifications_configured);
      paramIndex++;
    }

    if (user_profile_completed !== undefined) {
      updates.push(`user_profile_completed = $${paramIndex}`);
      params.push(user_profile_completed);
      paramIndex++;
    }

    if (first_conversation !== undefined) {
      updates.push(`first_conversation = $${paramIndex}`);
      params.push(first_conversation);
      paramIndex++;
    }

    if (updates.length === 0) {
      return existing!;
    }

    updates.push(`last_updated = NOW()`);

    const query = `
      UPDATE wellness_journey_setup
      SET ${updates.join(', ')}
      WHERE user_id = $${paramIndex}
      RETURNING *
    `;

    params.push(user_id);

    const updated = await db.rawQueryRow<WellnessJourneySetup>(query, ...params);

    if (!updated) {
      throw new Error("Failed to update journey setup");
    }

    const allSteps = [
      updated.wellness_journal_setup,
      updated.wellness_journal_chapter_created,
      updated.morning_routine_completed,
      updated.evening_routine_completed,
      updated.diet_nutrition_setup,
      updated.doctors_orders_added,
      updated.care_team_added,
      updated.notifications_configured,
      updated.user_profile_completed,
      updated.first_conversation
    ];

    const allCompleted = allSteps.every(step => step === true);

    if (allCompleted && !updated.setup_completed_at) {
      await db.exec`
        UPDATE wellness_journey_setup
        SET setup_completed_at = NOW()
        WHERE user_id = ${user_id}
      `;
    }

    await checkAndAwardMilestones(user_id, updated);

    return updated;
  }
);
