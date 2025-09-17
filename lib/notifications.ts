interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export async function sendNotification(
  subscription: PushSubscription,
  payload: {
    title: string
    body: string
    icon?: string
    badge?: string
    data?: any
  },
) {
  const webpush = require("web-push")

  // Set VAPID details
  webpush.setVapidDetails(
    "mailto:admin@ligaflagdurango.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnVJOyuAcJidkAp1hF7-3GFxDnfbaHQHXvVffHstfn5NjjbI4",
    process.env.VAPID_PRIVATE_KEY || "your-private-key-here",
  )

  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload))
    console.log("Notification sent successfully")
  } catch (error) {
    console.error("Error sending notification:", error)
    throw error
  }
}

export function createGameNotification(gameData: {
  homeTeam: string
  awayTeam: string
  status: string
  homeScore?: number
  awayScore?: number
}) {
  if (gameData.status === "en_vivo") {
    return {
      title: "🔴 Partido EN VIVO",
      body: `${gameData.homeTeam} vs ${gameData.awayTeam}`,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      data: {
        type: "game_live",
        gameData,
      },
    }
  }

  if (gameData.status === "finalizado") {
    return {
      title: "🏁 Partido Finalizado",
      body: `${gameData.homeTeam} ${gameData.homeScore || 0} - ${gameData.awayScore || 0} ${gameData.awayTeam}`,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-96x96.png",
      data: {
        type: "game_finished",
        gameData,
      },
    }
  }

  return null
}

export function createNewsNotification(newsData: {
  title: string
  content: string
}) {
  return {
    title: "📰 Nueva Noticia",
    body: newsData.title,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-96x96.png",
    data: {
      type: "news",
      newsData,
    },
  }
}
