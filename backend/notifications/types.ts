export interface NotificationPreferences {
  id: number;
  user_id: string;
  morning_checkin_enabled: boolean;
  morning_checkin_time: string;
  medication_reminders_enabled: boolean;
  evening_reflection_enabled: boolean;
  evening_reflection_time: string;
  notification_method: "browser" | "sms" | "both";
  phone_number?: string;
  push_subscription?: PushSubscription;
  timezone: string;
  created_at: Date;
  updated_at: Date;
}

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UpdateNotificationPreferencesRequest {
  user_id: string;
  morning_checkin_enabled?: boolean;
  morning_checkin_time?: string;
  medication_reminders_enabled?: boolean;
  evening_reflection_enabled?: boolean;
  evening_reflection_time?: string;
  notification_method?: "browser" | "sms" | "both";
  phone_number?: string;
  timezone?: string;
}

export interface RegisterPushSubscriptionRequest {
  user_id: string;
  subscription: PushSubscription;
}

export interface GetNotificationPreferencesRequest {
  user_id: string;
}

export interface NotificationQueueItem {
  id: number;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  scheduled_time: Date;
  sent_at?: Date;
  delivery_method: "browser" | "sms";
  status: "pending" | "sent" | "failed";
  metadata?: Record<string, any>;
  error_message?: string;
  created_at: Date;
}

export interface ScheduleMedicationReminderRequest {
  user_id: string;
  doctors_order_id: number;
  scheduled_time: Date;
  medication_name: string;
  dosage: string;
}

export interface SendNotificationRequest {
  user_id: string;
  title: string;
  message: string;
  notification_type: string;
  metadata?: Record<string, any>;
}
