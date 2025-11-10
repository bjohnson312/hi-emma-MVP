import db from "../db";
import type { WellnessJourneySetup, WellnessMilestone } from "./types";

export async function checkAndAwardMilestones(userId: string, setup: WellnessJourneySetup): Promise<void> {
  const existingMilestones = await db.query<{ milestone_type: string }>`
    SELECT milestone_type
    FROM wellness_milestones
    WHERE user_id = ${userId}
  `;

  const existingTypes = new Set<string>();
  for await (const m of existingMilestones) {
    existingTypes.add(m.milestone_type);
  }

  const milestones: Array<{
    type: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    condition: boolean;
  }> = [
    {
      type: 'first_conversation',
      name: 'First Chat',
      description: 'Had your first conversation with Emma',
      icon: '💬',
      color: 'blue',
      condition: setup.first_conversation
    },
    {
      type: 'profile_setup',
      name: 'Profile Complete',
      description: 'Completed your user profile',
      icon: '👤',
      color: 'purple',
      condition: setup.user_profile_completed
    },
    {
      type: 'morning_routine',
      name: 'Morning Person',
      description: 'Completed your first morning routine',
      icon: '🌅',
      color: 'orange',
      condition: setup.morning_routine_completed
    },
    {
      type: 'evening_routine',
      name: 'Night Owl',
      description: 'Completed your first evening routine',
      icon: '🌙',
      color: 'indigo',
      condition: setup.evening_routine_completed
    },
    {
      type: 'wellness_journal',
      name: 'Journal Keeper',
      description: 'Started your wellness journal',
      icon: '📖',
      color: 'green',
      condition: setup.wellness_journal_setup
    },
    {
      type: 'wellness_chapter',
      name: 'Chapter Author',
      description: 'Created your first wellness chapter',
      icon: '📚',
      color: 'teal',
      condition: setup.wellness_journal_chapter_created
    },
    {
      type: 'nutrition_setup',
      name: 'Nutrition Tracker',
      description: 'Set up diet & nutrition tracking',
      icon: '🥗',
      color: 'lime',
      condition: setup.diet_nutrition_setup
    },
    {
      type: 'care_team',
      name: 'Team Builder',
      description: 'Added your care team',
      icon: '👥',
      color: 'pink',
      condition: setup.care_team_added
    },
    {
      type: 'notifications',
      name: 'Stay Connected',
      description: 'Configured notifications',
      icon: '🔔',
      color: 'yellow',
      condition: setup.notifications_configured
    },
    {
      type: 'doctors_orders',
      name: 'Following Orders',
      description: "Added doctor's orders",
      icon: '💊',
      color: 'red',
      condition: setup.doctors_orders_added
    }
  ];

  for (const milestone of milestones) {
    if (milestone.condition && !existingTypes.has(milestone.type)) {
      await db.exec`
        INSERT INTO wellness_milestones (
          user_id, milestone_type, milestone_name, milestone_description,
          badge_icon, badge_color
        ) VALUES (
          ${userId}, ${milestone.type}, ${milestone.name}, ${milestone.description},
          ${milestone.icon}, ${milestone.color}
        )
      `;
    }
  }

  const completedSteps = [
    setup.wellness_journal_setup,
    setup.wellness_journal_chapter_created,
    setup.morning_routine_completed,
    setup.evening_routine_completed,
    setup.diet_nutrition_setup,
    setup.doctors_orders_added,
    setup.care_team_added,
    setup.notifications_configured,
    setup.user_profile_completed,
    setup.first_conversation
  ];

  const allCompleted = completedSteps.every(step => step === true);

  if (allCompleted && !existingTypes.has('journey_complete')) {
    await db.exec`
      INSERT INTO wellness_milestones (
        user_id, milestone_type, milestone_name, milestone_description,
        badge_icon, badge_color
      ) VALUES (
        ${userId}, 'journey_complete', 'Wellness Champion', 
        'Completed your entire wellness journey setup!',
        '🏆', 'gold'
      )
    `;
  }
}
