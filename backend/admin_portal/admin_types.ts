export interface SystemInfo {
  version: string;
  releaseTimestamp: string;
  environment: string;
  uptime: number;
}

export interface SystemInfoResponse {
  info: SystemInfo;
}

export interface AccessStats {
  totalAccess: number;
  uniqueUsers: number;
  todayAccess: number;
  weeklyAccess: number;
}

export interface AccessStatsResponse {
  stats: AccessStats;
}

export interface LogAccessRequest {
  userId: string;
  action: string;
}

export interface LogAccessResponse {
  success: boolean;
}

export interface DeactivateUserRequest {
  userId: string;
}

export interface DeactivateUserResponse {
  success: boolean;
  message: string;
}

export interface ExportUsersResponse {
  csv: string;
}
