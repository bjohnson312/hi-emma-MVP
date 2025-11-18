import type {
  ApiResponse,
  AdminAuthResponse,
  AdminUser,
  UsageStats,
  AccessStats,
  SystemInfo,
  DeactivateUserRequest,
  ResetPasswordRequest,
  ExportUsersRequest,
} from '../types';

export const adminRoutes = {
  login: async (req: { email: string; password: string }): Promise<ApiResponse<AdminAuthResponse>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Admin login not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getUsers: async (): Promise<ApiResponse<AdminUser[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get users not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  deactivateUser: async (id: string, req: DeactivateUserRequest): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Deactivate user not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  resetPassword: async (id: string, req: ResetPasswordRequest): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Reset password not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getUsageStats: async (): Promise<ApiResponse<UsageStats>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get usage stats not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getAccessStats: async (): Promise<ApiResponse<AccessStats>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get access stats not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getSystemInfo: async (): Promise<ApiResponse<SystemInfo>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get system info not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  exportUsers: async (req: ExportUsersRequest): Promise<ApiResponse<any>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Export users not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
