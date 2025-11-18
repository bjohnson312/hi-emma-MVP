import type { RoutineSession, RoutineStep, StepResponse } from '../types';

export function determineNextStep(
  session: RoutineSession,
  response: StepResponse
): RoutineStep | null {
  throw new Error('determineNextStep() not implemented - CRITICAL: Core routine flow logic');
}

export function isRoutineComplete(
  session: RoutineSession,
  completedSteps: string[]
): boolean {
  throw new Error('isRoutineComplete() not implemented - CRITICAL: Completion determination');
}

export function calculateRoutineScore(
  session: RoutineSession
): number {
  throw new Error('calculateRoutineScore() not implemented');
}

export function validateRoutineStep(
  step: RoutineStep,
  response: StepResponse
): { valid: boolean; error?: string } {
  throw new Error('validateRoutineStep() not implemented');
}
