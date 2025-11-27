export interface OnboardingPreferences {
  id: number;
  user_id: string;
  first_name?: string;
  name_pronunciation?: string | null;
  reason_for_joining?: string;
  current_feeling?: string;
  preferred_check_in_time?: string;
  reminder_preference?: string;
  onboarding_completed: boolean;
  onboarding_step: number;
  created_at: Date;
  updated_at: Date;
}

export interface GetOnboardingStatusRequest {
  user_id: string;
}

export interface GetOnboardingStatusResponse {
  onboarding_completed: boolean;
  onboarding_step: number;
  preferences?: OnboardingPreferences;
}

export interface UpdateOnboardingStepRequest {
  user_id: string;
  step: number;
  first_name?: string;
  name_pronunciation?: string;
  reason_for_joining?: string;
  current_feeling?: string;
  preferred_check_in_time?: string;
  reminder_preference?: string;
}

export interface UpdateOnboardingStepResponse {
  success: boolean;
  current_step: number;
  next_question?: string;
  onboarding_completed: boolean;
}

export interface CompleteOnboardingRequest {
  user_id: string;
}

export interface CompleteOnboardingResponse {
  success: boolean;
  welcome_message: string;
}
