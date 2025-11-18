export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  preferences: UserPreferences;
}

export interface UserProfile {
  id: string;
  userId: string;
  email: string;
  name: string;
  dateOfBirth?: string;
  phone?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  voiceId?: string;
  notificationChannels: NotificationChannel[];
  morningRoutineTime?: string;
  eveningRoutineTime?: string;
  timezone: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
}

export type NotificationChannel = 'push' | 'sms' | 'email';

export interface UpdateProfileRequest {
  name?: string;
  dateOfBirth?: string;
  phone?: string;
  timezone?: string;
}

export interface UpdatePreferencesRequest {
  voiceId?: string;
  notificationChannels?: NotificationChannel[];
  morningRoutineTime?: string;
  eveningRoutineTime?: string;
  timezone?: string;
  language?: string;
  theme?: 'light' | 'dark' | 'system';
}
