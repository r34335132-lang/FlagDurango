"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Bell, BellOff, X } from "lucide-react"

function NotificationManager() {
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showPrompt, setShowPrompt] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission)
      checkSubscription()

      // Show notification prompt after 60 seconds
      const timer = setTimeout(() => {
        if (Notification.permission === "default") {
          setShowPrompt(true)
        }
      }, 60000)

      return () => clearTimeout(timer)
    }
  }, [])

  const checkSubscription = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (error) {
        console.error("Error checking subscription:", error)
      }
    }
  }

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission()
      setPermission(permission)

      if (permission === "granted") {
        await subscribeToNotifications()
      }

      setShowPrompt(false)
    }
  }

  const subscribeToNotifications = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.error("Push messaging is not supported")
      return
    }

    setLoading(true)

    try {
      const registration = await navigator.serviceWorker.ready

      // VAPID public key (replace with your own)
      const vapidPublicKey = "BEl62iUYgUivxIkv69yViEuiBIa40HI80NM9f8HnVJOyuAcJidkAp1hF7-3GFxDnfbaHQHXvVffHstfn5NjjbI4"

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
    } finally {
      setLoading(false)
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

  // Don't show anything if notifications are not supported
  if (!("Notification" in window)) return null

  // Show permission prompt
  if (showPrompt && permission === "default") {
    return (
      <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Notificaciones</h3>
            </div>
            <button onClick={() => setShowPrompt(false)} className="text-blue-400 hover:text-blue-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-blue-800 mb-4">
            Recibe notificaciones sobre partidos en vivo, resultados y noticias importantes.
          </p>

          <div className="flex space-x-2">
            <Button
              onClick={requestNotificationPermission}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
              disabled={loading}
            >
              <Bell className="w-4 h-4 mr-2" />
              {loading ? "Activando..." : "Activar"}
            </Button>
            <Button onClick={() => setShowPrompt(false)} variant="outline" size="sm">
              Ahora no
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show notification toggle in bottom right if permission is granted
  if (permission === "granted") {
    return (
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={isSubscribed ? unsubscribeFromNotifications : subscribeToNotifications}
          variant={isSubscribed ? "default" : "outline"}
          size="sm"
          className={`shadow-lg ${isSubscribed ? "bg-green-600 hover:bg-green-700" : "bg-white hover:bg-gray-50"}`}
          disabled={loading}
        >
          {isSubscribed ? (
            <>
              <Bell className="w-4 h-4 mr-2" />
              Activas
            </>
          ) : (
            <>
              <BellOff className="w-4 h-4 mr-2" />
              Inactivas
            </>
          )}
        </Button>
      </div>
    )
  }

  return null
}

export default NotificationManager
