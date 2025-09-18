// VAPID keys for push notifications
export const VAPID_KEYS = {
  publicKey: "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f53NlqKOYWsSBhjuXPiQfzuVAl9Hs4HcKSVdJiKz0g5JwQw5Y8g",
  privateKey: process.env.VAPID_PRIVATE_KEY || "your-private-key-here",
}

// Notification types
export type NotificationType =
  | "game_started"
  | "game_finished"
  | "game_score_update"
  | "news_published"
  | "tournament_update"

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: {
    type: NotificationType
    url?: string
    gameId?: string
    teamId?: string
    [key: string]: any
  }
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
}

// Helper function to create notification payloads
export function createNotificationPayload(
  type: NotificationType,
  data: Partial<NotificationPayload>,
): NotificationPayload {
  const basePayload: NotificationPayload = {
    title: "Liga Flag Durango",
    body: "Nueva notificación",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    data: {
      type,
      url: "/",
    },
  }

  switch (type) {
    case "game_started":
      return {
        ...basePayload,
        title: "¡Partido en vivo!",
        body: data.body || "Un partido acaba de comenzar",
        data: {
          ...basePayload.data,
          type,
          url: "/partidos",
        },
        actions: [
          {
            action: "view_game",
            title: "Ver partido",
            icon: "/icons/icon-96x96.png",
          },
          {
            action: "close",
            title: "Cerrar",
          },
        ],
        ...data,
      }

    case "game_finished":
      return {
        ...basePayload,
        title: "Partido finalizado",
        body: data.body || "Un partido ha terminado",
        data: {
          ...basePayload.data,
          type,
          url: "/partidos",
        },
        actions: [
          {
            action: "view_results",
            title: "Ver resultado",
            icon: "/icons/icon-96x96.png",
          },
          {
            action: "close",
            title: "Cerrar",
          },
        ],
        ...data,
      }

    case "game_score_update":
      return {
        ...basePayload,
        title: "¡Gol!",
        body: data.body || "Se ha actualizado el marcador",
        data: {
          ...basePayload.data,
          type,
          url: "/partidos",
        },
        ...data,
      }

    case "news_published":
      return {
        ...basePayload,
        title: "Nueva noticia",
        body: data.body || "Se ha publicado una nueva noticia",
        data: {
          ...basePayload.data,
          type,
          url: "/noticias",
        },
        actions: [
          {
            action: "read_news",
            title: "Leer noticia",
            icon: "/icons/icon-96x96.png",
          },
          {
            action: "close",
            title: "Cerrar",
          },
        ],
        ...data,
      }

    case "tournament_update":
      return {
        ...basePayload,
        title: "Actualización del torneo",
        body: data.body || "Hay novedades en el torneo",
        data: {
          ...basePayload.data,
          type,
          url: "/wildbrowl",
        },
        actions: [
          {
            action: "view_tournament",
            title: "Ver torneo",
            icon: "/icons/icon-96x96.png",
          },
          {
            action: "close",
            title: "Cerrar",
          },
        ],
        ...data,
      }

    default:
      return {
        ...basePayload,
        ...data,
      }
  }
}

// Helper function to convert VAPID key
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

// Helper function to send push notification (server-side)
export async function sendPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
): Promise<boolean> {
  try {
    // This would typically use a library like web-push
    // For now, we'll just log the notification
    console.log("Sending push notification:", {
      endpoint: subscription.endpoint,
      payload,
    })

    return true
  } catch (error) {
    console.error("Error sending push notification:", error)
    return false
  }
}
