// Install event → langsung aktif tanpa tunggu SW lama selesai
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installed");
  self.skipWaiting();
});

// Activate event → klaim semua tab langsung pakai SW terbaru
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activated");
  event.waitUntil(clients.claim());
});

// Handle push event
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push received:", event);

  let data = {};
  try {
    if (event.data) {
      data = event.data.json(); // coba parse JSON
    }
  } catch (err) {
    console.error("[Service Worker] Failed to parse push data as JSON:", err);
    data = {
      title: "Default Notification",
      body: event.data ? event.data.text() : "No payload",
      icon: "/icon-192x192.png",
    };
  }

  const options = {
    body: data.body || "No body provided",
    icon: data.icon || "/icon-192x192.png",
    badge: "/badge.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "2",
      url: data.url || "/", // bisa dipakai buat deep-link
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "Notification", options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click received.");
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "https://localhost:3000/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
