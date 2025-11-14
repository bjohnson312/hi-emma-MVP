import { api } from "encore.dev/api";
import db from "../db";
import type { CompleteOnboardingRequest, CompleteOnboardingResponse, OnboardingPreferences } from "./types";

export const complete = api(
  { method: "POST", path: "/onboarding/complete", expose: true },
  async (req: CompleteOnboardingRequest): Promise<CompleteOnboardingResponse> => {
    const prefs = await db.queryRow<OnboardingPreferences>`
      SELECT id, user_id, first_name, reason_for_joining, current_feeling, 
             preferred_check_in_time, reminder_preference, onboarding_completed, 
             onboarding_step, created_at, updated_at
      FROM onboarding_preferences
      WHERE user_id = ${req.user_id}
    `;

    if (!prefs) {
      return {
        success: false,
        welcome_message: "Unable to complete onboarding. Please try again."
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
    const reminderPref = prefs.reminder_preference || "voice";
    
    let checkInMessage = "";
    if (reminderPref === "voice") {
      checkInMessage = "I'll check in through voice";
    } else if (reminderPref === "sms") {
      checkInMessage = "I'll check in via SMS";
    } else if (reminderPref === "both") {
      checkInMessage = "I'll check in both through voice and SMS";
    } else {
      checkInMessage = "I'll check in";
    }
    
    const welcomeMessage = `Welcome to Hi, Emma ${firstName}! Your wellness journey has begun. ${checkInMessage}.`;

    return {
      success: true,
      welcome_message: welcomeMessage
    };
  }
);
