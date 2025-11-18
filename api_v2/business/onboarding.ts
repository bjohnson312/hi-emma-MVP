import type { OnboardingStatus, OnboardingStep } from '../types';

export function getNextOnboardingStep(
  status: OnboardingStatus
): OnboardingStep | null {
  throw new Error('getNextOnboardingStep() not implemented - CRITICAL: Onboarding flow logic');
}

export function isOnboardingComplete(
  completedSteps: string[]
): boolean {
  throw new Error('isOnboardingComplete() not implemented - CRITICAL: Onboarding completion');
}

export function calculateOnboardingProgress(
  completedSteps: string[],
  totalSteps: number
): number {
  throw new Error('calculateOnboardingProgress() not implemented');
}

export function validateOnboardingStepData(
  stepId: string,
  data: Record<string, any>
): { valid: boolean; errors?: Record<string, string> } {
  throw new Error('validateOnboardingStepData() not implemented');
}
