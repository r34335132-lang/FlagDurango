export interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  actions?: NotificationAction[]
  tag?: string
  requireInteraction?: boolean
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export const NOTIFICATION_TYPES = {
  GAME_LIVE: "game_live",
  GAME_RESULT: "game_result",
  NEWS: "news",
  WILDBROWL: "wildbrowl",
  GENERAL: "general",
} as const

export type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

export const createNotificationPayload = (type: NotificationType, data: any): NotificationPayload => {
  switch (type) {
    case NOTIFICATION_TYPES.GAME_LIVE:
      return {
        title: "🔴 Partido EN VIVO",
        body: `${data.home_team} vs ${data.away_team} - ${data.home_score || 0}-${data.away_score || 0}`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: `game_${data.id}`,
        data: { type, gameId: data.id, url: "/partidos" },
        actions: [
          { action: "view", title: "Ver Partido", icon: "/icons/icon-72x72.png" },
          { action: "close", title: "Cerrar" },
        ],
        requireInteraction: true,
      }

    case NOTIFICATION_TYPES.GAME_RESULT:
      return {
        title: "⚡ Resultado Final",
        body: `${data.home_team} ${data.home_score} - ${data.away_score} ${data.away_team}`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: `result_${data.id}`,
        data: { type, gameId: data.id, url: "/partidos" },
        actions: [{ action: "view", title: "Ver Detalles", icon: "/icons/icon-72x72.png" }],
      }

    case NOTIFICATION_TYPES.WILDBROWL:
      return {
        title: "🎯 WildBrowl 1v1",
        body: data.message || "¡Nueva actualización en el torneo!",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: "wildbrowl",
        data: { type, url: "/wildbrowl" },
        actions: [{ action: "view", title: "Ver Torneo", icon: "/icons/icon-72x72.png" }],
      }

    case NOTIFICATION_TYPES.NEWS:
      return {
        title: "📰 Nueva Noticia",
        body: data.title,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        image: data.image_url,
        tag: `news_${data.id}`,
        data: { type, newsId: data.id, url: "/noticias" },
        actions: [{ action: "view", title: "Leer Más", icon: "/icons/icon-72x72.png" }],
      }

    default:
      return {
        title: "Liga Flag Durango",
        body: data.message || "Nueva actualización disponible",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        data: { type, url: "/" },
      }
  }
}
