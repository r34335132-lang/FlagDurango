"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, X, BellOff } from "lucide-react"

export default function NotificationManager() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission)
      checkSubscriptionStatus()

      // Show notification prompt after 1 minute if not already granted or denied
      if (Notification.permission === "default") {
        const timer = setTimeout(() => {
          setShowPrompt(true)
        }, 60000)

        return () => clearTimeout(timer)
      }
    }
  }, [])

  const checkSubscriptionStatus = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error("Error checking subscription status:", error)
      }
    }
  }

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return
    }

    setLoading(true)

    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === "granted") {
        // Subscribe to push notifications
        await subscribeToNotifications()
        setShowPrompt(false)

        // Show welcome notification
        new Notification("¡Notificaciones activadas!", {
          body: "Recibirás notificaciones sobre partidos en vivo y resultados.",
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          tag: "welcome-notification",
        })
      } else {
        setShowPrompt(false)
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.error("Push messaging is not supported")
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready

      // VAPID public key - replace with your own in production
      const vapidPublicKey = "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f53NlqKOYWsSBhjuXPiQfzuVAl9Hs4HcKSVdJiKz0g5JwQw5Y8g"

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      // Send subscription to server
      const response = await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      })

      if (response.ok) {
        setIsSubscribed(true)
        console.log("Successfully subscribed to notifications")
      } else {
        console.error("Failed to subscribe to notifications")
      }
    } catch (error) {
      console.error("Error subscribing to notifications:", error)
    }
  }

  const unsubscribeFromNotifications = async () => {
    if (!("serviceWorker" in navigator)) return

    setLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Notify server
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        setIsSubscribed(false)
        console.log("Successfully unsubscribed from notifications")
      }
    } catch (error) {
      console.error("Error unsubscribing from notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Don't show again for 24 hours
    if (typeof window !== "undefined") {
      localStorage.setItem("notification-prompt-dismissed", Date.now().toString())
    }
  }

  // Don't show if notifications are not supported
  if (!("Notification" in window)) {
    return null
  }

  // Check if dismissed recently
  if (typeof window !== "undefined") {
    const dismissedTime = localStorage.getItem("notification-prompt-dismissed")
    if (dismissedTime && Date.now() - Number.parseInt(dismissedTime) < 24 * 60 * 60 * 1000) {
      return null
    }
  }

  // Show permission prompt
  if (showPrompt && permission === "default") {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm">
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notificaciones</h3>
                <p className="text-sm text-gray-600">Liga Flag Durango</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleDismiss} className="p-1 h-auto">
              <X className="w-4 h-4" />
            </Button>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Recibe notificaciones sobre partidos en vivo, resultados y noticias importantes.
          </p>

          <div className="flex gap-2">
            <Button
              onClick={requestNotificationPermission}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
              disabled={loading}
            >
              <Bell className="w-4 h-4 mr-2" />
              {loading ? "Activando..." : "Permitir"}
            </Button>
            <Button onClick={handleDismiss} variant="outline" size="sm">
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show notification toggle for granted permission
  if (permission === "granted") {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={isSubscribed ? unsubscribeFromNotifications : subscribeToNotifications}
          variant={isSubscribed ? "default" : "outline"}
          size="sm"
          className={`shadow-lg ${
            isSubscribed ? "bg-green-600 hover:bg-green-700 text-white" : "bg-white hover:bg-gray-50 text-gray-700"
          }`}
          disabled={loading}
        >
          {isSubscribed ? (
            <>
              <Bell className="w-4 h-4 mr-2" />
              {loading ? "..." : "Activas"}
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4 mr-2" />
              {loading ? "..." : "Inactivas"}
            </>
          )}
        </Button>
      </div>
    )
  }

  return null
}
