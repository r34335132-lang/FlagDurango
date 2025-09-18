// Service Worker para notificaciones push
const CACHE_NAME = "liga-flag-durango-v1"
const urlsToCache = [
  "/",
  "/partidos",
  "/estadisticas",
  "/equipos",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
]

// Instalar Service Worker
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache")
      return cache.addAll(urlsToCache)
    }),
  )
})

// Activar Service Worker
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
})

// Interceptar requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }
      return fetch(event.request)
    }),
  )
})

// Manejar notificaciones push
self.addEventListener("push", (event) => {
  console.log("Push event received:", event)

  let notificationData = {
    title: "Liga Flag Durango",
    body: "Nueva notificación",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: { url: "/" },
  }

  if (event.data) {
    try {
      notificationData = event.data.json()
      console.log("Notification data:", notificationData)
    } catch (error) {
      console.error("Error parsing notification data:", error)
      notificationData.body = event.data.text()
    }
  }

  const notificationOptions = {
    body: notificationData.body,
    icon: notificationData.icon || "/icons/icon-192x192.png",
    badge: notificationData.badge || "/icons/icon-72x72.png",
    image: notificationData.image,
    data: notificationData.data || { url: "/" },
    actions: notificationData.actions || [
      {
        action: "view",
        title: "Ver",
        icon: "/icons/icon-96x96.png",
      },
    ],
    tag: notificationData.tag || "default",
    requireInteraction: notificationData.requireInteraction || false,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
  }

  event.waitUntil(self.registration.showNotification(notificationData.title, notificationOptions))
})

// Manejar clicks en notificaciones
self.addEventListener("notificationclick", (event) => {
  console.log("Notification click received:", event)

  event.notification.close()

  const urlToOpen = event.notification.data?.url || "/"

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocarla
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus()
        }
      }

      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    }),
  )
})

// Manejar cierre de notificaciones
self.addEventListener("notificationclose", (event) => {
  console.log("Notification closed:", event)
})
