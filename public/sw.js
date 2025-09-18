const CACHE_NAME = "liga-flag-durango-v1"
const STATIC_CACHE_URLS = [
  "/",
  "/partidos",
  "/estadisticas",
  "/equipos",
  "/wildbrowl",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/imagenes/20años.png",
]

// Install event
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache
        .addAll(
          STATIC_CACHE_URLS.map((url) => {
            return new Request(url, { cache: "reload" })
          }),
        )
        .catch((error) => {
          console.error("Failed to cache resources during install:", error)
          // Continue installation even if some resources fail to cache
          return Promise.resolve()
        })
    }),
  )
  self.skipWaiting()
})

// Activate event
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
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

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith("http")) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch from network
      return (
        response ||
        fetch(event.request)
          .then((fetchResponse) => {
            // Don't cache API responses or non-successful responses
            if (event.request.url.includes("/api/") || !fetchResponse.ok) {
              return fetchResponse
            }

            // Clone the response before caching
            const responseToCache = fetchResponse.clone()
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })
              .catch((error) => {
                console.error("Failed to cache response:", error)
              })

            return fetchResponse
          })
          .catch((error) => {
            console.error("Fetch failed:", error)
            // Return a basic offline page for navigation requests
            if (event.request.mode === "navigate") {
              return caches.match("/") || new Response("Offline", { status: 503 })
            }
            throw error
          })
      )
    }),
  )
})

// Push event
self.addEventListener("push", (event) => {
  if (!event.data) {
    return
  }

  try {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || "/icons/icon-192x192.png",
      badge: data.badge || "/icons/icon-72x72.png",
      image: data.image,
      data: data.data,
      actions: data.actions || [],
      tag: data.tag,
      requireInteraction: data.requireInteraction || false,
      silent: false,
      vibrate: [200, 100, 200],
    }

    event.waitUntil(self.registration.showNotification(data.title, options))
  } catch (error) {
    console.error("Error showing notification:", error)
    // Show a basic notification if parsing fails
    event.waitUntil(
      self.registration.showNotification("Liga Flag Durango", {
        body: "Nueva actualización disponible",
        icon: "/icons/icon-192x192.png",
      }),
    )
  }
})

// Notification click event
self.addEventListener("notificationclick", (event) => {
  event.notification.close()

  const action = event.action
  const data = event.notification.data || {}

  let url = "/"

  if (action === "view" && data.url) {
    url = data.url
  } else if (data.url) {
    url = data.url
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus()
          }
        }

        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
      .catch((error) => {
        console.error("Error handling notification click:", error)
      }),
  )
})

// Background sync event
self.addEventListener("sync", (event) => {
  if (event.tag === "background-sync") {
    event.waitUntil(
      // Perform background sync operations
      fetch("/api/sync")
        .then((response) => {
          if (response.ok) {
            console.log("Background sync completed")
          }
        })
        .catch((error) => {
          console.error("Background sync failed:", error)
        }),
    )
  }
})

// Message event (for communication with main thread)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})
