import { api } from "encore.dev/api";
import db from "../db";
import type { GetOnboardingStatusRequest, GetOnboardingStatusResponse, OnboardingPreferences } from "./types";

export const getStatus = api(
  { method: "POST", path: "/onboarding/status", expose: true },
  async (req: GetOnboardingStatusRequest): Promise<GetOnboardingStatusResponse> => {
    const result = await db.queryRow<OnboardingPreferences>`
      SELECT id, user_id, first_name, reason_for_joining, current_feeling, 
             preferred_check_in_time, reminder_preference, onboarding_completed, 
             onboarding_step, created_at, updated_at
      FROM onboarding_preferences
      WHERE user_id = ${req.user_id}
    `;

    if (result) {
      return {
        onboarding_completed: result.onboarding_completed,
        onboarding_step: result.onboarding_step,
        preferences: result
      };
    }

    await db.exec`
      INSERT INTO onboarding_preferences (user_id, onboarding_completed, onboarding_step)
      VALUES (${req.user_id}, FALSE, 0)
    `;

    return {
      onboarding_completed: false,
      onboarding_step: 0
    };
  }
);
