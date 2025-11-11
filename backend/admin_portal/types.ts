export interface User {
  id: string;
  email: string;
  created_at: Date;
  last_login?: Date;
  is_active: boolean;
  login_count?: number;
}

export interface UserListResponse {
  users: User[];
  total: number;
}

export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface UsageStats {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  totalMorningRoutines: number;
  totalJournalEntries: number;
  totalMealPlans: number;
}

export interface UsageStatsResponse {
  stats: UsageStats;
  topUsers: {
    userId: string;
    email: string;
    conversationCount: number;
  }[];
}
