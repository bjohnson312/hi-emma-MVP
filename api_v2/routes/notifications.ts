import type {
  ApiResponse,
  NotificationPreferences,
  ScheduleNotificationRequest,
  ScheduledNotification,
  NotificationHistory,
} from '../types';

export const notificationsRoutes = {
  getPreferences: async (): Promise<ApiResponse<NotificationPreferences>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get notification preferences not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  updatePreferences: async (req: NotificationPreferences): Promise<ApiResponse<NotificationPreferences>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Update notification preferences not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  schedule: async (req: ScheduleNotificationRequest): Promise<ApiResponse<ScheduledNotification>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Schedule notification not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getScheduled: async (): Promise<ApiResponse<ScheduledNotification[]>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get scheduled notifications not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  cancel: async (id: string): Promise<ApiResponse<void>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Cancel notification not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
  getHistory: async (): Promise<ApiResponse<NotificationHistory>> => ({
    success: false,
    error: { code: 'NOT_IMPLEMENTED', message: 'Get notification history not implemented' },
    meta: { timestamp: new Date().toISOString() },
  }),
};
