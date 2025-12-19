import { api } from "encore.dev/api";
import db from "../db";
import type { CompleteOnboardingRequest, CompleteOnboardingResponse, OnboardingPreferences } from "./types";

export const complete = api(
  { method: "POST", path: "/onboarding/complete", expose: true, auth: false },
  async (req: CompleteOnboardingRequest): Promise<CompleteOnboardingResponse> => {
    const prefs = await db.queryRow<OnboardingPreferences>`
      SELECT id, user_id, first_name, reason_for_joining, current_feeling, 
             preferred_check_in_time, reminder_preference, onboarding_completed, 
             onboarding_step, created_at, updated_at
      FROM onboarding_preferences
      WHERE user_id = ${req.user_id}
    `;

    if (!prefs) {
      console.error('[onboarding/complete] No preferences found for user:', req.user_id);
      await db.exec`
        INSERT INTO onboarding_preferences (user_id, onboarding_completed, onboarding_step, first_name)
        VALUES (${req.user_id}, FALSE, 0, 'User')
        ON CONFLICT (user_id) DO NOTHING
      `;
      
      return {
        success: true,
        welcome_message: "Welcome! Let's get started with your wellness journey."
      };
    }

    await db.exec`
      UPDATE onboarding_preferences
      SET onboarding_completed = TRUE, updated_at = NOW()
      WHERE user_id = ${req.user_id}
    `;

    const firstName = prefs.first_name || "there";

    const profileExists = await db.queryRow<{ id: number }>`
      SELECT id FROM user_profiles WHERE user_id = ${req.user_id}
    `;

    if (profileExists) {
      await db.exec`
        UPDATE user_profiles
        SET onboarding_completed = TRUE, updated_at = NOW()
        WHERE user_id = ${req.user_id}
      `;
    } else {
      await db.exec`
        INSERT INTO user_profiles (user_id, name, onboarding_completed)
        VALUES (${req.user_id}, ${firstName}, TRUE)
      `;
    }

    await mapOnboardingDataToUserProfile(req.user_id, prefs);
    await createInitialMoodLog(req.user_id, prefs);
    await updateNotificationPreferences(req.user_id, prefs);
    await updateWellnessJourneySetup(req.user_id);
    
    const welcomeMessage = `Hi ${firstName}, Emma here. As your wellness companion, I'm here to help you feel better each day. How did you sleep?`;

    return {
      success: true,
      welcome_message: welcomeMessage
    };
  }
);

async function mapOnboardingDataToUserProfile(userId: string, prefs: OnboardingPreferences) {
  const wellnessGoals: string[] = [];
  
  if (prefs.reason_for_joining) {
    const goalMap: Record<string, string> = {
      'routine': 'Establish healthy routines',
      'stress': 'Manage stress better',
      'nutrition': 'Improve nutrition',
      'consistency': 'Manage care routine and chronic condition',
      'other': 'General wellness support'
    };
    
    const goal = goalMap[prefs.reason_for_joining] || prefs.reason_for_joining;
    wellnessGoals.push(goal);
  }

  if (wellnessGoals.length > 0) {
    await db.exec`
      UPDATE user_profiles
      SET wellness_goals = ${wellnessGoals},
          updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  }
}

async function createInitialMoodLog(userId: string, prefs: OnboardingPreferences) {
  if (!prefs.current_feeling) return;

  const moodRatingMap: Record<string, number> = {
    'pretty_good': 4,
    'up_and_down': 3,
    'low_energy': 2,
    'need_support': 2
  };

  const energyLevelMap: Record<string, number> = {
    'pretty_good': 4,
    'up_and_down': 3,
    'low_energy': 1,
    'need_support': 2
  };

  const stressLevelMap: Record<string, number> = {
    'pretty_good': 1,
    'up_and_down': 3,
    'low_energy': 4,
    'need_support': 4
  };

  const moodRating = moodRatingMap[prefs.current_feeling] || 3;
  const energyLevel = energyLevelMap[prefs.current_feeling] || 3;
  const stressLevel = stressLevelMap[prefs.current_feeling] || 3;

  const moodTags = [prefs.current_feeling.replace(/_/g, ' ')];
  const notes = `Initial onboarding assessment`;

  const existingLog = await db.queryRow<{ id: number }>`
    SELECT id FROM mood_logs
    WHERE user_id = ${userId}
    AND notes LIKE '%Initial onboarding assessment%'
  `;

  if (!existingLog) {
    await db.exec`
      INSERT INTO mood_logs 
        (user_id, mood_rating, mood_tags, energy_level, stress_level, notes)
      VALUES 
        (${userId}, ${moodRating}, ${moodTags}, ${energyLevel}, ${stressLevel}, ${notes})
    `;
  }
}

async function updateNotificationPreferences(userId: string, prefs: OnboardingPreferences) {
  const notificationMethod = prefs.reminder_preference === 'voice' ? 'browser' 
    : prefs.reminder_preference === 'sms' ? 'sms' 
    : prefs.reminder_preference === 'both' ? 'both' 
    : 'browser';

  const morningTime = '08:00:00';
  const eveningTime = '20:00:00';
  let morningEnabled = false;
  let eveningEnabled = false;

  if (prefs.preferred_check_in_time === 'morning') {
    morningEnabled = true;
    eveningEnabled = false;
  } else if (prefs.preferred_check_in_time === 'evening') {
    morningEnabled = false;
    eveningEnabled = true;
  } else if (prefs.preferred_check_in_time === 'both') {
    morningEnabled = true;
    eveningEnabled = true;
  }

  const existingPrefs = await db.queryRow<{ id: number }>`
    SELECT id FROM notification_preferences
    WHERE user_id = ${userId}
  `;

  if (existingPrefs) {
    await db.rawQuery(`
      UPDATE notification_preferences
      SET morning_checkin_enabled = $1,
          morning_checkin_time = $2::time,
          evening_reflection_enabled = $3,
          evening_reflection_time = $4::time,
          notification_method = $5,
          updated_at = NOW()
      WHERE user_id = $6
    `, morningEnabled, morningTime, eveningEnabled, eveningTime, notificationMethod, userId);
  } else {
    await db.rawQuery(`
      INSERT INTO notification_preferences 
        (user_id, morning_checkin_enabled, morning_checkin_time, 
         evening_reflection_enabled, evening_reflection_time, notification_method)
      VALUES 
        ($1, $2, $3::time, $4, $5::time, $6)
    `, userId, morningEnabled, morningTime, eveningEnabled, eveningTime, notificationMethod);
  }
}

async function updateWellnessJourneySetup(userId: string) {
  const existingSetup = await db.queryRow<{ id: number }>`
    SELECT id FROM wellness_journey_setup
    WHERE user_id = ${userId}
  `;

  if (existingSetup) {
    await db.exec`
      UPDATE wellness_journey_setup
      SET user_profile_completed = TRUE,
          first_conversation = TRUE,
          notifications_configured = TRUE,
          last_updated = NOW()
      WHERE user_id = ${userId}
    `;
  } else {
    await db.exec`
      INSERT INTO wellness_journey_setup 
        (user_id, user_profile_completed, first_conversation, notifications_configured)
      VALUES 
        (${userId}, TRUE, TRUE, TRUE)
    `;
  }
}
