export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin';
  createdAt: string;
}

export interface AdminAuthResponse {
  admin: Admin;
  token: string;
  expiresAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastActive?: string;
  active: boolean;
}

export interface UsageStats {
  totalUsers: number;
  activeUsers: number;
  totalSessions: number;
  totalMessages: number;
  averageSessionLength: number;
  topFeatures: FeatureUsage[];
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  uniqueUsers: number;
}

export interface AccessStats {
  totalLogins: number;
  uniqueUsers: number;
  averageSessionsPerUser: number;
  peakUsageHours: number[];
}

export interface SystemInfo {
  version: string;
  uptime: number;
  environment: string;
  databaseStatus: 'healthy' | 'degraded' | 'down';
  apiStatus: 'healthy' | 'degraded' | 'down';
}

export interface DeactivateUserRequest {
  reason?: string;
}

export interface ResetPasswordRequest {
  newPassword?: string;
  sendEmail?: boolean;
}

export interface ExportUsersRequest {
  format: 'csv' | 'json';
  filters?: {
    active?: boolean;
    createdAfter?: string;
    createdBefore?: string;
  };
}
