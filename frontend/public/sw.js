self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Notification';
  const options = {
    body: data.message || data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.metadata || {},
    requireInteraction: true,
    tag: data.notification_type || 'default',
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});
