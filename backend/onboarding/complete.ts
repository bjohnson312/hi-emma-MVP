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
      // Create default preferences if they don't exist
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

    await db.exec`
      UPDATE user_profiles
      SET onboarding_completed = TRUE, updated_at = NOW()
      WHERE user_id = ${req.user_id}
    `;

    const firstName = prefs.first_name || "there";
    
    const welcomeMessage = `Hi ${firstName}, Emma here. As your wellness companion, I'm here to help you feel better each day. How did you sleep?`;

    return {
      success: true,
      welcome_message: welcomeMessage
    };
  }
);
