self.addEventListener('push', function (event) {
  console.log('[Service Worker] Push Received:', event);

  let data = {};
  try {
    if (event.data) {
      data = event.data.json(); // coba parse JSON
    }
  } catch (err) {
    console.error('[Service Worker] Failed to parse push data as JSON:', err);
    // fallback kalau bukan JSON (misalnya string biasa)
    data = {
      title: 'Default Notification',
      body: event.data ? event.data.text() : 'No payload',
      icon: '/icon-192x192.png',
    };
  }

  const options = {
    body: data.body || 'No body provided',
    icon: data.icon || '/icon-192x192.png',
    badge: '/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2',
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', function (event) {
  console.log('[Service Worker] Notification click received.');
  event.notification.close();

  event.waitUntil(
    clients.openWindow('https://solvee.vercel.app/') 
    // ganti dengan domain deploy kamu misalnya 'https://solvee.vercel.app/'
  );
});
