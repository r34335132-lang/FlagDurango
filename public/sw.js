// Service Worker para Liga Flag Durango
const CACHE_NAME = "liga-flag-durango-v2"
const urlsToCache = [
  "/",
  "/partidos",
  "/estadisticas",
  "/equipos",
  "/wildbrowl",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/imagenes/20años.png",
]

// Instalar Service Worker
self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...")
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("📦 Cache opened")
      return cache.addAll(urlsToCache).catch((error) => {
        console.error("❌ Failed to cache resources:", error)
        return Promise.resolve()
      })
    }),
  )
  self.skipWaiting()
})

// Activar Service Worker
self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activating...")
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("🗑️ Deleting old cache:", cacheName)
            return caches.delete(cacheName)
          }
        }),
      )
    }),
  )
  self.clients.claim()
})

// Interceptar requests
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return
  if (!event.request.url.startsWith("http")) return

  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request)
          .then((fetchResponse) => {
            if (event.request.url.includes("/api/") || !fetchResponse.ok) {
              return fetchResponse
            }

            const responseToCache = fetchResponse.clone()
            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache)
              })
              .catch((error) => {
                console.error("❌ Failed to cache response:", error)
              })

            return fetchResponse
          })
          .catch((error) => {
            console.error("❌ Fetch failed:", error)
            if (event.request.mode === "navigate") {
              return caches.match("/") || new Response("Offline", { status: 503 })
            }
            throw error
          })
      )
    }),
  )
})

// 🔔 MANEJAR NOTIFICACIONES PUSH
self.addEventListener("push", (event) => {
  console.log("📱 Push event received:", event)

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
      console.log("📄 Notification data:", notificationData)
    } catch (error) {
      console.error("❌ Error parsing notification data:", error)
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
      {
        action: "close",
        title: "Cerrar",
      },
    ],
    tag: notificationData.tag || "default",
    requireInteraction: notificationData.requireInteraction || true,
    vibrate: notificationData.vibrate || [200, 100, 200],
    timestamp: Date.now(),
    silent: false,
  }

  console.log("🔔 Showing notification with options:", notificationOptions)

  event.waitUntil(
    self.registration
      .showNotification(notificationData.title, notificationOptions)
      .then(() => {
        console.log("✅ Notification shown successfully")
      })
      .catch((error) => {
        console.error("❌ Error showing notification:", error)
      }),
  )
})

// 👆 MANEJAR CLICKS EN NOTIFICACIONES
self.addEventListener("notificationclick", (event) => {
  console.log("👆 Notification click received:", event)

  event.notification.close()

  const action = event.action
  const data = event.notification.data || {}

  if (action === "close") {
    console.log("🚫 User closed notification")
    return
  }

  const urlToOpen = data.url || "/"
  console.log("🌐 Opening URL:", urlToOpen)

  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Si ya hay una ventana abierta con la URL, enfocarla
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && "focus" in client) {
            console.log("🎯 Focusing existing window")
            return client.focus()
          }
        }

        // Si no hay ventana abierta, abrir una nueva
        if (clients.openWindow) {
          console.log("🆕 Opening new window")
          return clients.openWindow(urlToOpen)
        }
      })
      .catch((error) => {
        console.error("❌ Error handling notification click:", error)
      }),
  )
})

// 🚫 MANEJAR CIERRE DE NOTIFICACIONES
self.addEventListener("notificationclose", (event) => {
  console.log("🚫 Notification closed:", event.notification.tag)
})

// 💬 MANEJAR MENSAJES DEL CLIENTE
self.addEventListener("message", (event) => {
  console.log("💬 Message received:", event.data)

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting()
  }
})

// 🔄 BACKGROUND SYNC (para futuras funcionalidades)
self.addEventListener("sync", (event) => {
  console.log("🔄 Background sync:", event.tag)

  if (event.tag === "background-sync") {
    event.waitUntil(
      fetch("/api/sync")
        .then((response) => {
          if (response.ok) {
            console.log("✅ Background sync completed")
          }
        })
        .catch((error) => {
          console.error("❌ Background sync failed:", error)
        }),
    )
  }
})

console.log("🚀 Service Worker loaded and ready!")
