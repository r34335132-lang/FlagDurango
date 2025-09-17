export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
}

export class NotificationService {
  private static instance: NotificationService
  private vapidPublicKey: string

  private constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!("Notification" in window)) {
      throw new Error("This browser does not support notifications")
    }

    return await Notification.requestPermission()
  }

  async subscribe(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Push messaging is not supported")
    }

    try {
      const registration = await navigator.serviceWorker.ready

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
      })

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription)

      return subscription
    } catch (error) {
      console.error("Error subscribing to push notifications:", error)
      return null
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        const successful = await subscription.unsubscribe()

        if (successful) {
          await this.removeSubscriptionFromServer(subscription)
        }

        return successful
      }

      return true
    } catch (error) {
      console.error("Error unsubscribing from push notifications:", error)
      return false
    }
  }

  async getSubscription(): Promise<PushSubscription | null> {
    if (!("serviceWorker" in navigator)) {
      return null
    }

    try {
      const registration = await navigator.serviceWorker.ready
      return await registration.pushManager.getSubscription()
    } catch (error) {
      console.error("Error getting subscription:", error)
      return null
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription }),
      })

      if (!response.ok) {
        throw new Error("Failed to send subscription to server")
      }
    } catch (error) {
      console.error("Error sending subscription to server:", error)
      throw error
    }
  }

  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch("/api/notifications/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ subscription }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove subscription from server")
      }
    } catch (error) {
      console.error("Error removing subscription from server:", error)
      throw error
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Utility methods for common notification scenarios
  async notifyGameStart(homeTeam: string, awayTeam: string): Promise<void> {
    if (Notification.permission === "granted") {
      new Notification("¡Partido Iniciado!", {
        body: `${homeTeam} vs ${awayTeam} - El partido ha comenzado`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: "game-start",
        vibrate: [200, 100, 200],
      })
    }
  }

  async notifyGameEnd(homeTeam: string, awayTeam: string, homeScore: number, awayScore: number): Promise<void> {
    if (Notification.permission === "granted") {
      new Notification("¡Partido Finalizado!", {
        body: `${homeTeam} ${homeScore} - ${awayScore} ${awayTeam}`,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/icon-72x72.png",
        tag: "game-end",
        vibrate: [100, 50, 100, 50, 100],
      })
    }
  }
}

export const notificationService = NotificationService.getInstance()
