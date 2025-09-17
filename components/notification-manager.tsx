export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export const VAPID_KEYS = {
  publicKey: "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f53NlqKOYWsSBhjuXPiQfzuVAl9Hs4HcKSVdJiKz0g5JwQw5Y8g",
  privateKey: "wUyGL_-xaQlrAO2UwcqJmxfWAVAdKtMcF_QMVeLOTLU",
}

export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export async function sendNotification(subscription: PushSubscription, payload: string): Promise<void> {
  const webpush = await import("web-push")

  webpush.setVapidDetails("mailto:admin@ligaflagdurango.com", VAPID_KEYS.publicKey, VAPID_KEYS.privateKey)

  try {
    await webpush.sendNotification(subscription, payload)
  } catch (error) {
    console.error("Error sending notification:", error)
    throw error
  }
}

export function createNotificationPayload(title: string, body: string, url?: string): string {
  return JSON.stringify({
    title,
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    url: url || "/",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: url || "/",
    },
    actions: [
      {
        action: "explore",
        title: "Ver más",
      },
      {
        action: "close",
        title: "Cerrar",
      },
    ],
  })
}
