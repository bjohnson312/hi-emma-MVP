import { api } from "encore.dev/api";
import db from "../db";
import type { UpdateOnboardingStepRequest, UpdateOnboardingStepResponse } from "./types";

const getNextQuestion = (step: number, firstName?: string): string => {
  switch (step) {
    case 1:
      return `Nice to meet you${firstName ? `, ${firstName}` : ''}! What brought you to Hi, Emma today?`;
    case 2:
      return "How have you been feeling lately?";
    case 3:
      return "When would you like me to check in with you?";
    case 4:
      return "How would you like to receive reminders?";
    default:
      return "";
  }
};

export const updateStep = api(
  { method: "POST", path: "/onboarding/update-step", expose: true, auth: false },
  async (req: UpdateOnboardingStepRequest): Promise<UpdateOnboardingStepResponse> => {
    let firstName: string | undefined = req.first_name;
    
    if (req.step === 1 && req.first_name) {
      await db.exec`
        UPDATE onboarding_preferences
        SET onboarding_step = ${req.step}, first_name = ${req.first_name}, updated_at = NOW()
        WHERE user_id = ${req.user_id}
      `;
    } else if (req.step === 2 && req.reason_for_joining) {
      const result = await db.queryRow<{ first_name: string | null }>`
        UPDATE onboarding_preferences
        SET onboarding_step = ${req.step}, reason_for_joining = ${req.reason_for_joining}, updated_at = NOW()
        WHERE user_id = ${req.user_id}
        RETURNING first_name
      `;
      firstName = result?.first_name || firstName;
    } else if (req.step === 3 && req.current_feeling) {
      const result = await db.queryRow<{ first_name: string | null }>`
        UPDATE onboarding_preferences
        SET onboarding_step = ${req.step}, current_feeling = ${req.current_feeling}, updated_at = NOW()
        WHERE user_id = ${req.user_id}
        RETURNING first_name
      `;
      firstName = result?.first_name || firstName;
    } else if (req.step === 4 && req.preferred_check_in_time) {
      const result = await db.queryRow<{ first_name: string | null }>`
        UPDATE onboarding_preferences
        SET onboarding_step = ${req.step}, preferred_check_in_time = ${req.preferred_check_in_time}, updated_at = NOW()
        WHERE user_id = ${req.user_id}
        RETURNING first_name
      `;
      firstName = result?.first_name || firstName;
    } else if (req.step === 5 && req.reminder_preference) {
      const result = await db.queryRow<{ first_name: string | null }>`
        UPDATE onboarding_preferences
        SET onboarding_step = ${req.step}, reminder_preference = ${req.reminder_preference}, updated_at = NOW()
        WHERE user_id = ${req.user_id}
        RETURNING first_name
      `;
      firstName = result?.first_name || firstName;
    } else {
      await db.exec`
        UPDATE onboarding_preferences
        SET onboarding_step = ${req.step}, updated_at = NOW()
        WHERE user_id = ${req.user_id}
      `;
    }
    
    const isCompleted = req.step >= 5;
    
    return {
      success: true,
      current_step: req.step,
      next_question: isCompleted ? "" : getNextQuestion(req.step, firstName),
      onboarding_completed: isCompleted
    };
  }
);
