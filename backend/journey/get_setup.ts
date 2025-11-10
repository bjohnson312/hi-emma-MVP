import { api } from "encore.dev/api";
import db from "../db";
import type { GetJourneySetupRequest, GetJourneySetupResponse, WellnessJourneySetup } from "./types";

export const getJourneySetup = api<GetJourneySetupRequest, GetJourneySetupResponse>(
  { expose: true, method: "POST", path: "/journey/setup/get" },
  async (req) => {
    const { user_id } = req;

    let setup = await db.queryRow<WellnessJourneySetup>`
      SELECT * FROM wellness_journey_setup
      WHERE user_id = ${user_id}
    `;

    if (!setup) {
      setup = await db.queryRow<WellnessJourneySetup>`
        INSERT INTO wellness_journey_setup (user_id)
        VALUES (${user_id})
        RETURNING *
      `;
    }

    if (!setup) {
      throw new Error("Failed to get or create journey setup");
    }

    const setupSteps = [
      'wellness_journal_setup',
      'wellness_journal_chapter_created',
      'morning_routine_completed',
      'evening_routine_completed',
      'diet_nutrition_setup',
      'doctors_orders_added',
      'care_team_added',
      'notifications_configured',
      'user_profile_completed',
      'first_conversation'
    ];

    const completedSteps = setupSteps.filter(step => (setup as any)[step] === true);
    const incompleteSteps = setupSteps.filter(step => (setup as any)[step] === false);

    const stepLabels: Record<string, string> = {
      wellness_journal_setup: 'Wellness Journal',
      wellness_journal_chapter_created: 'Wellness Chapter',
      morning_routine_completed: 'Morning Routine',
      evening_routine_completed: 'Evening Routine',
      diet_nutrition_setup: 'Diet & Nutrition',
      doctors_orders_added: "Doctor's Orders",
      care_team_added: 'Care Team',
      notifications_configured: 'Notifications',
      user_profile_completed: 'User Profile',
      first_conversation: 'First Conversation'
    };

    const incompleteLabels = incompleteSteps.map(step => stepLabels[step]);

    return {
      setup,
      completion_percentage: Math.round((completedSteps.length / setupSteps.length) * 100),
      setup_steps_completed: completedSteps.length,
      total_setup_steps: setupSteps.length,
      incomplete_steps: incompleteLabels
    };
  }
);
