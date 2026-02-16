export interface User {
  id: string;
  email: string;
  name: string;
  created_at: Date;
  last_login?: Date;
  is_active: boolean;
  login_count?: number;
  phone_number?: string | null;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

export interface ResetPasswordRequest {
  userId: string;
  customPassword?: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
  temporaryPassword?: string;
}

export interface UsageStats {
  totalUsers: number;
  totalAccesses: number;
  todayAccesses: number;
  last7Days: number;
  last30Days: number;
  avgPerUser: number;
  activeUsers: number;
  totalConversations: number;
  totalMorningRoutines: number;
  totalJournalEntries: number;
  totalMealPlans: number;
  avgSessionsPerUser: number;
  avgTimePerSession: number;
  totalCareTeamMembers: number;
  totalWellnessEntries: number;
}

export interface UsageStatsResponse {
  stats: UsageStats;
  topUsers: {
    userId: string;
    email: string;
    conversationCount: number;
    totalSessions: number;
  }[];
}

export interface SyncClerkUsersResponse {
  success: boolean;
  synced: number;
  errors: number;
  message: string;
}
