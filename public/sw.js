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
  "/imagenes/20años.png",
  "/generic-sponsor-logo.png",
]

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("Failed to cache resources:", error)
        // Cache individual resources that succeed
        return Promise.allSettled(urlsToCache.map((url) => cache.add(url)))
      })
    }),
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...")
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
  self.clients.claim()
})

// Fetch event
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return
  }

  // Skip requests to external domains
  if (!event.request.url.startsWith(self.location.origin)) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if available
      if (response) {
        return response
      }

      // Fetch from network
      return fetch(event.request)
        .then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response
          }

          // Clone the response
          const responseToCache = response.clone()

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })

          return response
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match("/")
          }
        })
    }),
  )
})

// Push event for notifications
self.addEventListener("push", (event) => {
  console.log("Push event received:", event)

  let notificationData = {
    title: "Liga Flag Durango",
    body: "Nueva notificación",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: {},
  }

  if (event.data) {
    try {
      const data = event.data.json()
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: data.data || {},
      }
    } catch (e) {
      notificationData.body = event.data.text() || notificationData.body
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [100, 50, 100],
    data: notificationData.data,
    actions: [
      {
        action: "view",
        title: "Ver",
        icon: "/icons/icon-96x96.png",
      },
      {
        action: "close",
        title: "Cerrar",
      },
    ],
    requireInteraction: false,
    silent: false,
    tag: "liga-flag-notification",
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, options))
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received:", event)

  event.notification.close()

  if (event.action === "view") {
    const urlToOpen = event.notification.data.url || "/"
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus()
          }
        }
        // If not, open a new window/tab
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen)
        }
      }),
    )
  } else if (event.action === "close") {
    // Just close the notification
    return
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus()
        }
        if (clients.openWindow) {
          return clients.openWindow("/")
        }
      }),
    )
  }
})

// Background sync
self.addEventListener("sync", (event) => {
  console.log("Background sync event:", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(doBackgroundSync())
  }
})

function doBackgroundSync() {
  return fetch("/api/sync")
    .then((response) => {
      if (response.ok) {
        console.log("Background sync completed successfully")
        return response.json()
      }
      throw new Error("Background sync failed")
    })
    .then((data) => {
      console.log("Background sync data:", data)
    })
    .catch((error) => {
      console.error("Background sync failed:", error)
    })
}

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  console.log("Service Worker received message:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
