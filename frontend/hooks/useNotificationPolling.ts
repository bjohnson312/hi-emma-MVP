import { useEffect, useCallback } from "react";
import backend from "@/lib/backend-client";
import { useNotifications } from "./useNotifications";

export function useNotificationPolling(userId: string, enabled: boolean = true) {
  const { showNotification, permission } = useNotifications(userId);

  const pollNotifications = useCallback(async () => {
    if (!enabled || permission !== "granted") return;

    try {
      const response = await backend.notifications.getPendingNotifications({ user_id: userId });

      for (const notification of response.notifications) {
        showNotification(notification.title, {
          body: notification.message,
          icon: "/logo.png",
          tag: notification.notification_type,
          data: notification.metadata,
          requireInteraction: true,
        });
      }
    } catch (error) {
      console.error("Failed to poll notifications:", error);
    }
  }, [userId, enabled, permission, showNotification]);

  useEffect(() => {
    if (!enabled) return;

    pollNotifications();

    const interval = setInterval(pollNotifications, 30000);

    return () => clearInterval(interval);
  }, [pollNotifications, enabled]);

  return { pollNotifications };
}
