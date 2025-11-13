import { useState, useEffect } from 'react';
import backend from '~backend/client';

interface UsePushNotificationsReturn {
  isSupported: boolean;
  isSubscribed: boolean;
  permission: NotificationPermission;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications(userId?: string): UsePushNotificationsReturn {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' && 
                      'Notification' in window && 
                      'serviceWorker' in navigator &&
                      'PushManager' in window;

  useEffect(() => {
    if (!isSupported) return;

    const currentPermission = Notification.permission;
    setPermission(currentPermission);
    console.log('Current notification permission:', currentPermission);

    checkSubscription();
  }, [userId, isSupported]);

  const checkSubscription = async () => {
    if (!isSupported || !userId) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking push subscription:', err);
    }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || !userId) {
      setError('Push notifications not supported');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Requesting notification permission...');
      const currentPermission = await Notification.requestPermission();
      setPermission(currentPermission);
      console.log('Permission result:', currentPermission);

      if (currentPermission !== 'granted') {
        setError('Permission denied - please allow notifications in your browser');
        setIsLoading(false);
        return false;
      }

      console.log('Waiting for service worker...');
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker ready:', registration);
      
      if (!registration || !registration.active) {
        throw new Error('Service worker not active - please refresh the page');
      }

      console.log('Fetching VAPID public key...');
      const { publicKey } = await backend.push.getPublicKey();
      console.log('Got public key');

      console.log('Subscribing to push manager...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });
      console.log('Push subscription created');

      const subscriptionJson = subscription.toJSON();

      console.log('Saving subscription to backend...');
      await backend.push.subscribe({
        userId,
        subscription: {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscriptionJson.keys?.p256dh || '',
            auth: subscriptionJson.keys?.auth || ''
          }
        },
        userAgent: navigator.userAgent
      });
      console.log('Subscription saved successfully');

      setIsSubscribed(true);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error subscribing to push notifications:', err);
      
      let errorMessage = 'Failed to subscribe';
      if (err instanceof Error) {
        errorMessage = err.message;
        
        if (err.message.includes('not configured')) {
          errorMessage = 'Push notifications are not configured on the server. Please add VAPID keys to Settings.';
        } else if (err.message.includes('permission')) {
          errorMessage = 'Permission denied - please allow notifications in your browser settings';
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    if (!isSupported || !userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await backend.push.unsubscribe({
          userId,
          endpoint: subscription.endpoint
        });

        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      setIsLoading(false);
      return true;
    } catch (err) {
      console.error('Error unsubscribing from push notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to unsubscribe');
      setIsLoading(false);
      return false;
    }
  };

  return {
    isSupported,
    isSubscribed,
    permission,
    subscribe,
    unsubscribe,
    isLoading,
    error
  };
}
