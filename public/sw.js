const CACHE_NAME = "liga-flag-durango-v1"
const urlsToCache = [
  "/",
  "/partidos",
  "/estadisticas",
  "/equipos",
  "/wildbrowl",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/imagenes/20años.png",
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
    badge: "/icons/icon-72x72.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Ver más",
        icon: "/icons/icon-192x192.png",
      },
      {
        action: "close",
        title: "Cerrar",
        icon: "/icons/icon-192x192.png",
      },
    ],
  }

  event.waitUntil(self.registration.showNotification("Liga Flag Durango", options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  if (event.action === "explore") {
    event.waitUntil(clients.openWindow("/"))
  } else if (event.action === "close") {
    event.notification.close()
  } else {
    event.waitUntil(clients.openWindow("/"))
  }
})
