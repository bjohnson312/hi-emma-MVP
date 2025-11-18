import type { ApiResponse, LogMoodRequest, MoodEntry, MoodHistory, MoodInsights, MoodTrends } from '../types';

export const moodRoutes = {
  log: async (req: LogMoodRequest): Promise<ApiResponse<MoodEntry>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Log mood not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getHistory: async (params: { startDate?: string; endDate?: string }): Promise<ApiResponse<MoodHistory>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get mood history not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getInsights: async (): Promise<ApiResponse<MoodInsights>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get mood insights not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getTrends: async (params: { period?: 'week' | 'month' }): Promise<ApiResponse<MoodTrends>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get mood trends not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
