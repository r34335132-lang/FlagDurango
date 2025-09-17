const CACHE_NAME = "liga-flag-durango-v1"
const urlsToCache = [
  "/",
  "/partidos",
  "/estadisticas",
  "/equipos",
  "/wildbrowl",
  "/noticias",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache)
    }),
  )
})

// Fetch event
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return response || fetch(event.request)
    }),
  )
})

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
})

// Push event for notifications
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "Nueva notificación de Liga Flag Durango",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: "2",
    },
    actions: [
      {
        action: "explore",
        title: "Ver más",
        icon: "/icons/icon-96x96.png",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/icons/icon-96x96.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Liga Flag Durango", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    // Open the app
    event.waitUntil(clients.openWindow("/"))
  } else if (event.action === "close") {
    // Just close the notification
    event.notification.close()
  } else {
    // Default action - open the app
    event.waitUntil(clients.openWindow("/"))
  }
})

// Background sync
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  return fetch("/api/sync")
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      console.log("Background sync completed:", data)
    })
    .catch((error) => {
      console.error("Background sync failed:", error)
    })
}
