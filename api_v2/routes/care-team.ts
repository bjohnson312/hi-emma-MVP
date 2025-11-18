import type {
  ApiResponse,
  CareTeamMember,
  CreateMemberRequest,
  UpdateMemberRequest,
  CareTeamSetupProgress,
  ValidateSetupRequest,
  ValidationResponse,
} from '../types';

export const careTeamRoutes = {
  getMembers: async (): Promise<ApiResponse<CareTeamMember[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get care team members not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  createMember: async (req: CreateMemberRequest): Promise<ApiResponse<CareTeamMember>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Create care team member not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  updateMember: async (id: string, req: UpdateMemberRequest): Promise<ApiResponse<CareTeamMember>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Update care team member not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  deleteMember: async (id: string): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Delete care team member not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getSetupProgress: async (): Promise<ApiResponse<CareTeamSetupProgress>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get setup progress not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  completeSetup: async (): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Complete setup not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  validateSetup: async (req: ValidateSetupRequest): Promise<ApiResponse<ValidationResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Validate setup not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
