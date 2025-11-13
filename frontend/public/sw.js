self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Emma Notification';
  const options = {
    body: data.body || data.message || 'You have a new notification',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/logo.png',
    data: {
      url: data.url || '/',
      timestamp: data.timestamp || Date.now(),
      ...data.metadata
    },
    requireInteraction: false,
    tag: data.tag || 'emma-notification',
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'open',
        title: 'Open'
      },
      {
        action: 'close',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  if (event.action === 'close') {
    return;
  }
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
