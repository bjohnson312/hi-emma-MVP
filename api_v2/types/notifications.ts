export interface NotificationPreferences {
  channels: NotificationChannelConfig[];
  quietHours?: QuietHours;
  categories: CategoryPreference[];
}

export interface NotificationChannelConfig {
  type: 'push' | 'sms' | 'email';
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface QuietHours {
  enabled: boolean;
  start: string;
  end: string;
  timezone: string;
}

export interface CategoryPreference {
  category: string;
  enabled: boolean;
  channels: ('push' | 'sms' | 'email')[];
}

export interface ScheduleNotificationRequest {
  type: string;
  title: string;
  message: string;
  scheduledFor: string;
  channel: 'push' | 'sms' | 'email';
  recurring?: RecurringPattern;
  data?: Record<string, any>;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  daysOfWeek?: number[];
  endDate?: string;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  scheduledFor: string;
  channel: 'push' | 'sms' | 'email';
  recurring?: RecurringPattern;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  createdAt: string;
}

export interface NotificationHistory {
  notifications: SentNotification[];
  total: number;
}

export interface SentNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  channel: 'push' | 'sms' | 'email';
  sentAt: string;
  status: 'delivered' | 'failed';
}
