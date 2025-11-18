import type { ApiResponse, OnboardingStatus, CompleteStepRequest, CompleteStepResponse, UpdateStepRequest } from '../types';

export const onboardingRoutes = {
  getStatus: async (): Promise<ApiResponse<OnboardingStatus>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get onboarding status not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  completeStep: async (stepId: string, req: CompleteStepRequest): Promise<ApiResponse<CompleteStepResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Complete step not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  updateStep: async (stepId: string, req: UpdateStepRequest): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Update step not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  complete: async (): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Complete onboarding not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
