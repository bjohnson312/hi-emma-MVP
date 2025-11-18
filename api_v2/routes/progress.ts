import type {
  ApiResponse,
  ProgressSummary,
  CategoryProgress,
  UpdateProgressRequest,
  UpdateProgressResponse,
  Milestone,
  MilestonesQuery,
} from '../types';

export const progressRoutes = {
  getSummary: async (): Promise<ApiResponse<ProgressSummary>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get progress summary not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getByCategory: async (): Promise<ApiResponse<CategoryProgress[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get progress by category not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  updateProgress: async (req: UpdateProgressRequest): Promise<ApiResponse<UpdateProgressResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Update progress not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getMilestones: async (query: MilestonesQuery): Promise<ApiResponse<Milestone[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get milestones not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getAchievedMilestones: async (): Promise<ApiResponse<Milestone[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get achieved milestones not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
